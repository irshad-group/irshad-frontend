import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localized } from '@/lib/i18n';
import { fileUrl, listAllPublic, listPublic } from '@/lib/pb/queries/public';
import { countByField, proceduresPerMinistry, stepDots } from '@/lib/public/home';
import { projectPoint } from '@/lib/public/geo';
import { formatFee } from '@/lib/public/procedures';
import type { DirectoratesRecord, TagsRecord } from '@/types/pb';
import type { MapDot } from '@/components/public/home/IraqMap';
import type { CityMarker } from '@/components/public/home/InteractiveMap';
import { tagIcon } from '@/components/public/home/icons';
import {
  AnatomySection,
  CtaSection,
  Hero,
  MapSection,
  MinistriesSection,
  PopularSection,
  RecentAndFaq,
  StatsStrip,
  TopicsSection,
  type BranchCard,
  type MinistryCell,
  type PopularCard,
  type ProvinceChip,
  type RecentRow,
  type Stat,
  type TopicCell,
} from '@/components/public/home/sections';

// See PUBLIC_REVALIDATE — segment config must be a literal.
export const revalidate = 3600;

/**
 * Home, to the "Irshad Homepage v2" design.
 *
 * Search leads because most visitors arrive knowing roughly what they need;
 * every section below it is an alternative way in for those who do not —
 * by weight (most requested), by topic, by ministry, by place. All of it is
 * real data through the anonymous public client; the one illustrative block
 * is the procedure-page anatomy, which is UI chrome from the message
 * catalogue, not content.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tProcedure = await getTranslations('procedure');

  const [featured, recent, procsLight, dirsLight, ministries, provinces, branches, tags, faq] =
    await Promise.all([
      listPublic('procedures', {
        filter: 'featured = true',
        expand: 'directorate,tags',
        perPage: 6,
      }),
      listPublic('procedures', { sort: '-updated', expand: 'directorate', perPage: 5 }),
      listAllPublic('procedures', { fields: 'id,directorate,tags' }),
      listAllPublic('directorates', { fields: 'id,ministry' }),
      listAllPublic('ministries', { sort: 'sort_order' }),
      listAllPublic('provinces', { sort: 'sort_order' }),
      listAllPublic('directorate_branches', { expand: 'directorate,province', sort: 'sort_order' }),
      listAllPublic('tags'),
      listPublic('faq', { sort: 'sort_order', perPage: 5 }),
    ]);

  const stepCounts =
    featured.items.length > 0
      ? countByField(
          await listAllPublic('procedure_items', {
            filter: featured.items.map((p) => `procedure = ${JSON.stringify(p.id)}`).join(' || '),
            fields: 'id,procedure',
          }),
          'procedure',
        )
      : new Map<string, number>();

  const popular: PopularCard[] = featured.items.map((procedure) => {
    const directorate = procedure.expand?.directorate as DirectoratesRecord | undefined;
    const firstTag = (procedure.expand?.tags as TagsRecord[] | undefined)?.[0];
    const steps = stepCounts.get(procedure.id) ?? 0;
    const fee = formatFee(procedure.fee_iqd, locale);
    return {
      slug: procedure.slug,
      title: localized(procedure, 'title', locale),
      office: directorate ? localized(directorate, 'title', locale) : '',
      icon: firstTag ? tagIcon(firstTag.slug) : ('doc' as const),
      badge: firstTag ? localized(firstTag, 'name', locale) : null,
      stepsLabel: t('stepsCount', { count: steps }),
      dots: stepDots(steps),
      time: localized(procedure, 'processing_time', locale) || null,
      fee: fee ?? tProcedure('free'),
    };
  });

  const stats: Stat[] = [
    { icon: 'doc', value: procsLight.length, label: t('statProcedures') },
    { icon: 'shield', value: ministries.length, label: t('statMinistries') },
    { icon: 'pin', value: provinces.length, label: t('statProvinces') },
    { icon: 'users', value: dirsLight.length, label: t('statDirectorates') },
  ];

  const tagCounts = countByField(
    procsLight.flatMap((p) => (p.tags ?? []).map((tag) => ({ tag }))),
    'tag',
  );
  const topics: TopicCell[] = tags
    .filter((tag) => (tagCounts.get(tag.id) ?? 0) > 0)
    .sort((a, b) => (tagCounts.get(b.id) ?? 0) - (tagCounts.get(a.id) ?? 0))
    .slice(0, 8)
    .map((tag) => ({
      slug: tag.slug,
      title: localized(tag, 'name', locale),
      countLabel: t('countProcedures', { count: tagCounts.get(tag.id) ?? 0 }),
    }));

  const ministryCounts = proceduresPerMinistry(procsLight, dirsLight);
  const ministryCells: MinistryCell[] = [...ministries]
    .sort((a, b) => (ministryCounts.get(b.id) ?? 0) - (ministryCounts.get(a.id) ?? 0))
    .slice(0, 8)
    .map((ministry) => ({
      slug: ministry.slug,
      title: localized(ministry, 'title', locale),
      logoUrl: fileUrl(ministry, ministry.logo, { thumb: '120x120' }),
      countLabel: t('countProcedures', { count: ministryCounts.get(ministry.id) ?? 0 }),
    }));

  const branchesPerProvince = countByField(branches, 'province');
  const provincesWithOffices = provinces.filter((p) => (branchesPerProvince.get(p.id) ?? 0) > 0);
  const bigProvinces = new Set(
    [...provincesWithOffices]
      .sort((a, b) => (branchesPerProvince.get(b.id) ?? 0) - (branchesPerProvince.get(a.id) ?? 0))
      .slice(0, 4)
      .map((p) => p.id),
  );
  const dots: MapDot[] = provincesWithOffices.flatMap((province) => {
    const point = projectPoint(province.gps_lat, province.gps_lon);
    if (!point) return [];
    return [
      {
        ...point,
        label: localized(province, 'name', locale),
        count: branchesPerProvince.get(province.id) ?? 0,
        big: bigProvinces.has(province.id),
      },
    ];
  });
  const provinceChips: ProvinceChip[] = provincesWithOffices.map((province) => ({
    id: province.id,
    name: localized(province, 'name', locale),
    count: branchesPerProvince.get(province.id) ?? 0,
  }));

  const markers: CityMarker[] = provincesWithOffices.flatMap((province) => {
    const { gps_lat, gps_lon } = province;
    if (typeof gps_lat !== 'number' || typeof gps_lon !== 'number') return [];
    return [
      {
        lat: gps_lat,
        lon: gps_lon,
        label: localized(province, 'name', locale),
        count: branchesPerProvince.get(province.id) ?? 0,
        href: `/${locale}/directorates?province=${encodeURIComponent(province.id)}`,
        big: bigProvinces.has(province.id),
      },
    ];
  });

  const branchCards: BranchCard[] = branches.slice(0, 4).map((branch) => {
    const directorate = branch.expand?.directorate as DirectoratesRecord | undefined;
    const province = branch.expand?.province as
      | { name_en?: string; name_ar?: string; name_ku?: string }
      | undefined;
    return {
      id: branch.id,
      title: localized(branch, 'title', locale),
      address: localized(branch, 'address', locale) || null,
      href: directorate ? `/directorates/${directorate.slug}` : '/directorates',
      provinceName: province ? localized(province, 'name', locale) : null,
    };
  });

  const recentRows: RecentRow[] = recent.items.map((procedure) => {
    const directorate = procedure.expand?.directorate as DirectoratesRecord | undefined;
    return {
      slug: procedure.slug,
      title: localized(procedure, 'title', locale),
      date: procedure.updated.slice(0, 10),
      office: directorate ? localized(directorate, 'title', locale) : null,
    };
  });

  const faqRows = faq.items.map((entry) => ({
    id: entry.id,
    question: localized(entry, 'question', locale),
  }));

  return (
    <>
      <Hero locale={locale} />
      <StatsStrip stats={stats} />
      <PopularSection cards={popular} />
      <TopicsSection topics={topics} />
      <AnatomySection />
      <MinistriesSection ministries={ministryCells} />
      <MapSection
        dots={dots}
        markers={markers}
        dir={locale === 'en' ? 'ltr' : 'rtl'}
        provinces={provinceChips}
        branches={branchCards}
      />
      <RecentAndFaq recent={recentRows} faq={faqRows} />
      <CtaSection />
    </>
  );
}
