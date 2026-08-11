import { IRAQ_MAP } from '@/lib/public/geo';

export type MapDot = {
  x: number;
  y: number;
  label: string;
  count: number;
  big: boolean;
};

/**
 * Iraq with a dot per province that has offices, rendered as static server-side
 * SVG — it costs nothing on the wire beyond its own markup and needs no
 * JavaScript. The same information is in the province chip list beside it, so
 * the map is reinforcement, not the only carrier (and screen readers get the
 * chips, not the drawing).
 */
export default function IraqMap({ dots }: { dots: MapDot[] }) {
  return (
    <svg
      viewBox={`0 0 ${IRAQ_MAP.width} ${IRAQ_MAP.height}`}
      aria-hidden="true"
      className="h-auto w-full max-w-[560px]"
    >
      <path
        d={IRAQ_MAP.path}
        fill="#fff"
        stroke="var(--color-ink-950)"
        strokeWidth="1.5"
      />
      {dots.map((dot) => (
        <g key={dot.label} transform={`translate(${dot.x} ${dot.y})`}>
          <circle r={dot.big ? 11 : 9} fill="var(--color-brand-500)" opacity="0.14" />
          <circle
            r={dot.big ? 6 : 4}
            fill="var(--color-brand-500)"
            stroke="#fff"
            strokeWidth="1.5"
          />
          {dot.big ? (
            <>
              <text
                y="-14"
                textAnchor="middle"
                fontSize="15"
                fontWeight="700"
                fill="var(--color-ink-950)"
              >
                {dot.label}
              </text>
              <text
                y="24"
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="var(--color-ink-500)"
              >
                {dot.count}
              </text>
            </>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
