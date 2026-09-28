import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DnsResolver = {
  id: string;
  name: string;
  provider: string;
  primaryIpv4: string;
  secondaryIpv4: string;
  description: string;
  features: string[];
};

export const AVAILABLE_RESOLVERS: Record<string, DnsResolver> = {
  cleanbrowsing_family: {
    id: "cleanbrowsing_family",
    name: "CleanBrowsing Family Filter (Default)",
    provider: "CleanBrowsing Inc.",
    primaryIpv4: "185.228.168.168",
    secondaryIpv4: "185.228.169.168",
    description: "Blocks pornographic, adult, and unsafe domains while forcing SafeSearch on Google, Bing, and YouTube.",
    features: [
      "Adult & NSFW content blocked at DNS root",
      "Enforces SafeSearch automatically",
      "Blocks known phishing & malware domains",
      "No logging of personal browsing identities",
    ],
  },
  cleanbrowsing_adult: {
    id: "cleanbrowsing_adult",
    name: "CleanBrowsing Adult Filter",
    provider: "CleanBrowsing Inc.",
    primaryIpv4: "185.228.168.10",
    secondaryIpv4: "185.228.169.11",
    description: "Filters adult and explicit domains without enforcing strict SafeSearch on general search engines.",
    features: [
      "Blocks adult websites and explicit domains",
      "Allows general search without SafeSearch enforcement",
      "Low latency global Anycast network",
    ],
  },
  cloudflare_family: {
    id: "cloudflare_family",
    name: "Cloudflare 1.1.1.3 Family Filter",
    provider: "Cloudflare Inc.",
    primaryIpv4: "1.1.1.3",
    secondaryIpv4: "1.0.0.3",
    description: "Cloudflare's privacy-first public DNS resolver with automated adult content and malware blocking.",
    features: [
      "Ultra-fast DNS response times (<15ms)",
      "Blocks malware & adult content",
      "Audited privacy with 24-hour log deletion",
    ],
  },
};

const STORAGE_KEY = "orbit:content_filter_v1";

type StoredFilterState = {
  isActive: boolean;
  isLockedByPanic: boolean;
  resolverId: string;
  enabledAtISO?: string;
  panicStartedAtISO?: string;
};

type ContentFilterContextValue = {
  isActive: boolean;
  isLockedByPanic: boolean;
  currentResolver: DnsResolver;
  resolverId: string;
  startFilter: (lockByPanic?: boolean) => Promise<{ success: boolean; message?: string }>;
  stopFilter: () => { success: boolean; message?: string };
  releasePanicLock: () => void;
  setResolver: (id: string) => void;
  sendAndroidVpnCommand: (action: "start" | "stop" | "panic-start" | "panic-end") => void;
};

const ContentFilterContext = createContext<ContentFilterContextValue | null>(null);

function loadSavedState(): StoredFilterState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isActive: Boolean(parsed.isActive),
        isLockedByPanic: Boolean(parsed.isLockedByPanic),
        resolverId: parsed.resolverId || "cleanbrowsing_family",
        enabledAtISO: parsed.enabledAtISO,
        panicStartedAtISO: parsed.panicStartedAtISO,
      };
    }
  } catch (e) {
    console.error("Error reading content filter storage", e);
  }
  return {
    isActive: false,
    isLockedByPanic: false,
    resolverId: "cleanbrowsing_family",
  };
}

function persistState(state: StoredFilterState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error saving content filter storage", e);
  }
}

export function ContentFilterProvider({ children }: { children: ReactNode }) {
  const [filterState, setFilterState] = useState<StoredFilterState>(() => loadSavedState());

  const currentResolver = useMemo(() => {
    return AVAILABLE_RESOLVERS[filterState.resolverId] || AVAILABLE_RESOLVERS.cleanbrowsing_family;
  }, [filterState.resolverId]);

  const sendAndroidVpnCommand = useCallback((action: "start" | "stop" | "panic-start" | "panic-end") => {
    // Attempt deep link trigger for Android TWA wrapper
    const deepLink = `starrypath://content-filter/${action}`;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, []);

  const startFilter = useCallback(
    async (lockByPanic = false) => {
      const nextState: StoredFilterState = {
        ...filterState,
        isActive: true,
        isLockedByPanic: lockByPanic ? true : filterState.isLockedByPanic,
        enabledAtISO: new Date().toISOString(),
        panicStartedAtISO: lockByPanic ? new Date().toISOString() : filterState.panicStartedAtISO,
      };
      setFilterState(nextState);
      persistState(nextState);

      sendAndroidVpnCommand(lockByPanic ? "panic-start" : "start");

      return {
        success: true,
        message: lockByPanic
          ? "Content Filter activated & locked until Panic Protocol finishes."
          : "Content Filter activated.",
      };
    },
    [filterState, sendAndroidVpnCommand]
  );

  const stopFilter = useCallback(() => {
    if (filterState.isLockedByPanic) {
      return {
        success: false,
        message: "Content Filter is locked while Panic Mode is in progress. Complete your panic session to turn it off.",
      };
    }

    const nextState: StoredFilterState = {
      ...filterState,
      isActive: false,
      isLockedByPanic: false,
      enabledAtISO: undefined,
      panicStartedAtISO: undefined,
    };
    setFilterState(nextState);
    persistState(nextState);

    sendAndroidVpnCommand("stop");

    return {
      success: true,
      message: "Content Filter deactivated.",
    };
  }, [filterState, sendAndroidVpnCommand]);

  const releasePanicLock = useCallback(() => {
    const nextState: StoredFilterState = {
      ...filterState,
      isLockedByPanic: false,
      panicStartedAtISO: undefined,
    };
    setFilterState(nextState);
    persistState(nextState);

    sendAndroidVpnCommand("panic-end");
  }, [filterState, sendAndroidVpnCommand]);

  const setResolver = useCallback(
    (id: string) => {
      if (!AVAILABLE_RESOLVERS[id]) return;
      const nextState: StoredFilterState = {
        ...filterState,
        resolverId: id,
      };
      setFilterState(nextState);
      persistState(nextState);
      // Restart if active to apply new resolver
      if (filterState.isActive) {
        sendAndroidVpnCommand(filterState.isLockedByPanic ? "panic-start" : "start");
      }
    },
    [filterState, sendAndroidVpnCommand]
  );

  // Sync dataset on root html
  useEffect(() => {
    document.documentElement.dataset.contentFilterActive = filterState.isActive ? "true" : "false";
    document.documentElement.dataset.contentFilterLocked = filterState.isLockedByPanic ? "true" : "false";
  }, [filterState]);

  const value = useMemo(
    () => ({
      isActive: filterState.isActive,
      isLockedByPanic: filterState.isLockedByPanic,
      currentResolver,
      resolverId: filterState.resolverId,
      startFilter,
      stopFilter,
      releasePanicLock,
      setResolver,
      sendAndroidVpnCommand,
    }),
    [
      filterState.isActive,
      filterState.isLockedByPanic,
      currentResolver,
      filterState.resolverId,
      startFilter,
      stopFilter,
      releasePanicLock,
      setResolver,
      sendAndroidVpnCommand,
    ]
  );

  return (
    <ContentFilterContext.Provider value={value}>
      {children}
    </ContentFilterContext.Provider>
  );
}

export function useContentFilter() {
  const context = useContext(ContentFilterContext);
  if (!context) {
    throw new Error("useContentFilter must be used within ContentFilterProvider");
  }
  return context;
}
