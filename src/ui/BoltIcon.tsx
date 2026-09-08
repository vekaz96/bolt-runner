import type { CSSProperties } from "react";
import { boltIcons, type BoltIconName } from "./boltAssets";

export default function BoltIcon({ name, size = 28, className = "", style }: {
  name: BoltIconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return <img src={boltIcons[name]} alt="" aria-hidden="true" draggable={false}
    className={className} style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, pointerEvents: "none", ...style }} />;
}
