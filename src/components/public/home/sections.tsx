import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container, cn } from '@/components/ui/primitives';
import { Icon, tagIcon, type IconName } from './icons';
import IraqMap, { type MapDot } from './IraqMap';
import InteractiveMap, { type CityMarker } from './InteractiveMap';
import HeroSearch from './HeroSearch';
import { Reveal } from './motion';

/**
 * The home page sections, in document order — a direct implementation of the
 * "Irshad Homepage v2" design: flat surfaces, hairline `ink-200` borders,
 * square corners, indigo brand with a single gold accent for the
 * highest-emphasis action on dark panels.
 *
 * Everything is a server component; the only interactivity is native form
 * submission and links, so the page works in full with JavaScript disabled.
 */

/* ── hero ─────────────────────────────────────────────────────────────── */

export async function Hero() {
  const t = await getTranslations('home');

  const chips = [t('chip1'), t('chip2'), t('chip3'), t('chip4')];
  const steps = [1, 2, 3].map((n) => ({
    n,
    title: t(`how${n}Title` as 'how1Title'),
    body: t(`how${n}Body` as 'how1Body'),
  }));

  return (
    <section className="border-b border-ink-200 bg-white">
      <Container width="wide" className="grid lg:grid-cols-[1fr_420px]">
        <Reveal onMount className="py-12 lg:pe-10">
          <div className="mb-5 inline-flex items-center gap-2 border border-ink-300 px-3 py-1.5 text-xs font-bold tracking-wide text-ink-600">
            <span aria-hidden="true" className="inline-block size-1.5 bg-brand-500" />
            {t('badge')}
          </div>
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-600">{t('heroSub')}</p>

          {/* The one interactive leaf on this page. It renders the same plain
              GET form when JavaScript never arrives, and adds live suggestions
              once it does — see HeroSearch. */}
          <HeroSearch placeholder={t('searchPlaceholder')} />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-ink-500">{t('tryThese')}</span>
            {chips.map((chip) => (
              <Link
                key={chip}
                href={`/search?q=${encodeURIComponent(chip)}`}
                className="border border-ink-300 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 hover:border-brand-500 hover:text-brand-500"
              >
                {chip}
              </Link>
            ))}
          </div>
        </Reveal>

        {/* How-it-works panel. The oversized letter is the brand mark as
            texture; it must never be read, hence aria-hidden. */}
        <div className="relative overflow-hidden bg-brand-500 text-white lg:border-s lg:border-ink-200">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -end-2 select-none text-[240px] leading-[0.8] font-extrabold text-white/10"
          >
            إ
          </div>
          <Reveal onMount delay={0.15} className="relative flex h-full flex-col px-8 py-10">
            <div className="mb-6 text-xs font-extrabold tracking-[0.16em] uppercase text-white/75">
              {t('howItWorks')}
            </div>
            <ol className="flex flex-col gap-6">
              {steps.map((step) => (
                <li key={step.n} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center border-[1.5px] border-white/70 text-sm font-extrabold"
                  >
                    {step.n}
                  </span>
                  <span>
                    <span className="block text-[17px] font-extrabold">{step.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/80">
                      {step.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-auto pt-7">
              <Link
                href="/procedures"
                className="inline-flex items-center gap-2 bg-gold-400 px-5 py-3 text-sm font-bold text-ink-950 hover:bg-white hover:text-brand-500"
              >
                {t('seeExample')}
                <Icon name="arrow" className="size-4 rtl:-scale-x-100" strokeWidth={2.2} />
              </Link>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ── stats strip ──────────────────────────────────────────────────────── */

export type Stat = { icon: 'doc' | 'shield' | 'pin' | 'users'; value: number; label: string };

export function StatsStrip({ stats }: { stats: Stat[] }) {
  const format = new Intl.NumberFormat('en');
  return (
    <section className="border-b border-ink-200 bg-ink-950 text-white">
      <Container width="wide" className="grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3.5 border-e border-white/15 px-4 py-5 last:border-e-0 sm:px-8"
          >
            <Icon name={stat.icon} className="size-5 text-gold-400" />
            <span>
              <span className="block text-2xl font-extrabold tracking-tight tabular">
                {format.format(stat.value)}
              </span>
              <span className="block text-xs font-semibold text-white/60">{stat.label}</span>
            </span>
          </div>
        ))}
      </Container>
    </section>
  );
}

/* ── section heading shared by the list sections ──────────────────────── */

function SectionHead({
  title,
  sub,
  linkHref,
  linkLabel,
}: {
  title: string;
  sub?: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink-950">{title}</h2>
        {sub ? <p className="mt-1 text-sm text-ink-500">{sub}</p> : null}
      </div>
      <Link
        href={linkHref}
        className="inline-flex min-h-6 items-center gap-1.5 text-sm font-bold text-brand-500 hover:text-brand-600"
      >
        {linkLabel}
        <Icon name="arrow" className="size-4 rtl:-scale-x-100" strokeWidth={2} />
      </Link>
    </div>
  );
}

/* ── most requested procedures ────────────────────────────────────────── */

export type PopularCard = {
  slug: string;
  title: string;
  office: string;
  icon: IconName;
  badge: string | null;
  stepsLabel: string;
  dots: boolean[];
  time: string | null;
  fee: string;
};

export async function PopularSection({ cards }: { cards: PopularCard[] }) {
  const t = await getTranslations('home');
  if (cards.length === 0) return null;
  return (
    <section className="border-b border-ink-200 bg-white">
      <Container width="wide" className="py-10">
        <Reveal>
          <SectionHead
            title={t('popular')}
            sub={t('popularSub')}
            linkHref="/procedures"
            linkLabel={t('viewAll')}
          />
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <li key={card.slug}>
              <Reveal delay={index * 0.07} className="h-full">
                <Link
                  href={`/procedures/${card.slug}`}
                  className="flex h-full flex-col gap-3.5 border border-ink-200 p-5 text-ink-950 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-[0_6px_20px_rgba(11,16,48,0.1)]"
                >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2.5">
                    <Icon name={card.icon} className="size-5 text-brand-500" strokeWidth={1.7} />
                    <span className="text-xs font-extrabold tracking-wider uppercase text-ink-500">
                      {card.office}
                    </span>
                  </span>
                  {card.badge ? (
                    <span className="shrink-0 border border-gold-400/50 bg-gold-100 px-1.5 py-0.5 text-xs font-extrabold text-gold-800">
                      {card.badge}
                    </span>
                  ) : null}
                </span>
                <span className="text-lg leading-snug font-extrabold">{card.title}</span>
                <span className="flex items-center gap-1.5" aria-hidden="true">
                  {card.dots.map((filled, i) => (
                    <span
                      key={i}
                      className={cn('block h-1 flex-1', filled ? 'bg-brand-500' : 'bg-ink-200')}
                    />
                  ))}
                  <span className="ms-1.5 text-xs font-bold whitespace-nowrap text-ink-500">
                    {card.stepsLabel}
                  </span>
                </span>
                <span className="mt-auto flex gap-6 border-t border-ink-100 pt-3">
                  {card.time ? (
                    <span className="flex items-center gap-1.5">
                      <Icon name="clock" className="size-4 text-ink-400" />
                      <span className="text-sm font-bold">{card.time}</span>
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <Icon name="wallet" className="size-4 text-ink-400" />
                    <span className="text-sm font-bold">{card.fee}</span>
                  </span>
                </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ── browse by topic (tags) ───────────────────────────────────────────── */

export type TopicCell = { slug: string; title: string; countLabel: string };

export async function TopicsSection({ topics }: { topics: TopicCell[] }) {
  const t = await getTranslations('home');
  if (topics.length === 0) return null;
  return (
    <section className="border-b border-ink-200 bg-white">
      <Container width="wide" className="py-10">
        <Reveal>
          <SectionHead
            title={t('topics')}
            sub={t('topicsSub')}
            linkHref="/procedures/tags"
            linkLabel={t('allTopics')}
          />
        </Reveal>
        <Reveal>
          <ul className="grid grid-cols-2 gap-px border border-ink-200 bg-ink-200 md:grid-cols-4">
          {topics.map((topic) => (
            <li key={topic.slug} className="min-w-0">
              <Link
                href={`/procedures?tag=${encodeURIComponent(topic.slug)}`}
                className="group flex h-full min-h-[108px] flex-col justify-between gap-3 bg-white p-4 text-ink-950 transition-colors hover:bg-brand-50 sm:p-5"
              >
                <span className="flex size-10 items-center justify-center bg-brand-100 transition-colors group-hover:bg-brand-500">
                  <Icon
                    name={tagIcon(topic.slug)}
                    className="size-5 text-brand-500 transition-colors group-hover:text-white"
                    strokeWidth={1.7}
                  />
                </span>
                <span>
                  <span className="block text-[15px] leading-snug font-extrabold">
                    {topic.title}
                  </span>
                  <span className="mt-1 block text-xs text-ink-500">{topic.countLabel}</span>
                </span>
              </Link>
            </li>
          ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── anatomy of a procedure page ──────────────────────────────────────── */

export async function AnatomySection() {
  const t = await getTranslations('home');
  const anatomyIcons = ['doc', 'wallet', 'clock', 'pin', 'photo', 'doc'] as const;
  const facts = [
    [t('mockFee'), t('mockFeeV')],
    [t('mockTime'), t('mockTimeV')],
    [t('mockVisits'), t('mockVisitsV')],
    [t('mockDocsK'), t('mockDocsV')],
  ];
  const flow = [1, 2, 3, 4, 5].map((n) => t(`mockFlow${n}` as 'mockFlow1'));
  const docs = [1, 2, 3, 4].map((n) => t(`mockDoc${n}` as 'mockDoc1'));

  return (
    <section className="border-b border-ink-200 bg-ink-50">
      <Container width="wide" className="grid items-start gap-10 py-11 lg:grid-cols-[320px_1fr]">
        <Reveal>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-950">
            {t('anatomyTitle')}
          </h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-600">{t('anatomyBody')}</p>
          <ul className="mt-5 flex flex-col gap-3">
            {anatomyIcons.map((icon, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Icon name={icon} className="mt-0.5 size-4.5 text-brand-500" />
                <span className="text-sm leading-relaxed font-semibold text-ink-700">
                  {t(`anatomy${i + 1}` as 'anatomy1')}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* A miniature, illustrative procedure page. Decorative chrome only —
            the real thing is one click away on any procedure. */}
        <Reveal delay={0.1} className="border border-ink-200 bg-white shadow-[0_4px_16px_rgba(11,16,48,0.06)]">
          <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-100 px-4 py-2.5">
            <span aria-hidden="true" className="size-2 bg-ink-300" />
            <span aria-hidden="true" className="size-2 bg-ink-300" />
            <span className="flex-1" />
            <span className="text-xs font-bold tracking-wide text-ink-500" dir="ltr">
              irshad.iq / {t('mockUrl')}
            </span>
          </div>
          <div className="p-5 sm:p-7">
            <div className="mb-2 text-xs font-extrabold tracking-[0.12em] uppercase text-brand-500">
              {t('mockCat')}
            </div>
            <div className="mb-4 text-xl font-extrabold tracking-tight text-ink-950 sm:text-2xl">
              {t('mockTitle')}
            </div>
            <dl className="mb-6 grid grid-cols-2 gap-px border border-ink-200 bg-ink-200 sm:grid-cols-4">
              {facts.map(([k, v]) => (
                <div key={k} className="bg-white px-3.5 py-3">
                  <dt className="text-xs font-bold text-ink-500">{k}</dt>
                  <dd className="mt-0.5 text-[15px] font-extrabold text-ink-950">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mb-4 text-xs font-extrabold tracking-[0.1em] uppercase text-ink-500">
              {t('mockSteps')}
            </div>
            <ol className="mb-7 hidden items-start sm:flex">
              {flow.map((label, i) => (
                <li key={label} className="relative flex flex-1 flex-col items-center text-center">
                  {i < flow.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-4 start-1/2 h-0.5 w-full bg-ink-200"
                    />
                  ) : null}
                  <span
                    className={cn(
                      'relative z-1 flex size-8 items-center justify-center rounded-full border-2 text-[13px] font-extrabold',
                      i === 0
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-ink-200 bg-white text-ink-500',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="mt-2.5 px-2 text-xs leading-snug font-bold text-ink-800">
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            <ol className="mb-7 flex flex-col gap-2 sm:hidden">
              {flow.map((label, i) => (
                <li key={label} className="flex items-center gap-2.5 text-sm font-semibold text-ink-800">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ink-300 text-xs font-extrabold text-ink-600">
                    {i + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-3 text-xs font-extrabold tracking-[0.1em] uppercase text-ink-500">
                  {t('mockDocs')}
                </div>
                <ul className="flex flex-col gap-2">
                  {docs.map((doc) => (
                    <li key={doc} className="flex items-center gap-2.5 text-sm font-semibold text-ink-700">
                      <span className="flex size-4 shrink-0 items-center justify-center border-[1.5px] border-ink-300">
                        <Icon name="check" className="size-2.5 text-ink-400" strokeWidth={3.4} />
                      </span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-3 text-xs font-extrabold tracking-[0.1em] uppercase text-ink-500">
                  {t('mockWhere')}
                </div>
                <div className="border border-ink-200 p-3.5">
                  <div className="text-sm font-extrabold text-ink-950">{t('mockOffice')}</div>
                  <div className="mt-1 text-xs text-ink-500">{t('mockAddress')}</div>
                  <div className="mt-2.5 flex items-center gap-2 text-xs">
                    <span className="font-semibold text-ink-600">{t('mockHours')}</span>
                  </div>
                  <div className="mt-3 flex h-16 items-center justify-center border border-ink-100 bg-ink-50">
                    <Icon name="pin" className="size-5 text-brand-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── ministries ───────────────────────────────────────────────────────── */

export type MinistryCell = {
  slug: string;
  title: string;
  logoUrl: string | null;
  countLabel: string;
};

export async function MinistriesSection({ ministries }: { ministries: MinistryCell[] }) {
  const t = await getTranslations('home');
  if (ministries.length === 0) return null;
  return (
    <section className="border-b border-ink-200 bg-white">
      <Container width="wide" className="py-10">
        <Reveal>
          <SectionHead
            title={t('ministries')}
            sub={t('ministriesSub')}
            linkHref="/ministries"
            linkLabel={t('allMinistries')}
          />
        </Reveal>
        <Reveal>
          <ul className="grid gap-px border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
          {ministries.map((ministry) => (
            <li key={ministry.slug} className="min-w-0">
              <Link
                href={`/ministries/${ministry.slug}`}
                className="flex h-full min-h-[84px] items-center gap-3.5 bg-white p-4 text-ink-950 transition-colors hover:bg-ink-50"
              >
                <span className="flex size-12 shrink-0 items-center justify-center border border-ink-200 bg-ink-50">
                  {ministry.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- PocketBase thumb, already sized; next/image would add a proxy hop for a 48px logo.
                    <img src={ministry.logoUrl} alt="" className="max-h-full max-w-full" />
                  ) : (
                    <Icon name="shield" className="size-5 text-ink-300" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-snug font-bold">{ministry.title}</span>
                  <span className="mt-1 block text-xs text-ink-500">{ministry.countLabel}</span>
                </span>
              </Link>
            </li>
          ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── map + provincial offices ─────────────────────────────────────────── */

export type ProvinceChip = { id: string; name: string; count: number };
export type BranchCard = {
  id: string;
  title: string;
  address: string | null;
  href: string;
  provinceName: string | null;
};

export async function MapSection({
  dots,
  markers,
  dir,
  provinces,
  branches,
}: {
  dots: MapDot[];
  markers: CityMarker[];
  dir: 'ltr' | 'rtl';
  provinces: ProvinceChip[];
  branches: BranchCard[];
}) {
  const t = await getTranslations('home');
  return (
    <section className="border-b border-ink-200 bg-white">
      <Container width="wide" className="grid lg:grid-cols-[1fr_400px]">
        <Reveal className="py-8 lg:pe-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-950">{t('mapTitle')}</h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-600">{t('mapSub')}</p>
          <div className="mt-4">
            <InteractiveMap
              markers={markers}
              dir={dir}
              fallback={<IraqMap dots={dots} />}
            />
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {provinces.map((province) => (
              <li key={province.id}>
                <Link
                  href={`/directorates?province=${encodeURIComponent(province.id)}`}
                  className="flex items-center gap-2 border border-ink-300 bg-white px-3 py-1.5 text-[13px] font-bold text-ink-950 transition-colors hover:border-brand-500 hover:text-brand-500"
                >
                  {province.name}
                  <span className="text-xs font-bold text-ink-400 tabular">{province.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="bg-ink-50 py-7 lg:border-s lg:border-ink-200 lg:ps-7">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[17px] font-extrabold text-ink-950">{t('mapOffices')}</h3>
            <Link href="/directorates" className="inline-flex min-h-6 items-center text-[13px] font-bold text-brand-500">
              {t('viewAll')}
            </Link>
          </div>
          <ul className="flex flex-col gap-2.5">
            {branches.map((branch) => (
              <li key={branch.id}>
                <Link
                  href={branch.href}
                  className="flex gap-3.5 border border-ink-200 bg-white p-4 text-ink-950 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-500"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center bg-brand-100">
                    <Icon name="pin" className="size-5 text-brand-500" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm leading-snug font-extrabold">
                      {branch.title}
                    </span>
                    {branch.address ? (
                      <span className="mt-0.5 block text-xs text-ink-500">{branch.address}</span>
                    ) : null}
                    {branch.provinceName ? (
                      <span className="mt-2 inline-block bg-ink-100 px-1.5 py-0.5 text-xs font-bold text-ink-600">
                        {branch.provinceName}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── recently updated + FAQ preview ───────────────────────────────────── */

export type RecentRow = { slug: string; title: string; date: string; office: string | null };
export type FaqRow = { id: string; question: string };

export async function RecentAndFaq({ recent, faq }: { recent: RecentRow[]; faq: FaqRow[] }) {
  const t = await getTranslations('home');
  return (
    <section className="border-b border-ink-200 bg-white">
      <Container width="wide" className="grid lg:grid-cols-2">
        <Reveal className="py-9 lg:border-e lg:border-ink-200 lg:pe-9">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink-950">{t('recent')}</h2>
            <Link href="/procedures" className="inline-flex min-h-6 items-center text-[13px] font-bold text-brand-500">
              {t('viewAll')}
            </Link>
          </div>
          <ul>
            {recent.map((row) => (
              <li key={row.slug} className="border-b border-ink-100 last:border-b-0">
                <Link
                  href={`/procedures/${row.slug}`}
                  className="block py-3.5 text-ink-950 hover:text-brand-500"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] leading-snug font-bold">{row.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-ink-400 tabular" dir="ltr">
                      {row.date}
                    </span>
                  </span>
                  {row.office ? (
                    <span className="mt-1 block text-xs font-semibold text-ink-500">
                      {row.office}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="py-9 lg:ps-9">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink-950">{t('faq')}</h2>
            <Link href="/faq" className="inline-flex min-h-6 items-center text-[13px] font-bold text-brand-500">
              {t('allFaq')}
            </Link>
          </div>
          <ul>
            {faq.map((row) => (
              <li key={row.id} className="border-b border-ink-100 last:border-b-0">
                <Link
                  href="/faq"
                  className="flex items-center justify-between gap-3 py-3.5 text-[15px] font-bold text-ink-950 hover:text-brand-500"
                >
                  {row.question}
                  <Icon name="arrow" className="size-4 shrink-0 text-ink-300 rtl:-scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── contribute / contact CTA ─────────────────────────────────────────── */

export async function CtaSection() {
  const t = await getTranslations('home');
  return (
    <section className="relative overflow-hidden bg-brand-500 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 end-16 select-none text-[200px] leading-[0.8] font-extrabold text-white/10"
      >
        إ
      </div>
      <Container width="wide" className="relative py-11">
        <Reveal className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('ctaTitle')}</h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-white/85">{t('ctaBody')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="bg-gold-400 px-6 py-3.5 text-[15px] font-bold text-ink-950 hover:bg-white hover:text-brand-500"
            >
              {t('ctaPrimary')}
            </Link>
            <Link
              href="/faq"
              className="border border-white/55 px-6 py-3.5 text-[15px] font-bold text-white hover:bg-white/10"
            >
              {t('ctaSecondary')}
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
