export function QuantumOrbit() {
  return (
    <svg
      className="dash-hero-orb"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="14" fill="#2f6b57" opacity="0.9" />
      <circle cx="100" cy="100" r="4" fill="#9fc0a8" />
      <ellipse cx="100" cy="100" rx="60" ry="24" stroke="#9fc0a8" strokeWidth="1.4" opacity="0.7" />
      <ellipse cx="100" cy="100" rx="60" ry="24" stroke="#6d927d" strokeWidth="1.2" opacity="0.6" transform="rotate(60 100 100)" />
      <ellipse cx="100" cy="100" rx="60" ry="24" stroke="#6d927d" strokeWidth="1.2" opacity="0.6" transform="rotate(120 100 100)" />
      <circle r="5" fill="#c8b184" opacity="0.9">
        <animateMotion
          dur="12s"
          repeatCount="indefinite"
          path="M40,100 A60,24 0 1,1 160,100 A60,24 0 1,1 40,100"
        />
      </circle>
      <circle r="4" fill="#6d927d" opacity="0.9">
        <animateMotion
          dur="16s"
          repeatCount="indefinite"
          path="M100,40 A60,24 0 1,1 100,160 A60,24 0 1,1 100,40"
          rotate="auto"
        />
      </circle>
      <circle r="3" fill="#2f6b57" opacity="0.8">
        <animateMotion
          dur="14s"
          repeatCount="indefinite"
          path="M60,50 A60,24 0 1,1 60,150 A60,24 0 1,1 60,50"
        />
      </circle>
    </svg>
  )
}
