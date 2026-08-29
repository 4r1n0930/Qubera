/**
 * Extremely subtle scientific / quantum decorations brushed around the brand
 * panel: tiny dots, pluses, faint orbital lines, quantum notation and a small
 * Bloch-sphere-inspired diagram. These must never compete with the logo or the
 * central atom, so all elements are intentionally low contrast.
 */
export function QuantumDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden text-ink/20"
    >
      {/* Quantum notation: |0⟩ */}
      <span className="absolute left-[9%] top-[30%] rotate-[-6deg] font-light text-lg text-ink/25">
        |0⟩
      </span>

      {/* Quantum notation: |1⟩ */}
      <span className="absolute right-[12%] top-[58%] rotate-[8deg] font-light text-lg text-ink/25">
        |1⟩
      </span>

      {/* Psi */}
      <span className="absolute left-[12%] top-[66%] rotate-[-4deg] font-serif italic text-2xl text-sage/40">
        ψ
      </span>

      {/* Scattered dots */}
      <span className="absolute left-[28%] top-[16%] h-1 w-1 rounded-full bg-sage/50" />
      <span className="absolute left-[6%] top-[46%] h-1 w-1 rounded-full bg-sage/40" />
      <span className="absolute right-[20%] top-[22%] h-1 w-1 rounded-full bg-sage/40" />
      <span className="absolute right-[34%] bottom-[24%] h-1 w-1 rounded-full bg-sage/40" />
      <span className="absolute left-[22%] bottom-[12%] h-1 w-1 rounded-full bg-sage/40" />

      {/* Pluses */}
      <span className="absolute left-[26%] top-[42%] font-thin text-base text-sage/45">
        +
      </span>
      <span className="absolute right-[8%] bottom-[40%] font-thin text-base text-sage/45">
        +
      </span>

      {/* Small orbit-ish arcs */}
      <svg
        className="absolute left-[5%] top-[6%] h-14 w-20 text-sage/25"
        viewBox="0 0 80 56"
        fill="none"
      >
        <path
          d="M4 28 C 24 4, 56 4, 76 28 C 56 52, 24 52, 4 28 Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      </svg>

      {/* Minimal circuit trace — top right */}
      <svg
        className="absolute right-[6%] top-[9%] text-sage/25"
        width="46"
        height="40"
        viewBox="0 0 46 40"
        fill="none"
      >
        <path
          d="M2 34 H22 V10 H36"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="2" cy="34" r="1.4" fill="currentColor" />
        <circle cx="36" cy="10" r="1.4" fill="currentColor" />
      </svg>

      {/* Minimal circuit trace — bottom right */}
      <svg
        className="absolute bottom-[12%] right-[9%] text-sage/25"
        width="44"
        height="38"
        viewBox="0 0 44 38"
        fill="none"
      >
        <path
          d="M2 4 H20 V24 H40"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <circle cx="2" cy="4" r="1.4" fill="currentColor" />
        <circle cx="40" cy="24" r="1.4" fill="currentColor" />
      </svg>

      {/* Bloch-sphere inspired diagram — bottom left */}
      <svg
        className="absolute bottom-[8%] left-[9%] text-sage/35"
        width="58"
        height="58"
        viewBox="0 0 58 58"
        fill="none"
      >
        <ellipse
          cx="29"
          cy="29"
          rx="24"
          ry="15"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <line
          x1="5"
          y1="29"
          x2="53"
          y2="29"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="29"
          y1="4"
          x2="29"
          y2="54"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <circle cx="29" cy="7" r="2.2" fill="currentColor" />
        <circle cx="29" cy="50" r="2.2" fill="currentColor" />
        <text
          x="24"
          y="16"
          fontSize="9"
          fill="currentColor"
          fontFamily="Inter, sans-serif"
        >
          |0⟩
        </text>
      </svg>
    </div>
  );
}
