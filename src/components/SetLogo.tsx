/**
 * SET game logo - styled after the official logo with card stack effect
 */
export function SetLogo({ className = '' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 220 70" 
      className={className}
      aria-label="SET Solver"
    >
      <defs>
        {/* Stripe pattern for stacked cards */}
        <pattern id="cardStripes" patternUnits="userSpaceOnUse" width="100" height="3">
          <rect width="100" height="1.5" fill="#1a1a1a" />
          <rect y="1.5" width="100" height="1.5" fill="white" />
        </pattern>
      </defs>
      
      {/* S card */}
      <g transform="translate(0, 5)">
        {/* Stacked cards behind */}
        <rect x="8" y="-8" width="40" height="55" fill="url(#cardStripes)" stroke="#1a1a1a" strokeWidth="2" />
        <rect x="4" y="-4" width="40" height="55" fill="url(#cardStripes)" stroke="#1a1a1a" strokeWidth="2" />
        {/* Main card */}
        <rect x="0" y="0" width="40" height="55" fill="white" stroke="#1a1a1a" strokeWidth="3" />
        {/* S letter */}
        <text x="20" y="43" textAnchor="middle" fontFamily="Georgia, Times, serif" fontSize="38" fontWeight="400" fontStyle="italic" fill="#1a1a1a">S</text>
      </g>
      
      {/* E card */}
      <g transform="translate(50, 5)">
        {/* Stacked cards behind */}
        <rect x="8" y="-8" width="40" height="55" fill="url(#cardStripes)" stroke="#1a1a1a" strokeWidth="2" />
        <rect x="4" y="-4" width="40" height="55" fill="url(#cardStripes)" stroke="#1a1a1a" strokeWidth="2" />
        {/* Main card */}
        <rect x="0" y="0" width="40" height="55" fill="white" stroke="#1a1a1a" strokeWidth="3" />
        {/* E letter */}
        <text x="20" y="43" textAnchor="middle" fontFamily="Georgia, Times, serif" fontSize="38" fontWeight="400" fill="#1a1a1a">E</text>
      </g>
      
      {/* T card */}
      <g transform="translate(100, 5)">
        {/* Stacked cards behind */}
        <rect x="8" y="-8" width="40" height="55" fill="url(#cardStripes)" stroke="#1a1a1a" strokeWidth="2" />
        <rect x="4" y="-4" width="40" height="55" fill="url(#cardStripes)" stroke="#1a1a1a" strokeWidth="2" />
        {/* Main card */}
        <rect x="0" y="0" width="40" height="55" fill="white" stroke="#1a1a1a" strokeWidth="3" />
        {/* T letter */}
        <text x="20" y="43" textAnchor="middle" fontFamily="Georgia, Times, serif" fontSize="38" fontWeight="400" fill="#1a1a1a">T</text>
      </g>
      
      {/* Solver text - positioned to the right */}
      <text x="155" y="40" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#1a1a1a">Solver</text>
    </svg>
  )
}
