import { cn } from '@/components/ui/primitives';

/**
 * The small outline icon set the home page uses, inlined from the
 * "Irshad Homepage v2" design. Inline SVG keeps them crisp, styleable through
 * `currentColor`, and free of any extra request.
 *
 * All icons are decorative — every use sits next to visible text — so they are
 * `aria-hidden` unconditionally.
 */
const PATHS = {
  search: <path d="M17.5 17.5 A7 7 0 1 0 3.5 10.5 A7 7 0 0 0 17.5 17.5 M20 20l-4.4-4.4" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  clock: <path d="M21 12 A9 9 0 1 1 3 12 A9 9 0 0 1 21 12 M12 7v5.5l3.5 2" />,
  wallet: (
    <>
      <path d="M3 7.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <circle cx="16.5" cy="13.5" r="1.2" />
    </>
  ),
  doc: <path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5zM14 2.5v5h5M8.5 13h7M8.5 16.5h4.5" />,
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  shield: <path d="M12 2.8 4.5 6v6c0 4.6 3.2 7.9 7.5 9.2 4.3-1.3 7.5-4.6 7.5-9.2V6zm-3.2 9.2 2.2 2.2 4.2-4.4" />,
  photo: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.8-3.2 3.2-4.8 6-4.8s5.2 1.6 6 4.8M16.5 5.4a3.2 3.2 0 0 1 0 5.2M18 14.6c2 .8 3.2 2.3 3.7 4.4" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.4v.2" />
    </>
  ),
  check: <path d="m4 12.5 5 5L20 6.5" />,
  id: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="11" r="2.2" />
      <path d="M5 16.2c.7-1.4 1.8-2 3-2s2.3.6 3 2M14 10h5M14 14h3" />
    </>
  ),
  passport: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="10" r="3.2" />
      <path d="M9 17h6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
    </>
  ),
  home: <path d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M10 21v-6h4v6" />,
  car: (
    <>
      <path d="M3 13.5 5 8h14l2 5.5M3 13.5V18h18v-4.5z" />
      <circle cx="7.5" cy="18" r="1.6" />
      <circle cx="16.5" cy="18" r="1.6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.5" y="7" width="19" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M2.5 12.5h19" />
    </>
  ),
  tax: (
    <>
      <path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2zM9.5 13.5 14.5 8" />
      <circle cx="9.8" cy="8.8" r="1" />
      <circle cx="14.2" cy="13.2" r="1" />
    </>
  ),
  health: (
    <path d="M12 21s-8-5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 3.5C20 16 12 21 12 21zM12 10v5M9.5 12.5h5" />
  ),
  education: (
    <path d="M2.5 8.5 12 4l9.5 4.5L12 13zM6.5 10.5V16c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-5.5" />
  ),
  pension: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5h4a2 2 0 0 1 0 4h-4" />
    </>
  ),
  work: <path d="M4 17.5h16M6 17.5v-3a6 6 0 0 1 12 0v3M10 8.5V5h4v3.5" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20c1-3.8 3.9-5.7 7.5-5.7s6.5 1.9 7.5 5.7" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  court: <path d="M12 3v18M4 21h16M4 8h16M6 8v9M18 8v9M3 5.5 12 3l9 2.5" />,
} as const;

export type IconName = keyof typeof PATHS;

/**
 * Icon for a tag, matched on keywords in its slug so staff-created tags pick
 * up a sensible glyph without a schema change. Order matters — first match
 * wins — and anything unmatched falls back to the document icon.
 */
const TAG_ICON_RULES: ReadonlyArray<[RegExp, IconName]> = [
  [/passport/, 'passport'],
  [/national-id|nationality|identity|civil/, 'id'],
  [/travel|visa|abroad/, 'globe'],
  [/resid/, 'globe'],
  [/driv|vehicle|traffic|licen/, 'car'],
  [/business|company|trade|customs|commerc/, 'briefcase'],
  [/tax/, 'tax'],
  [/health|medical|insur/, 'health'],
  [/edu|school|universit|certificat|scholar|degree/, 'education'],
  [/pension|retire|social|welfare/, 'pension'],
  [/work|labou?r|employ/, 'work'],
  [/court|justice|notar|legal|family/, 'court'],
  [/property|land|estate|hous/, 'home'],
];

export function tagIcon(slug: string): IconName {
  const match = TAG_ICON_RULES.find(([pattern]) => pattern.test(slug));
  return match ? match[1] : 'doc';
}

export function Icon({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      {PATHS[name]}
    </svg>
  );
}
