import { Lock, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { useContentFilter } from "@/lib/content-filter";
import { useToast } from "@/hooks/use-toast";

type DnsToggleButtonProps = {
  variant?: "pill" | "button" | "card" | "compact";
  className?: string;
  showProvider?: boolean;
};

export function DnsToggleButton({
  variant = "pill",
  className = "",
  showProvider = false,
}: DnsToggleButtonProps) {
  const { isActive, isLockedByPanic, currentResolver, startFilter, stopFilter } =
    useContentFilter();
  const { toast } = useToast();

  const handleToggle = () => {
    if (isLockedByPanic) {
      toast({
        title: "🔒 DNS Filter is Locked",
        description:
          "Protection is locked because Panic Reset is in progress. Complete your rescue session to turn it off.",
        variant: "destructive",
      });
      return;
    }

    if (isActive) {
      const result = stopFilter();
      toast({
        title: "DNS Filter Disabled",
        description: result.message || "DNS filtering turned off.",
      });
    } else {
      startFilter(false);
      toast({
        title: "🛡️ DNS Filter Enabled",
        description: `Now filtering through ${currentResolver.name} (${currentResolver.primaryIpv4}). Adult sites blocked.`,
      });
    }
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={
          isLockedByPanic
            ? "DNS is locked ON during Panic Mode"
            : isActive
            ? "DNS Filter is ON (Click to turn OFF)"
            : "DNS Filter is OFF (Click to turn ON)"
        }
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
          isLockedByPanic
            ? "border border-rose-500/40 bg-rose-500/15 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
            : isActive
            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            : "border border-border bg-card/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
        } ${className}`}
        data-testid="button-dns-compact-toggle"
      >
        {isLockedByPanic ? (
          <Lock className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
        ) : isActive ? (
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Shield className="h-3.5 w-3.5" />
        )}
        <span>{isLockedByPanic ? "DNS: Locked ON" : isActive ? "DNS: ON" : "DNS: OFF"}</span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div
        onClick={handleToggle}
        className={`cursor-pointer rounded-2xl border p-4 transition-all active:scale-[0.99] ${
          isLockedByPanic
            ? "border-rose-500/40 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
            : isActive
            ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            : "border-border bg-card hover:bg-secondary/40"
        } ${className}`}
        data-testid="card-dns-toggle-action"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                isLockedByPanic
                  ? "bg-rose-500/20 text-rose-400"
                  : isActive
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {isLockedByPanic ? (
                <Lock className="h-5 w-5" />
              ) : isActive ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">DNS Content Filter</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    isLockedByPanic
                      ? "bg-rose-500/20 text-rose-300"
                      : isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isLockedByPanic ? "Locked ON" : isActive ? "ON" : "OFF"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isLockedByPanic
                  ? "Enforced by Panic Reset • Cannot be turned off"
                  : isActive
                  ? `Filtering via ${currentResolver.provider} • Adult sites blocked`
                  : "Tap to activate device-wide DNS adult content blocking"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default "pill" / "button" variant
  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 btn-press ${
        isLockedByPanic
          ? "border border-rose-500/50 bg-rose-500/20 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.25)]"
          : isActive
          ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.25)] hover:bg-emerald-500/30"
          : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
      } ${className}`}
      data-testid="button-dns-toggle-pill"
    >
      {isLockedByPanic ? (
        <Lock className="h-4 w-4 text-rose-400 animate-pulse" />
      ) : isActive ? (
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
      ) : (
        <Shield className="h-4 w-4 text-muted-foreground" />
      )}
      <span>
        {isLockedByPanic
          ? "DNS: Locked ON (Panic Active)"
          : isActive
          ? "DNS Filter: ON"
          : "DNS Filter: OFF"}
      </span>
      {showProvider && isActive && !isLockedByPanic && (
        <span className="opacity-70 text-[10px]">({currentResolver.provider})</span>
      )}
    </button>
  );
}
