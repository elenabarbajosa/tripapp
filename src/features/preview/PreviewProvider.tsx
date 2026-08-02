import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { appConfig } from "@/constants/config";

export interface PreviewContextValue {
  isPreviewActive: boolean;
  canUsePreview: boolean;
  enterPreview: () => boolean;
  exitPreview: () => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

/**
 * Development-only mock-data preview.
 * Never creates a Supabase session and is not treated as authentication.
 */
export function PreviewProvider({ children }: PropsWithChildren) {
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const canUsePreview = appConfig.isDevelopment;

  const enterPreview = useCallback(() => {
    if (!canUsePreview) {
      return false;
    }
    setIsPreviewActive(true);
    return true;
  }, [canUsePreview]);

  const exitPreview = useCallback(() => {
    setIsPreviewActive(false);
  }, []);

  const value = useMemo(
    () => ({
      isPreviewActive: canUsePreview && isPreviewActive,
      canUsePreview,
      enterPreview,
      exitPreview,
    }),
    [canUsePreview, enterPreview, exitPreview, isPreviewActive],
  );

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview(): PreviewContextValue {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error("usePreview must be used within PreviewProvider");
  }
  return context;
}
