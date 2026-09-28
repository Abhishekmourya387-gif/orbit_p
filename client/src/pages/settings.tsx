import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Info,
  Lock,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Globe,
  EyeOff,
  Shield,
  Heart,
} from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useContentShield } from "@/lib/content-shield";
import { useContentFilter, AVAILABLE_RESOLVERS } from "@/lib/content-filter";
import { OrbitLogo } from "@/components/orbit-logo";
import { useToast } from "@/hooks/use-toast";

const PROFILE_KEY = "orbit:profile";
const DNS_PENDING_KEY = "orbit:dns-protection-pending";

type Profile = {
  seedName?: string;
  signaturePreview?: string;
  dnsProtectionEnabled?: boolean;
  [key: string]: unknown;
};

type Device = "android" | "ios" | "other";

function readProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProfile(nextProfile: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
}

function detectDevice(): Device {
  const userAgent = navigator.userAgent;
  if (/Android/i.test(userAgent)) return "android";
  if (
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  return "other";
}

function deviceSettingsPath(device: Device) {
  if (device === "android") {
    return "Settings → Network & internet → Private DNS";
  }
  if (device === "ios") {
    return "Settings → Wi-Fi → tap ⓘ beside your network → Configure DNS";
  }
  return "Open your device settings and look for Private DNS or Configure DNS";
}

function deviceSettingsLink(device: Device) {
  if (device === "android") {
    return "intent:#Intent;action=android.settings.PRIVATE_DNS_SETTINGS;end";
  }
  if (device === "ios") {
    return "App-Prefs:root=WIFI";
  }
  return null;
}

export default function Settings() {
  const [, navigate] = useLocation();
  const { isActive: isContentShieldActive, engage, disengage } = useContentShield();
  const {
    isActive: isContentFilterActive,
    isLockedByPanic,
    currentResolver,
    resolverId,
    startFilter,
    stopFilter,
    setResolver,
    sendAndroidVpnCommand,
  } = useContentFilter();

  const [profile, setProfile] = useState<Profile>(() => readProfile());
  const { toast } = useToast();
  const [settingsNote, setSettingsNote] = useState<string>(() => {
    return (profile.signaturePreview as string) || (profile.personalNote as string) || "";
  });
  const [showSetup, setShowSetup] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showResolverDialog, setShowResolverDialog] = useState(false);
  const [device, setDevice] = useState<Device>("other");

  const dnsProtectionEnabled = profile.dnsProtectionEnabled === true;
  const settingsPath = useMemo(() => deviceSettingsPath(device), [device]);

  function updatePersonalNote(newNote: string) {
    const trimmed = newNote.trim();
    setSettingsNote(trimmed);
    const nextProfile = { ...profile, signaturePreview: trimmed, personalNote: trimmed };
    setProfile(nextProfile);
    saveProfile(nextProfile);
    toast({
      title: "✨ Personal Note Saved",
      description: "Your recovery reminder has been updated.",
    });
  }

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible" &&
        sessionStorage.getItem(DNS_PENDING_KEY) === "true"
      ) {
        sessionStorage.removeItem(DNS_PENDING_KEY);
        setShowConfirmation(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  function updateDnsProtection(enabled: boolean) {
    const nextProfile = { ...profile, dnsProtectionEnabled: enabled };
    setProfile(nextProfile);
    saveProfile(nextProfile);
  }

  function openDeviceSettings() {
    sessionStorage.setItem(DNS_PENDING_KEY, "true");
    const link = deviceSettingsLink(device);
    if (link) {
      window.location.assign(link);
    }
    setShowSetup(false);
  }

  function keepProtectionOff() {
    sessionStorage.removeItem(DNS_PENDING_KEY);
    setShowConfirmation(false);
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-3xl px-5 py-8 pb-32 sm:px-8">
        <div className="page-in">
          <header className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="min-tap grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Back to home"
              data-testid="button-settings-back"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div>
              <OrbitLogo size="sm" />
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Settings
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                A few simple choices to make your recovery space work better for you.
              </p>
            </div>
          </header>

          <section className="mt-8 space-y-5" aria-labelledby="protection-heading">
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2
                id="protection-heading"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Protection & permissions
              </h2>
            </div>

            {/* 1. NEW NATIVE / DEVICE VPN CONTENT FILTER */}
            <div
              className={`rounded-[26px] border p-5 shadow-sm transition-all sm:p-7 ${
                isLockedByPanic
                  ? "border-rose-500/40 bg-rose-500/5 shadow-[0_0_24px_rgba(244,63,94,0.1)]"
                  : isContentFilterActive
                  ? "border-primary/40 bg-card"
                  : "border-border bg-card"
              }`}
              data-testid="card-dns-content-filter"
            >
              <div className="flex items-start justify-between gap-5">
                <div className="flex gap-4">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                      isLockedByPanic
                        ? "bg-rose-500/20 text-rose-400"
                        : isContentFilterActive
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {isLockedByPanic ? (
                      <Lock className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold tracking-tight">Content Filter</h3>
                      {isLockedByPanic ? (
                        <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-400">
                          Locked By Panic
                        </span>
                      ) : isContentFilterActive ? (
                        <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          Off
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Routes device DNS traffic through a filtering resolver ({currentResolver.name}) to block adult websites, pornography, and phishing.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={isContentFilterActive}
                    disabled={isLockedByPanic}
                    onCheckedChange={(checked) => {
                      if (isLockedByPanic) return;
                      if (checked) {
                        startFilter(false);
                      } else {
                        stopFilter();
                      }
                    }}
                    aria-label="Toggle Content Filter"
                    data-testid="switch-content-filter"
                  />
                </div>
              </div>

              {/* Status details & Panic Lock notice */}
              {isLockedByPanic ? (
                <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <div>
                      <p className="text-xs font-bold text-rose-200">
                        Protection is enforced by your active Panic Protocol
                      </p>
                      <p className="mt-1 text-xs leading-5 text-rose-100/70">
                        To safeguard against impulsive relapse, the Content Filter cannot be turned off until you finish the emergency reset session.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isContentFilterActive ? (
                <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-semibold text-foreground">Active Resolver:</span>{" "}
                    {currentResolver.name} ({currentResolver.primaryIpv4})
                  </div>
                  <span className="text-primary font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> DNS Tunnel Engaged
                  </span>
                </div>
              ) : null}

              {/* Actions row */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5"
                  onClick={() => setShowPrivacyDialog(true)}
                  data-testid="button-privacy-info"
                >
                  <Info className="h-3.5 w-3.5" />
                  Privacy Implications
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5"
                  onClick={() => setShowResolverDialog(true)}
                  disabled={isLockedByPanic}
                  data-testid="button-choose-resolver"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Config: {currentResolver.provider}
                </Button>

                {device === "android" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      sendAndroidVpnCommand(isContentFilterActive ? "stop" : "start");
                    }}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Android VPN Service
                  </Button>
                )}
              </div>
            </div>

            {/* 2. DEVICE PRIVATE DNS MANUAL SETUP */}
            <div
              className="rounded-[26px] border border-border bg-card p-5 shadow-sm sm:p-7"
              data-testid="card-dns-protection"
            >
              <div className="flex items-start justify-between gap-5">
                <div className="flex gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      OS Private DNS Fallback
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Configure your phone’s built-in system Private DNS settings directly.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={dnsProtectionEnabled}
                  disabled={!dnsProtectionEnabled}
                  aria-label="DNS Content Filter status"
                  data-testid="switch-dns-protection"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">Native OS Protection</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Configuring Private DNS in your Android/iOS settings provides persistent OS-level filtering without needing a VPN icon in the status bar.
                    </p>
                  </div>
                </div>
              </div>

              {dnsProtectionEnabled ? (
                <div
                  className="mt-5 flex items-center gap-2 text-sm font-medium text-primary"
                  data-testid="text-dns-enabled"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Protection marked as on
                </div>
              ) : (
                <Button
                  type="button"
                  className="mt-5 min-h-12 w-full justify-between rounded-xl px-4 text-sm font-semibold sm:w-auto sm:min-w-52"
                  onClick={() => setShowSetup(true)}
                  data-testid="button-setup-protection"
                >
                  Configure OS Settings
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>

            {/* 3. IN-APP SHIELD */}
            <div
              className="flex flex-col gap-4 rounded-[26px] border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
              data-testid="card-in-app-content-shield"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">In-App Content Shield</h3>
                  <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
                    Instantly pauses outbound links and external previews while you use Orbit.
                  </p>
                  <p
                    className="mt-2 text-xs font-medium text-primary"
                    data-testid="text-in-app-shield-status"
                  >
                    {isContentShieldActive ? "On now" : "Off"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant={isContentShieldActive ? "outline" : "default"}
                className="min-h-11 shrink-0 rounded-xl"
                onClick={isContentShieldActive ? disengage : engage}
                data-testid="button-in-app-content-shield"
              >
                {isContentShieldActive ? "Turn off shield" : "Turn on shield"}
              </Button>
            </div>
          </section>

          {/* PERSONAL MOTIVATION NOTE SECTION */}
          <section className="mt-8 space-y-4" aria-labelledby="personal-note-heading">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2
                id="personal-note-heading"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Personal Note & Motivation
              </h2>
            </div>

            <div className="rounded-[26px] border border-border bg-card p-5 shadow-sm sm:p-7">
              <div>
                <h3 className="text-base font-semibold tracking-tight">Your Core Recovery Reminder</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This note is displayed on your home dashboard as your personal anchor during challenging moments.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <textarea
                  value={settingsNote}
                  onChange={(e) => setSettingsNote(e.target.value)}
                  placeholder="Why did you start this journey? Write a personal reminder to your future self..."
                  rows={3}
                  maxLength={300}
                  className="w-full rounded-xl border border-border bg-background p-3 font-[var(--font-scribble)] text-lg text-foreground placeholder:font-sans placeholder:text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {settingsNote.length}/300 characters
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl px-4 text-xs font-semibold"
                    onClick={() => {
                      updatePersonalNote(settingsNote);
                    }}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Save Note
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <AppNav />

      {/* PRIVACY IMPLICATIONS DIALOG */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-[26px] border-border bg-card p-6 sm:max-w-lg">
          <DialogHeader className="text-left">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl">Privacy Implications of DNS Filtering</DialogTitle>
            <DialogDescription className="pt-2 text-left leading-6">
              Before enabling the Content Filter VPN, please review what information is shared with third-party DNS resolvers and how your privacy is protected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs leading-5">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-primary" /> How DNS Filtering Works
              </p>
              <p className="mt-1.5 text-muted-foreground">
                When you visit any website, your device asks a DNS resolver for its IP address. With the Content Filter enabled, an Android VpnService routes only these lookup requests (UDP port 53) to CleanBrowsing or Cloudflare. If the domain is recognized as adult, pornographic, or malicious, the resolver blocks it before any connection is made.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="font-semibold text-emerald-400 text-sm flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> What The DNS Resolver NEVER Sees
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-white/70">
                <li>Your passwords, credentials, or bank details.</li>
                <li>The content of any webpage, article, video, or message.</li>
                <li>Specific URLs or search terms (e.g. they see <code className="text-white">google.com</code>, not your search query).</li>
                <li>End-to-End HTTPS traffic remains 100% encrypted.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="font-semibold text-amber-400 text-sm flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> What The DNS Resolver CAN See
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-white/70">
                <li>The domain names your device contacts (e.g. <code className="text-white">wikipedia.org</code>).</li>
                <li>The timestamp of each DNS query.</li>
                <li>Your public network IP address.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-rose-400" /> Panic Button Lockdown Policy
              </p>
              <p className="mt-1.5 text-muted-foreground">
                Whenever you activate the <strong>Panic Button</strong>, the Content Filter automatically turns on and is <strong>locked</strong>. It cannot be disabled until the rescue protocol is completed to protect against impulsive relapse.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              className="min-h-11 rounded-xl w-full sm:w-auto"
              onClick={() => setShowPrivacyDialog(false)}
            >
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CHOOSE RESOLVER DIALOG */}
      <Dialog open={showResolverDialog} onOpenChange={setShowResolverDialog}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-[26px] border-border bg-card p-6 sm:max-w-md">
          <DialogHeader className="text-left">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
              <Globe className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl">Select Filtering DNS Resolver</DialogTitle>
            <DialogDescription className="pt-2 text-left leading-6">
              Choose which public filtering resolver your device routes domain queries through.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {Object.values(AVAILABLE_RESOLVERS).map((resolver) => {
              const isSelected = resolver.id === resolverId;
              return (
                <div
                  key={resolver.id}
                  onClick={() => setResolver(resolver.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{resolver.name}</p>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{resolver.description}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">
                      IP: {resolver.primaryIpv4}
                    </span>
                    <span>•</span>
                    <span>{resolver.provider}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              className="min-h-11 rounded-xl"
              onClick={() => setShowResolverDialog(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SETUP DIALOG */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-[26px] border-border bg-card p-6 sm:max-w-md">
          <DialogHeader className="text-left">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl">Add OS-level protection</DialogTitle>
            <DialogDescription className="pt-2 text-left leading-6">
              CleanBrowsing is a DNS service that helps block known adult and unsafe websites across all applications.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">On your device, go to:</p>
            <p className="mt-1">{settingsPath}</p>
            {device === "other" ? (
              <p className="mt-2 text-xs">
                We couldn’t identify your phone, so use the path that matches your device.
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => setShowSetup(false)}
              data-testid="button-cancel-protection"
            >
              Not now
            </Button>
            <Button
              type="button"
              className="min-h-11 rounded-xl"
              onClick={openDeviceSettings}
              data-testid="button-open-device-settings"
            >
              Open device settings
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-[26px] border-border bg-card p-6 sm:max-w-md">
          <DialogHeader className="text-left">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl">Did you turn it on?</DialogTitle>
            <DialogDescription className="pt-2 text-left leading-6">
              Tell us what you chose in your device settings. We’ll only mark protection as
              on when you confirm it here.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={keepProtectionOff}
              data-testid="button-protection-not-yet"
            >
              Not yet
            </Button>
            <Button
              type="button"
              className="min-h-11 rounded-xl"
              onClick={() => {
                updateDnsProtection(true);
                setShowConfirmation(false);
              }}
              data-testid="button-protection-confirm"
            >
              Yes, I turned it on
              <Check className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}