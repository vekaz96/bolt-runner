import type { AriaRole, CSSProperties, ReactNode } from "react";
import { boltSurfaces, type BoltSurfaceName } from "./boltAssets";

/** Decorative, non-interactive image layer. Text and controls remain real DOM. */
export default function BoltSurface({ name, className = "", style, children, role }: {
  name: BoltSurfaceName;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  role?: AriaRole;
}) {
  return <span role={role} className={`relative inline-flex items-center justify-center ${className}`} style={style}>
    <img src={boltSurfaces[name]} alt="" aria-hidden="true" draggable={false}
      className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none" />
    <span className="relative z-10 inline-flex items-center justify-center">{children}</span>
  </span>;
}
