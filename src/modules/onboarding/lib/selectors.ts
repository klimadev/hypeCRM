export const TOUR_TARGETS = {
  sidebarResumo: "sidebar-resumo",
  sidebarLeads: "sidebar-leads",
  sidebarNegocios: "sidebar-negocios",
  sidebarEquipe: "sidebar-equipe",
  sidebarWhatsapp: "sidebar-whatsapp",
  sidebarConfigs: "sidebar-configs",
} as const;

export const TOUR_SELECTORS = {
  body: "body",
  sidebarResumo: `[data-tour="${TOUR_TARGETS.sidebarResumo}"]`,
  sidebarLeads: `[data-tour="${TOUR_TARGETS.sidebarLeads}"]`,
  sidebarNegocios: `[data-tour="${TOUR_TARGETS.sidebarNegocios}"]`,
  sidebarEquipe: `[data-tour="${TOUR_TARGETS.sidebarEquipe}"]`,
  sidebarWhatsapp: `[data-tour="${TOUR_TARGETS.sidebarWhatsapp}"]`,
  sidebarConfigs: `[data-tour="${TOUR_TARGETS.sidebarConfigs}"]`,
} as const;
