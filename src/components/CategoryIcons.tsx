import React from 'react';

// Common SVG props
interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const defaultProps = {
  viewBox: "0 0 100 100",
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none"
};

export const BreakfastIcon: React.FC<IconProps> = ({ size = 80, ...props }) => (
  <svg width={size} height={size} {...defaultProps} {...props}>
    {/* Chapati/Pancake base */}
    <circle cx="50" cy="55" r="35" fill="#FFE0B2" />
    <circle cx="50" cy="55" r="32" fill="#FFCC80" />
    {/* Samosa */}
    <path d="M 25 70 L 45 35 L 65 70 Z" fill="#FFA726" stroke="#FF9800" strokeWidth="2" strokeLinejoin="round" />
    {/* Egg */}
    <circle cx="65" cy="60" r="18" fill="#FFFFFF" />
    <circle cx="62" cy="62" r="8" fill="#FFCA28" />
    {/* Sausage */}
    <rect x="25" y="45" width="40" height="14" rx="7" transform="rotate(-15 45 52)" fill="#8D6E63" />
    <path d="M 33 46 q 10 -5 20 5" stroke="#795548" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

export const ChickenIcon: React.FC<IconProps> = ({ size = 80, ...props }) => (
  <svg width={size} height={size} {...defaultProps} {...props}>
    {/* Roasted Chicken full body */}
    <ellipse cx="50" cy="55" rx="35" ry="25" fill="#FFA726" />
    <ellipse cx="50" cy="55" rx="30" ry="20" fill="#FFB74D" />
    
    {/* Left Leg */}
    <path d="M 25 55 Q 15 45 10 50 Q 5 55 15 65 Q 25 55 25 55" fill="#FFE0B2" stroke="#FFCC80" strokeWidth="2" strokeLinejoin="round" />
    <ellipse cx="28" cy="55" rx="10" ry="14" transform="rotate(30 28 55)" fill="#FB8C00" />
    
    {/* Right Leg */}
    <path d="M 75 55 Q 85 45 90 50 Q 95 55 85 65 Q 75 55 75 55" fill="#FFE0B2" stroke="#FFCC80" strokeWidth="2" strokeLinejoin="round" />
    <ellipse cx="72" cy="55" rx="10" ry="14" transform="rotate(-30 72 55)" fill="#FB8C00" />
  </svg>
);

export const ChipsIcon: React.FC<IconProps> = ({ size = 80, ...props }) => (
  <svg width={size} height={size} {...defaultProps} {...props}>
    {/* French Fries array */}
    <rect x="35" y="25" width="6" height="40" rx="3" fill="#FFCA28" />
    <rect x="45" y="20" width="6" height="45" rx="3" fill="#FFE082" />
    <rect x="55" y="22" width="6" height="43" rx="3" fill="#FFCA28" />
    <rect x="28" y="32" width="6" height="30" rx="3" fill="#FFD54F" transform="rotate(-15 31 47)" />
    <rect x="62" y="30" width="6" height="35" rx="3" fill="#FFD54F" transform="rotate(10 65 47)" />
    
    {/* Container */}
    <path d="M 25 55 L 30 85 q 2 5 8 5 h 24 q 6 0 8 -5 L 75 55 q 5 -10 -5 -10 h -40 q -10 0 -5 10" fill="#EF5350" stroke="#E53935" strokeWidth="2" strokeLinejoin="round" />
    
    {/* Container Highlight */}
    <path d="M 32 60 q 18 10 36 0" stroke="#FF8A80" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

export const DrinksIcon: React.FC<IconProps> = ({ size = 80, ...props }) => (
  <svg width={size} height={size} {...defaultProps} {...props}>
    {/* Soda Can */}
    <rect x="25" y="45" width="24" height="35" rx="4" fill="#42A5F5" />
    <rect x="25" y="45" width="24" height="5" rx="2" fill="#90CAF9" />
    <rect x="25" y="75" width="24" height="5" rx="2" fill="#1E88E5" />
    <circle cx="37" cy="62" r="6" fill="#FFFFFF" opacity="0.8" />
    
    {/* Takeaway Cup */}
    <path d="M 55 35 h 20 l -4 45 h -12 z" fill="#FFEE58" />
    {/* Cup Lid */}
    <path d="M 52 30 q 15 -5 26 0 v 5 h -26 z" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1" />
    {/* Straw */}
    <path d="M 62 15 l 5 15" stroke="#F44336" strokeWidth="3" strokeLinecap="round" />
    {/* Cup Highlight */}
    <path d="M 58 40 l -2 35" stroke="#FFF59D" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PackagingIcon: React.FC<IconProps> = ({ size = 80, ...props }) => (
  <svg width={size} height={size} {...defaultProps} {...props}>
    {/* Back Handle */}
    <path d="M 40 30 v -8 q 0 -7 10 -7 q 10 0 10 7 v 8" stroke="#D7CCC8" strokeWidth="4" fill="none" strokeLinecap="round" />
    
    {/* Main Bag */}
    <path d="M 25 35 q 0 -5 5 -5 h 40 q 5 0 5 5 v 45 q 0 5 -5 5 h -40 q -5 0 -5 -5 z" fill="#8D6E63" stroke="#795548" strokeWidth="2" />
    
    {/* Bag Flap/Fold line */}
    <path d="M 25 45 l 25 15 l 25 -15" stroke="#795548" strokeWidth="2" fill="none" strokeLinejoin="round" />
    
    {/* Front Handle */}
    <path d="M 35 38 v -5 q 0 -5 15 -5 q 15 0 15 5 v 5" stroke="#A1887F" strokeWidth="5" fill="none" strokeLinecap="round" />
    
    {/* Logo mark */}
    <circle cx="50" cy="70" r="6" fill="#FFC533" />
  </svg>
);
