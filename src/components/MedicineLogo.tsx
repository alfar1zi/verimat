interface MedicineLogoProps {
  size?: number;
  color?: string;
}

const MedicineLogo = ({ size = 28, color = '#FFFFFF' }: MedicineLogoProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 28 28" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Pill/capsule shape - horizontal */}
    <rect x="2" y="10" width="24" height="8" rx="4" 
          fill={color} opacity="0.15"/>
    <rect x="2" y="10" width="12" height="8" rx="4" 
          fill={color} opacity="0.9"/>
    <rect x="14" y="10" width="12" height="8" rx="4" 
          fill={color} opacity="0.4"/>
    {/* Dividing line */}
    <line x1="14" y1="10" x2="14" y2="18" 
          stroke={color} strokeWidth="1.5" opacity="0.6"/>
    {/* Small cross/plus above */}
    <line x1="14" y1="3" x2="14" y2="8" 
          stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="11.5" y1="5.5" x2="16.5" y2="5.5" 
          stroke={color} strokeWidth="2" strokeLinecap="round"/>
    {/* Small dots below to suggest medicine */}
    <circle cx="9" cy="23" r="1.5" fill={color} opacity="0.7"/>
    <circle cx="14" cy="24" r="1.5" fill={color} opacity="0.7"/>
    <circle cx="19" cy="23" r="1.5" fill={color} opacity="0.7"/>
  </svg>
);

export default MedicineLogo;
