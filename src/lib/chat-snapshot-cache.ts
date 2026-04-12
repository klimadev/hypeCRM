type CacheEntry<T> = {
  promise: Promise<T> | null;
  snapshot: T | null;
  expiresAt: number;
  startedAt: number | null;
};

const MAX_IN_FLIGHT_MS = 30_000;

type CacheStore = Map<string, CacheEntry<unknown>>;

declare global {
  var __chatSnapshotCache: CacheStore | undefined;
}

function obterStore() {
  if (!globalThis.__chatSnapshotCache) {
    globalThis.__chatSnapshotCache = new Map();
  }

  return globalThis.__chatSnapshotCache;
}

export async function obterSnapshotCacheado<T>(params: {
  key: string;
  ttlMs: number;
  loader: () => Promise<T>;
}): Promise<T> {
  const store = obterStore();
  const agora = Date.now();
  const existente = store.get(params.key) as CacheEntry<T> | undefined;

  if (existente?.promise) {
    if (existente.startedAt && agora - existente.startedAt > MAX_IN_FLIGHT_MS) {
      store.delete(params.key);
    } else {
      return existente.promise;
    }
  }

  const existenteAtualizado = store.get(params.key) as CacheEntry<T> | undefined;

  if (existenteAtualizado?.snapshot && existenteAtualizado.expiresAt > agora) {
    return existenteAtualizado.snapshot;
  }

  if (existente?.snapshot && existente.expiresAt > agora) {
    return existente.snapshot;
  }

  const promise = params.loader();
  store.set(params.key, {
    promise,
    snapshot: existenteAtualizado?.snapshot ?? existente?.snapshot ?? null,
    expiresAt: agora + params.ttlMs,
    startedAt: agora,
  });

  try {
    const snapshot = await promise;
    const atual = store.get(params.key) as CacheEntry<T> | undefined;
    if (!atual || atual.promise !== promise) {
      return snapshot;
    }

    store.set(params.key, {
      promise: null,
      snapshot,
      expiresAt: Date.now() + params.ttlMs,
      startedAt: null,
    });
    return snapshot;
  } catch (error) {
    const atual = store.get(params.key) as CacheEntry<T> | undefined;
    if (atual?.promise === promise) {
      store.delete(params.key);
    }
    throw error;
  }
}
