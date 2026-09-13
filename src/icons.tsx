export const SunIcon = ({ size = 24, color = '#E07B00' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.5" fill="#F2A33C" stroke="none" />
    <line x1="12" y1="2.5" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="21.5" />
    <line x1="2.5" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="21.5" y2="12" />
    <line x1="5.3" y1="5.3" x2="7" y2="7" />
    <line x1="17" y1="17" x2="18.7" y2="18.7" />
    <line x1="18.7" y1="5.3" x2="17" y2="7" />
    <line x1="7" y1="17" x2="5.3" y2="18.7" />
  </svg>
);

/** Cute baked-in night graphic: the sun asleep on a little cloud, zzz and all. */
export const SleepingSun = () => (
  <svg width="180" height="132" viewBox="0 0 180 132" fill="none">
    <g stroke="#8a5f23" strokeWidth="4" strokeLinecap="round" opacity="0.7">
      <line x1="90" y1="19" x2="90" y2="9" />
      <line x1="134" y1="63" x2="144" y2="63" />
      <line x1="46" y1="63" x2="36" y2="63" />
      <line x1="121" y1="32" x2="128" y2="25" />
      <line x1="59" y1="32" x2="52" y2="25" />
      <line x1="121" y1="94" x2="128" y2="101" />
      <line x1="59" y1="94" x2="52" y2="101" />
    </g>
    <ellipse cx="90" cy="108" rx="46" ry="11" fill="#3b3325" />
    <ellipse cx="52" cy="104" rx="16" ry="8" fill="#463d2b" />
    <ellipse cx="126" cy="104" rx="18" ry="8" fill="#463d2b" />
    <circle cx="90" cy="63" r="36" fill="#e8a13c" />
    <path d="M 72 60 Q 77 66 82 60" stroke="#7a4d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M 98 60 Q 103 66 108 60" stroke="#7a4d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M 84 76 Q 90 80 96 76" stroke="#7a4d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <circle cx="70" cy="70" r="5" fill="#d97b28" opacity="0.55" />
    <circle cx="110" cy="70" r="5" fill="#d97b28" opacity="0.55" />
    <text x="132" y="40" fontSize="20" fontWeight="700" fill="#c9a25e" fontFamily="'Bricolage Grotesque', sans-serif">z</text>
    <text x="146" y="27" fontSize="15" fontWeight="700" fill="#b8934e" fontFamily="'Bricolage Grotesque', sans-serif">z</text>
    <text x="157" y="17" fontSize="11" fontWeight="700" fill="#a5823f" fontFamily="'Bricolage Grotesque', sans-serif">z</text>
  </svg>
);

export const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#9A8B74" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="9" cy="9" r="5.5" />
    <line x1="13.2" y1="13.2" x2="17" y2="17" />
  </svg>
);

export const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#2B2117" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="11,4 6,9 11,14" />
  </svg>
);

export const SwapIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 15 15" fill="none" stroke="#A85E00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9.5,2 12.5,5 9.5,8" />
    <line x1="12.5" y1="5" x2="2.5" y2="5" />
    <polyline points="5.5,7.5 2.5,10.5 5.5,13.5" />
    <line x1="2.5" y1="10.5" x2="12.5" y2="10.5" />
  </svg>
);

export const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#A85E00" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="7.5" cy="7.5" r="5.5" />
    <polyline points="7.5,4.5 7.5,7.5 9.8,9" />
  </svg>
);

export const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="4" stroke="#8A7B68" strokeWidth="1.6" />
    <circle cx="7" cy="7" r="1.6" fill="#8A7B68" />
  </svg>
);

export const TripIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <polygon points="11,2.5 19,19 11,15 3,19" />
  </svg>
);

export const CommuteIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14,3 18,7 14,11" />
    <line x1="18" y1="7" x2="4" y2="7" />
    <polyline points="8,11.5 4,15.5 8,19.5" />
    <line x1="4" y1="15.5" x2="18" y2="15.5" />
  </svg>
);

export const CheckBadge = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8" fill="#7C8A5A" />
    <path d="M 5.5 9 L 8 11.5 L 12.5 6.5" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WheelIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#9A8B74" strokeWidth="1.8">
    <circle cx="11" cy="11" r="8" />
    <circle cx="11" cy="11" r="2.5" />
    <line x1="3.2" y1="11" x2="8.5" y2="11" />
    <line x1="13.5" y1="11" x2="18.8" y2="11" />
    <line x1="11" y1="13.5" x2="11" y2="18.8" />
  </svg>
);

export const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#A85E00" strokeWidth="1.8" strokeLinecap="round">
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);
