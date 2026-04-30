/* D3 SVG shape generators for node rendering */

/** Diamond path (rotated square) centered at 0,0 */
export function diamondPath(size: number): string {
  const h = size;
  return `M 0 ${-h} L ${h * 0.7} 0 L 0 ${h} L ${-h * 0.7} 0 Z`;
}

/** Regular hexagon path centered at 0,0 */
export function hexagonPath(size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${size * Math.cos(angle)},${size * Math.sin(angle)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

/** Simple circle path (for consistency when building path-based nodes) */
export function circlePath(size: number): string {
  return `M 0,${-size} A ${size},${size} 0 1,1 0,${size} A ${size},${size} 0 1,1 0,${-size} Z`;
}

/** Arrow marker definition for SVG <defs> */
export function arrowMarkerDef(id: string, color: string): string {
  return `<marker id="${id}" viewBox="0 0 10 10" refX="10" refY="5"
    markerWidth="6" markerHeight="6" orient="auto-start-reverse"
    fill="${color}">
    <path d="M 0 0 L 10 5 L 0 10 Z" />
  </marker>`;
}

