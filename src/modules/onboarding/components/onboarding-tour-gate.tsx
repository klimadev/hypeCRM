"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { readTourCompletion, writeTourCompletion } from "@/modules/onboarding/lib/storage";
import type { RunnerProps, TourBundle, TourIdentity } from "@/modules/onboarding/types";

type OnboardingTourGateProps = {
  bundle: TourBundle;
  identity: TourIdentity;
};

export function OnboardingTourGate({ bundle, identity }: OnboardingTourGateProps) {
  const hasInitialized = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [shouldRenderRunner, setShouldRenderRunner] = useState(false);
  const [RunnerComponent, setRunnerComponent] = useState<ComponentType<RunnerProps> | null>(null);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    const isCompleted = readTourCompletion(bundle.storageScope, identity) === "completed";
    const timer = window.setTimeout(() => {
      setShouldRenderRunner(!isCompleted);
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [bundle.storageScope, identity]);

  const handleFinish: RunnerProps["onFinish"] = () => {
    writeTourCompletion(bundle.storageScope, identity, "completed");
    setShouldRenderRunner(false);
  };

  useEffect(() => {
    if (!isReady || !shouldRenderRunner || RunnerComponent) {
      return;
    }

    let active = true;

    import("@/modules/onboarding/components/onboarding-tour-runner")
      .then((module) => {
        if (!active) {
          return;
        }

        setRunnerComponent(() => module.default);
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[onboarding] falha ao carregar tour runner:", error);
        }

        if (active) {
          setShouldRenderRunner(false);
        }
      });

    return () => {
      active = false;
    };
  }, [RunnerComponent, isReady, shouldRenderRunner]);

  if (!isReady || !shouldRenderRunner || !RunnerComponent) {
    return null;
  }

  return <RunnerComponent bundle={bundle} onFinish={handleFinish} />;
}
