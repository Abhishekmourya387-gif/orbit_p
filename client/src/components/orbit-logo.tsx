import React from "react";

type OrbitLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "mark" | "badge";
  className?: string;
  showTagline?: boolean;
};

export function OrbitLogo({
  size = "md",
  variant = "full",
  className = "",
  showTagline = false,
}: OrbitLogoProps) {
  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-14 w-14",
  };

  const textSizes = {
    sm: "text-xs tracking-[0.22em]",
    md: "text-sm tracking-[0.26em]",
    lg: "text-base tracking-[0.28em]",
    xl: "text-xl tracking-[0.3em]",
  };

  // Warm sage-green + terracotta orbital mark — matches app palette
  const LogoMark = (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
      {/* Soft warm glow behind the mark */}
      <div
        className="absolute inset-0 rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(91,138,114,0.35) 0%, rgba(201,123,92,0.15) 60%, transparent 100%)",
          filter: "blur(5px)",
        }}
      />

      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative h-full w-full"
      >
        <defs>
          {/* Sage green core gradient */}
          <radialGradient id="orbitCoreSage" cx="24" cy="24" r="7" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8fbeab" />
            <stop offset="55%" stopColor="#5B8A72" />
            <stop offset="100%" stopColor="#3d6b58" />
          </radialGradient>

          {/* Primary ring — sage */}
          <linearGradient id="sageRing" x1="4" y1="10" x2="44" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5B8A72" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#8fbeab" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#5B8A72" stopOpacity="0.9" />
          </linearGradient>

          {/* Secondary ring — terracotta */}
          <linearGradient id="terraRing" x1="44" y1="10" x2="4" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C97B5C" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#e0a88a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#C97B5C" stopOpacity="0.85" />
          </linearGradient>

          {/* Inner star highlight */}
          <radialGradient id="starHighlight" cx="22" cy="22" r="3" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Primary orbital ring — sage green, tilted -30° */}
        <ellipse
          cx="24"
          cy="24"
          rx="19.5"
          ry="7"
          transform="rotate(-30 24 24)"
          stroke="url(#sageRing)"
          strokeWidth="1.8"
        />

        {/* Secondary orbital ring — terracotta, tilted +42° */}
        <ellipse
          cx="24"
          cy="24"
          rx="17"
          ry="5.5"
          transform="rotate(42 24 24)"
          stroke="url(#terraRing)"
          strokeWidth="1.3"
          strokeOpacity="0.8"
        />

        {/* Core planetary body */}
        <circle cx="24" cy="24" r="5.5" fill="url(#orbitCoreSage)" />

        {/* Subtle highlight on core */}
        <circle cx="22.5" cy="22" r="2.5" fill="url(#starHighlight)" />

        {/* Sage satellite — top right */}
        <circle cx="37.5" cy="14.5" r="2" fill="#8fbeab" opacity="0.9" />

        {/* Terracotta satellite — bottom left */}
        <circle cx="11.5" cy="33" r="1.4" fill="#C97B5C" opacity="0.85" />
      </svg>
    </div>
  );

  if (variant === "mark") {
    return <div className={`inline-flex items-center ${className}`}>{LogoMark}</div>;
  }

  if (variant === "badge") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 backdrop-blur-sm px-3 py-1.5 shadow-sm transition hover:border-primary/40 ${className}`}
      >
        {LogoMark}
        <div className="flex flex-col">
          <span
            className={`font-black uppercase text-foreground ${textSizes[size]}`}
            style={{ letterSpacing: "0.24em" }}
          >
            ORBIT
          </span>
          {showTagline && (
            <span className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase">
              Recovery Space
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default "full" variant — uses app's foreground + primary colors
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {LogoMark}
      <div className="flex flex-col">
        <span
          className={`font-black uppercase ${textSizes[size]}`}
          style={{
            background: "linear-gradient(90deg, hsl(148,20%,28%) 0%, hsl(148,20%,42%) 55%, hsl(17,49%,57%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          data-testid="text-orbit-brand"
        >
          ORBIT
        </span>
        {showTagline && (
          <span className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Recovery Companion
          </span>
        )}
      </div>
    </div>
  );
}
