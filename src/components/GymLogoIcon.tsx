"use client";

interface GymLogoIconProps {
  className?: string;
  white?: boolean;
}

/**
 * GymLogoIcon — renders the GymDate kettlebell+pin brand symbol
 * by cropping the brand logo image to show only the icon portion.
 *
 * Props:
 *  - className: Tailwind size classes (e.g. "w-6 h-6")
 *  - white:     if true, applies CSS filter to render icon in white
 */
export default function GymLogoIcon({ className = "w-6 h-6", white = false }: GymLogoIconProps) {
  return (
    <div className={`relative overflow-hidden flex-shrink-0 ${className}`}>
      <img
        src="/brand-logo.png"
        alt="GymDate Icon"
        draggable={false}
        className="h-full w-auto absolute left-0 top-0 select-none"
        style={{
          maxWidth: "none",
          filter: white ? "brightness(0) invert(1)" : "none",
        }}
      />
    </div>
  );
}
