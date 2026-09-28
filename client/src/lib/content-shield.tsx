import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ContentShieldContextValue = {
  isActive: boolean;
  engage: () => void;
  disengage: () => void;
  isOutboundHref: (href: string) => boolean;
};

const ContentShieldContext = createContext<ContentShieldContextValue | null>(null);

function isOutboundHref(href: string) {
  if (!href || href.startsWith("#") || href.startsWith("/") || href.startsWith("?")) {
    return false;
  }

  try {
    const url = new URL(href, window.location.origin);
    return (
      url.origin !== window.location.origin ||
      !["http:", "https:"].includes(url.protocol)
    );
  } catch {
    return true;
  }
}

export function ContentShieldProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  const engage = useCallback(() => setIsActive(true), []);
  const disengage = useCallback(() => setIsActive(false), []);

  useEffect(() => {
    document.documentElement.dataset.contentShield = isActive ? "active" : "inactive";

    if (!isActive) return;

    const originalOpen = window.open;

    function blockOutboundClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a");
      const href = link?.getAttribute("href");
      if (href && isOutboundHref(href)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    document.addEventListener("click", blockOutboundClick, true);
    window.open = (() => null) as typeof window.open;

    return () => {
      document.removeEventListener("click", blockOutboundClick, true);
      window.open = originalOpen;
    };
  }, [isActive]);

  const value = useMemo(
    () => ({ isActive, engage, disengage, isOutboundHref }),
    [isActive, engage, disengage],
  );

  return (
    <ContentShieldContext.Provider value={value}>
      {children}
    </ContentShieldContext.Provider>
  );
}

export function useContentShield() {
  const context = useContext(ContentShieldContext);
  if (!context) {
    throw new Error("useContentShield must be used inside ContentShieldProvider");
  }
  return context;
}