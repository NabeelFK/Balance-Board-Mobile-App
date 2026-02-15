// A simple sparkle XP icon for the XP popup. Replace with your own sprite if desired.
import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export default function XpSparkleIcon({ size = 38 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 38 38" fill="none">
      <Circle cx="19" cy="19" r="19" fill="#fff" fillOpacity={0.18} />
      <Path d="M19 6l2.5 7.5L29 16l-7.5 2.5L19 29l-2.5-7.5L9 16l7.5-2.5L19 6z" fill="#FFD700" stroke="#F7B500" strokeWidth={2}/>
      <Circle cx="19" cy="19" r="4" fill="#FFF9C4" />
    </Svg>
  );
}
