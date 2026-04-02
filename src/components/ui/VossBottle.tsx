import { motion } from "framer-motion";

interface VossBottleProps {
  /** Fill level 0-1 */
  fillLevel: number;
  /** Height in px */
  size?: number;
  /** Whether this bottle is interactive */
  interactive?: boolean;
  /** Show ml label */
  showLabel?: boolean;
  /** Additional className */
  className?: string;
}

export function VossBottle({
  fillLevel,
  size = 160,
  interactive = false,
  showLabel = false,
  className = "",
}: VossBottleProps) {
  const clampedFill = Math.max(0, Math.min(1, fillLevel));
  const width = size * 0.28;
  const capHeight = size * 0.08;
  const neckHeight = size * 0.06;
  const bodyHeight = size - capHeight - neckHeight;
  const fillHeight = bodyHeight * clampedFill;

  return (
    <div className={`relative flex flex-col items-center ${className}`} style={{ width, height: size }}>
      <svg width={width} height={size} viewBox={`0 0 ${width} ${size}`} fill="none">
        <defs>
          {/* Water gradient */}
          <linearGradient id={`waterFill-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(96, 165, 250, 0.7)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.9)" />
          </linearGradient>
          {/* Glass reflection */}
          <linearGradient id={`glassShine-${size}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>
        </defs>

        {/* Cap */}
        <rect
          x={width * 0.2}
          y={0}
          width={width * 0.6}
          height={capHeight}
          rx={3}
          fill="rgba(120,120,130,0.6)"
          stroke="rgba(180,180,190,0.3)"
          strokeWidth={0.5}
        />

        {/* Neck (tapers from cap to body) */}
        <path
          d={`M${width * 0.25} ${capHeight} L${width * 0.15} ${capHeight + neckHeight} L${width * 0.85} ${capHeight + neckHeight} L${width * 0.75} ${capHeight} Z`}
          fill="rgba(200,200,210,0.08)"
          stroke="rgba(200,200,210,0.2)"
          strokeWidth={0.5}
        />

        {/* Body outline */}
        <rect
          x={width * 0.1}
          y={capHeight + neckHeight}
          width={width * 0.8}
          height={bodyHeight}
          rx={4}
          fill="rgba(200,200,210,0.06)"
          stroke="rgba(200,200,210,0.25)"
          strokeWidth={0.8}
        />

        {/* Water fill */}
        <motion.rect
          x={width * 0.1 + 1}
          width={width * 0.8 - 2}
          rx={3}
          fill={`url(#waterFill-${size})`}
          initial={false}
          animate={{
            y: capHeight + neckHeight + bodyHeight - fillHeight + 1,
            height: Math.max(0, fillHeight - 2),
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />

        {/* Water surface ripple */}
        {clampedFill > 0 && clampedFill < 1 && (
          <motion.ellipse
            cx={width / 2}
            rx={width * 0.35}
            ry={2}
            fill="rgba(147, 197, 253, 0.4)"
            initial={false}
            animate={{
              cy: capHeight + neckHeight + bodyHeight - fillHeight + 1,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        )}

        {/* Glass reflection overlay */}
        <rect
          x={width * 0.1}
          y={capHeight + neckHeight}
          width={width * 0.8}
          height={bodyHeight}
          rx={4}
          fill={`url(#glassShine-${size})`}
        />

        {/* VOSS text */}
        <text
          x={width / 2}
          y={capHeight + neckHeight + bodyHeight * 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(200,200,210,0.2)"
          fontSize={size * 0.06}
          fontWeight="700"
          letterSpacing="2"
          transform={`rotate(-90, ${width / 2}, ${capHeight + neckHeight + bodyHeight * 0.5})`}
        >
          VOSS
        </text>
      </svg>

      {/* Label */}
      {showLabel && (
        <div className="absolute -bottom-5 text-[10px] font-medium text-muted-foreground text-center whitespace-nowrap">
          {Math.round(clampedFill * 800)}ml
        </div>
      )}

      {/* Interactive hover glow */}
      {interactive && (
        <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity bg-blue-400/5" />
      )}
    </div>
  );
}

/** Mini version for completed bottles display */
export function VossBottleMini({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg width="20" height="52" viewBox="0 0 20 52" fill="none">
        {/* Cap */}
        <rect x="5" y="0" width="10" height="5" rx="1.5" fill="rgba(120,120,130,0.5)" />
        {/* Neck */}
        <path d="M5.5 5 L3 9 L17 9 L14.5 5 Z" fill="rgba(200,200,210,0.08)" stroke="rgba(200,200,210,0.2)" strokeWidth="0.3" />
        {/* Body */}
        <rect x="2" y="9" width="16" height="42" rx="2" fill="rgba(59,130,246,0.15)" stroke="rgba(96,165,250,0.4)" strokeWidth="0.5" />
        {/* Full fill */}
        <rect x="2.5" y="10" width="15" height="40" rx="1.5" fill="rgba(59,130,246,0.3)" />
        {/* VOSS */}
        <text x="10" y="30" textAnchor="middle" dominantBaseline="middle" fill="rgba(200,200,210,0.3)" fontSize="4" fontWeight="700" letterSpacing="1" transform="rotate(-90, 10, 30)">VOSS</text>
      </svg>
    </div>
  );
}
