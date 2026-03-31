import { TOUR_SELECTORS } from "@/modules/onboarding/lib/selectors";
import type { TourStep } from "@/modules/onboarding/types";

export const onboardingKanbanSteps: TourStep[] = [
  {
    id: "sidebar-negocios",
    selector: TOUR_SELECTORS.sidebarNegocios,
    position: "right",
    stepInteraction: true,
    title: "Negócios",
    content: "Gerencie sua pipeline de negócios com drag-and-drop. Acompanhe pendências, documentos e aprovações, e receba alertas.",
  },
];
