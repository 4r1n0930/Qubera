import { useId } from "react";

type OrbitSpec = {
  rx: number;
  ry: number;
  rotation: number;
  opacity: number;
  thickness: number;
  dashed?: boolean;
  duration?: string;
  particle?: boolean;
  particleColor?: string;
};

const ORBIT_GAP = 13;
const BASE_RX = 152;
const BASE_RY = 56;

/**
 * Renders a single tilted elliptical orbit, optionally carrying a travelling
 * particle placed on the ellipse so the rotate animation sends it along the
 * path. The tilt is applied statically; a nested group carries the CSS rotate
 * animation (which respects prefers-reduced-motion).
 */
function Orbit({
  spec,
  cx,
  cy,
  glowId,
}: {
  spec: OrbitSpec;
  cx: number;
  cy: number;
  glowId: string;
}) {
  const dash = spec.dashed ? "5 6" : undefined;
  return (
    <g
      transform={`rotate(${spec.rotation} ${cx} ${cy})`}
      style={{ color: "#6d927d" }}
    >
      <ellipse
        cx={cx}
        cy={cy}
        rx={spec.rx}
        ry={spec.ry}
        fill="none"
        stroke="currentColor"
        strokeOpacity={spec.opacity}
        strokeWidth={spec.thickness}
        strokeDasharray={dash}
      />
      {spec.particle && (
        <g
          className="orbit-particle"
          style={{
            animationDuration: spec.duration ?? "28s",
            transformOrigin: `${cx}px ${cy}px`,
            transformBox: "view-box",
          }}
        >
          {/* Soft glow behind the particle */}
          <circle
            cx={cx + spec.rx}
            cy={cy}
            r="10"
            fill={spec.particleColor ?? "#6d927d"}
            opacity="0.25"
            filter={`url(#${glowId})`}
          />
          {/* Solid particle */}
          <circle
            cx={cx + spec.rx}
            cy={cy}
            r="4.5"
            fill={spec.particleColor ?? "#6d927d"}
          />
        </g>
      )}
    </g>
  );
}

/**
 * Abstract quantum atom illustration built entirely with SVG.
 *
 * - Large central spherical particle with soft 3D / glass-like rendering.
 * - Several elliptical orbital paths at different angles and depths.
 * - A mix of solid and dashed orbits with varied opacity.
 * - Small particles travelling along orbits with a soft green glow.
 *
 * The travelling particles rotate around the orbit center via the CSS
 * `orbit-rotate` keyframe, which respects prefers-reduced-motion.
 */
export function QuantumAtom() {
  const uid = useId();
  const glowId = `${uid}-glow`;
  const sheenId = `${uid}-sphere-sheen`;
  const cx = 200;
  const cy = 200;

  const orbits: OrbitSpec[] = [
    // Far, subtle dashed orbit (top-left tilt)
    { rx: BASE_RX + ORBIT_GAP * 1.5, ry: BASE_RY + 6, rotation: -24, opacity: 0.28, thickness: 1, dashed: true, duration: "34s", particle: true, particleColor: "#9dbdad" },
    // Far dashed orbit (high tilt)
    { rx: BASE_RX, ry: BASE_RY - 2, rotation: 88, opacity: 0.18, thickness: 1, dashed: true, duration: "46s", particle: true, particleColor: "#8fae9d" },
    // Mid solid orbit
    { rx: BASE_RX + ORBIT_GAP, ry: BASE_RY + 2, rotation: 18, opacity: 0.4, thickness: 1.6, duration: "26s", particle: true },
    // Front solid orbit
    { rx: BASE_RX + ORBIT_GAP * 2, ry: BASE_RY + 4, rotation: -8, opacity: 0.5, thickness: 1.6, duration: "22s", particle: true },
    // Front dashed orbit
    { rx: BASE_RX + ORBIT_GAP * 0.5, ry: BASE_RY - 4, rotation: 118, opacity: 0.32, thickness: 1, dashed: true, duration: "30s", particle: true, particleColor: "#a7c4b4" },
    // Subtle dashed backdrop orbit
    { rx: BASE_RX + ORBIT_GAP * 1, ry: BASE_RY + 3, rotation: 46, opacity: 0.2, thickness: 1, dashed: true, duration: "40s" },
  ];

  return (
    <svg
      viewBox="0 0 400 400"
      className="h-full w-full"
      role="img"
      aria-label="Styled illustration of a quantum atom with orbiting particles"
    >
      <defs>
        <radialGradient id={sheenId} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#b3cdbc" />
          <stop offset="42%" stopColor="#7fa08d" />
          <stop offset="75%" stopColor="#58806d" />
          <stop offset="100%" stopColor="#3d6356" />
        </radialGradient>

        <filter id={glowId} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" result="blur" />
        </filter>
      </defs>

      {/* Soft ground shadow beneath the central sphere */}
      <ellipse
        cx={cx}
        cy={cy + 14}
        rx="68"
        ry="15"
        fill="#0b3d32"
        opacity="0.08"
        filter={`url(#${glowId})`}
      />

      {/* Rear orbits first so the sphere sits in front */}
      {orbits
        .filter((_, i) => i >= 3)
         .map((spec, i) => (
          <Orbit
            key={`rear-${i}`}
            spec={spec}
            cx={cx}
            cy={cy}
            glowId={glowId}
          />
        ))}

      {/* Central sphere */}
      <g className="ambient-glow">
        <g filter="drop-shadow(0 20px 26px rgba(11,61,50,0.30))">
          <circle cx={cx} cy={cy} r="66" fill={`url(#${sheenId})`} />
          <ellipse
            cx={cx - 22}
            cy={cy - 26}
            rx="30"
            ry="19"
            fill="#ffffff"
            opacity="0.30"
            transform={`rotate(-28 ${cx - 22} ${cy - 26})`}
          />
          <ellipse
            cx={cx - 18}
            cy={cy - 35}
            rx="13"
            ry="8"
            fill="#ffffff"
            opacity="0.42"
            transform={`rotate(-34 ${cx - 18} ${cy - 35})`}
          />
          <ellipse
            cx={cx + 26}
            cy={cy + 28}
            rx="22"
            ry="11"
            fill="#0b3d32"
            opacity="0.20"
            transform={`rotate(150 ${cx + 26} ${cy + 28})`}
          />
          <circle
            cx={cx}
            cy={cy}
            r="66"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.32"
            strokeWidth="1.2"
          />
        </g>
      </g>

      {/* Front orbits over the sphere */}
      {orbits
        .slice(0, 3)
        .map((spec, i) => (
          <Orbit
            key={`front-${i}`}
            spec={spec}
            cx={cx}
            cy={cy}
            glowId={glowId}
          />
        ))}
    </svg>
  );
}
