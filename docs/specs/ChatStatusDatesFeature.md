# Spec: ChatStatusDatesFeature

Scope: feature

# Feature Spec: ChatStatusDates

## Objetivo
Refatorar o fluxo de chats e mensagens do WhatsApp para garantir que a plataforma utilize a identidade correta da conversa, preserve o significado real de status de mensagens e interprete datas/timestamps de forma consistente em toda a cadeia de leitura, normalização, persistência e exposição via API.

A implementação deve eliminar o comportamento atual em que conversas `@lid` são convertidas artificialmente para JIDs `@s.whatsapp.net` inexistentes, o que leva à perda de mensagens, e deve unificar o caminho principal da API com a normalização rica já existente no sistema.

## Contexto Validado
A investigação read-only na instância `hype_lima_pessoal` confirmou os seguintes fatos:

1. Os 3 chats mais recentes analisados usam `remoteJid` no formato `@lid` no payload bruto.
2. Para esses chats, o sistema atual gera um JID canônico artificial do tipo `<digits>@s.whatsapp.net`.
3. Esse JID artificial não retorna mensagens em `/chat/findMessages/:instanceName`.
4. O JID real necessário para lookup estava disponível no payload bruto das mensagens/chats, especialmente em `lastMessage.key.remoteJidAlt` e nos registros das mensagens em `key.remoteJidAlt`.
5. A rota principal de mensagens reduz todos os status para `DELIVERED`, perdendo informação de `READ` e `PLAYED` já presente em `MessageUpdate`.
6. O caminho legado/realtime já possui uma normalização mais completa para status e timestamps.
7. Em alguns chats, `messageTimestamp` no nível do chat vem `null`, enquanto o `lastMessage` contém evidência suficiente para representar corretamente a última atividade.
8. Há alternância de identidade entre `key.remoteJid` e `key.remoteJidAlt` dentro da mesma conversa, o que exige uma estratégia explícita de resolução de identidade.

## Problema de Negócio
Hoje o CRM pode:
- abrir chats sem carregar mensagens reais;
- mostrar preview incorreto ou nulo da última mensagem;
- exibir status mais fracos do que os realmente recebidos pela Evolution;
- tratar datas de forma inconsistente entre payload bruto, normalização, banco e UI;
- tomar decisões erradas de ordenação ou priorização de conversas.

Isso compromete confiabilidade operacional, leitura de contexto comercial e consistência de atendimento.

## Objetivos Funcionais
A refatoração deve garantir que:

1. Cada conversa WhatsApp tenha resolução confiável de identidade entre:
   - `remoteJid` bruto da conversa
   - `remoteJidAlt` bruto da conversa
   - `lastMessage.key.remoteJid`
   - `lastMessage.key.remoteJidAlt`
   - `remoteJid` e `remoteJidAlt` observados nas mensagens reais

2. O sistema diferencie claramente:
   - identificador principal/canônico da conversa
   - identificador de lookup para busca de mensagens
   - identificadores alternativos observados no payload

3. A API principal de mensagens preserve corretamente o status lógico da mensagem, usando prioridade baseada em `MessageUpdate` quando disponível.

4. O timestamp bruto seja mantido sem ambiguidade e acompanhado por representação ISO consistente.

5. A lista de chats use o melhor timestamp disponível para ordenação e preview da última atividade.

6. O comportamento seja consistente entre:
   - lista de chats
   - abertura do chat
   - stream de mensagens
   - snapshot/realtime
   - persistência em banco

## Escopo
Incluído:
- resolução de JID para chats WhatsApp;
- normalização de mensagens da Evolution;
- normalização de chats/conversas;
- rotas `/api/chat/messages` e `/api/chat/messages/stream`;
- pontos que dependem de `buscarConversas*`, `buscarMensagensPorContato`, `resolverDestinoConversaWhatsapp`, `mapearConversaEvolution`, `normalizarMensagensEvolution` e helpers correlatos;
- testes/instrumentação de validação com base na amostra real da instância `hype_lima_pessoal`.

Excluído:
- mudanças de UX não relacionadas a status/data/identidade;
- refatorações amplas de domínio fora do fluxo WhatsApp;
- mudanças em integrações externas além do necessário para corrigir interpretação e exposição dos dados já recebidos;
- alteração de convenções globais de timezone da aplicação fora do escopo do WhatsApp.

## Requisitos Funcionais Detalhados

### RF1. Resolução de Identidade da Conversa
O sistema deve resolver cada conversa usando uma estrutura explícita com, no mínimo:
- `rawRemoteJid`: valor bruto recebido no chat;
- `lookupRemoteJid`: JID efetivamente usado para buscar mensagens;
- `alternateRemoteJids`: conjunto de identificadores alternativos observados;
- `canonicalRemoteJid`: identificador interno escolhido para representar a conversa no CRM.

Regras obrigatórias:
1. Nunca fabricar `lookupRemoteJid` a partir de `@lid` apenas trocando o sufixo para `@s.whatsapp.net`.
2. Quando existir evidência concreta de JID alternativo em `lastMessage.key.remoteJidAlt` ou equivalente, essa evidência deve ter prioridade sobre canonicalização heurística.
3. Quando houver inversão entre `remoteJid` e `remoteJidAlt` entre mensagens do mesmo chat, o resolvedor deve preservar ambos e selecionar explicitamente o identificador apropriado para lookup.
4. O resolvedor deve continuar funcionando para chats que já chegam diretamente como `@s.whatsapp.net`.
5. O resolvedor não deve perder o `@lid` original, pois ele ainda é dado relevante de rastreabilidade.

### RF2. Busca de Mensagens
A busca de mensagens deve usar o identificador de lookup correto e retornar mensagens para os chats `@lid` reais analisados.

Critérios mínimos:
1. Os 3 chats amostrados devem deixar de retornar zero mensagens quando abertos pelo fluxo principal.
2. A busca deve respeitar paginação atual.
3. O sistema deve continuar aceitando casos em que o mesmo contato apareça com formas de JID diferentes.
4. O payload bruto relevante deve permanecer disponível para diagnóstico/log/normalização.

### RF3. Normalização de Status
A normalização principal deve usar a mesma semântica já presente no fluxo rico existente.

Regras obrigatórias:
1. Se `MessageUpdate` existir, o status lógico deve ser derivado dele usando prioridade forte.
2. `READ` e `PLAYED` não podem ser degradados para `DELIVERED`.
3. `DELIVERY_ACK` deve resultar em estado compatível com entrega.
4. `SERVER_ACK` deve resultar em estado compatível com envio.
5. Na ausência de `MessageUpdate`, usar `raw.status` quando houver.
6. Na ausência de ambos, aplicar fallback compatível com direção da mensagem (`fromMe`).
7. A normalização deve produzir o mesmo resultado semântico entre rota principal, stream e fluxo legado/snapshot.

### RF4. Normalização de Datas e Timestamps
A refatoração deve tratar datas em duas camadas distintas:
- timestamp de transporte/evento da mensagem;
- formatação/apresentação local.

Regras obrigatórias:
1. O `timestamp` bruto numérico deve ser preservado.
2. Deve existir `timestampIso` derivado de forma consistente a partir do timestamp bruto.
3. A interpretação segundos vs milissegundos deve continuar sendo tratada de forma centralizada.
4. O sistema não deve confundir timestamp do transporte com data textual contida no corpo da mensagem.
5. A lista de chats deve usar o melhor timestamp disponível da última mensagem quando `messageTimestamp` do chat vier nulo.
6. A ordenação entre conversas deve refletir a atividade mais recente real, não apenas campos incompletos do nível do chat.

### RF5. Preview e Metadados da Última Mensagem
A conversa precisa expor preview coerente com a última mensagem real.

Regras obrigatórias:
1. Chats como `Chamalead` e `Kevin Peggy |Automação IA` não podem perder preview real nem trocar por conteúdo antigo sem justificativa.
2. O sistema deve preservar a distinção entre preview textual e placeholders de mídia.
3. O preview deve ser consistente entre lista de chats e mensagens abertas.

### RF6. Persistência e Compatibilidade
Caso a persistência seja usada no fluxo impactado:
1. A evolução de status deve continuar respeitando fortalecimento de status já implementado no banco.
2. O payload bruto persistido não deve perder campos úteis para auditoria futura.
3. A refatoração não deve introduzir duplicação indevida de mensagens por mudança de chave de lookup.
4. A transição deve ser compatível com registros já persistidos, sem exigir migração destrutiva.

## Requisitos Técnicos

### RT1. Reutilização de Lógica Existente
A implementação deve priorizar reúso da lógica já consolidada em `src/lib/whatsapp-chat.normalization.ts` em vez de manter outra interpretação paralela na rota principal.

### RT2. Fonte Única de Verdade
Deve haver uma fonte única de verdade para:
- mapeamento de status;
- conversão de timestamp para ISO;
- extração de tipo/conteúdo resumido de mensagem;
- resolução de identidade de conversa quando aplicável.

### RT3. Mínima Superfície de Mudança
A refatoração deve ser a menor mudança coesa que resolva a causa raiz, evitando refactors cosméticos ou renomeações amplas sem necessidade funcional.

### RT4. Observabilidade
Enquanto houver risco residual, a implementação deve manter ou ampliar logs estruturados em pontos de fronteira relevantes para facilitar auditoria de:
- JID bruto recebido;
- JID escolhido para lookup;
- pares `remoteJid`/`remoteJidAlt` observados;
- status bruto e status normalizado;
- timestamp bruto e ISO derivado.

### RT5. Segurança e Robustez
A implementação não deve:
- assumir presença de `lastMessage`;
- assumir presença de `remoteJidAlt`;
- falhar quando `messageTimestamp` vier `null`;
- introduzir exceções por campos opcionais ausentes.

## Estratégia de Design Recomendada

### 1. Resolver identidade como estrutura, não como string única
Em vez de reduzir a conversa imediatamente a um único JID transformado, o sistema deve carregar um pequeno objeto de resolução contendo:
- origem bruta;
- lookup escolhido;
- alternativas conhecidas;
- telefone derivado, quando realmente existir.

### 2. Separar canônico interno de lookup operacional
O identificador escolhido para representar a conversa no CRM não precisa ser obrigatoriamente o mesmo usado para consultar a Evolution.

### 3. Reusar a normalização rica de mensagens
A rota principal deve parar de reimplementar versão simplificada de status/data e passar a depender da lógica já validada no fluxo rico.

### 4. Melhorar timestamp de conversa com fallback explícito
Quando `chat.messageTimestamp` vier ausente, a conversa deve buscar timestamp confiável em `lastMessage` antes de concluir que não há data útil.

## Casos Reais de Referência

### Caso 1. Chamalead
- Chat bruto: `157862277959928@lid`
- Lookup correto observado: `5511980733723@s.whatsapp.net`
- Preview esperado da última mensagem: `Oii teste`
- Mensagens recentes incluem status derivados de `READ`

### Caso 2. Mell
- Chat bruto: `38135467647189@lid`
- Lookup correto observado: `555194854287@s.whatsapp.net`
- Mensagens recentes incluem outbound com `DELIVERY_ACK`
- Deve abrir histórico real em vez de zero mensagens

### Caso 3. Kevin Peggy |Automação IA
- Chat bruto: `72992985993261@lid`
- Lookup correto observado: `556186236413@s.whatsapp.net`
- Mensagens recentes incluem caso de `PLAYED` em `audioMessage`
- Preview não pode ser perdido

## Critérios de Aceitação

### CA1. Lookup de Conversa
Para os 3 chats reais analisados, o fluxo principal deve abrir mensagens reais usando o resolvedor novo, sem depender de JID `@s.whatsapp.net` fabricado a partir de `@lid`.

### CA2. Status Preservado
Na amostra validada:
- mensagens com `MessageUpdate=["READ"]` ou `READ` equivalente devem sair como `READ`;
- mensagens com `MessageUpdate=["PLAYED", "READ"]` devem sair como `PLAYED` ou a semântica mais forte definida pela normalização oficial;
- mensagens com `DELIVERY_ACK` não podem virar `READ` indevidamente.

### CA3. Datas Consistentes
Cada mensagem normalizada do fluxo principal deve expor:
- `timestamp` numérico coerente com o payload bruto;
- `timestampIso` coerente com a conversão centralizada.

### CA4. Lista de Chats Coerente
Os chats afetados devem exibir preview e ordenação compatíveis com a última atividade real disponível.

### CA5. Regressão Controlada
Chats já baseados em `@s.whatsapp.net` não devem regredir em lookup, preview, ordenação ou status.

### CA6. Validação Final
A implementação concluída deve passar por `npm run pm2:prod` conforme convenção obrigatória do repositório.

## Estratégia de Validação
A execução futura deve validar, no mínimo:

1. leitura controlada dos 3 chats reais amostrados;
2. comparação entre bruto vs normalizado principal;
3. comparação entre normalizado principal vs normalização rica existente;
4. validação de status `READ`, `PLAYED`, `DELIVERY_ACK`;
5. validação de timestamps nulos no nível do chat com fallback em `lastMessage`;
6. validação de ausência de regressão em chats não `@lid`;
7. build/validação final com `npm run pm2:prod`.

## Riscos e Pontos de Atenção
1. Alguns chats podem não expor `remoteJidAlt` no nível do chat, exigindo fallback baseado no `lastMessage` ou em mensagens já carregadas.
2. Pode existir ambiguidade entre o melhor identificador para exibição e o melhor identificador para lookup; isso deve ser tratado explicitamente.
3. Mudanças na chave canônica de conversa podem afetar deduplicação, agrupamento ou associação com leads, exigindo revisão cuidadosa.
4. Diferenças entre hora UTC e apresentação local não devem gerar nova camada de confusão na UI.
5. A refatoração deve evitar criar uma terceira lógica de normalização; o objetivo é convergir, não fragmentar.

## Não Objetivos
Não faz parte desta feature:
- redesenhar a UI do inbox;
- alterar o contrato público além do necessário para corrigir os campos de status/data/identidade;
- reescrever completamente a camada de persistência.

## Resultado Esperado
Após a implementação:
- chats `@lid` passam a abrir corretamente;
- o sistema deixa de fabricar JIDs inválidos para lookup;
- status e datas deixam de divergir entre fluxos;
- previews e ordenação refletem a última atividade real;
- a plataforma fica mais confiável para leitura operacional e automações futuras.