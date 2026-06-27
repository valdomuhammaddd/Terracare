import Svg, { Circle, Path } from 'react-native-svg';

interface ShieldIconProps {
  size?: number;
  className?: string;
}

export function ShieldIcon({ size = 80, className }: ShieldIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
    >
      <Circle cx="50" cy="50" r="40" fill="#10b981" fillOpacity={0.05} />
      <Path
        d="M50 15C35 15 25 20 20 35V55C20 70 35 85 50 90C65 85 80 70 80 55V35C75 20 65 15 50 15Z"
        stroke="#059669"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={5}
      />
      <Path
        d="M30 55H40L45 40L55 70L60 55H70"
        stroke="#059669"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={5}
      />
    </Svg>
  );
}
