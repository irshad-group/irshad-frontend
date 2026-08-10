import { getTranslations, setRequestLocale } from 'next-intl/server';
import { listAllPublic } from '@/lib/pb/queries/public';
import { settingsMap, settingValue } from '@/lib/public/settings';
import { Container } from '@/components/ui/primitives';
import ContactForm from '@/components/public/ContactForm';

export const revalidate = 3600;

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const settings = settingsMap(await listAllPublic('settings'));
  const email = settingValue(settings, 'contact_email', locale);
  const phone = settingValue(settings, 'contact_phone', locale);
  const hours = settingValue(settings, 'support_hours', locale);
  const address = settingValue(settings, 'office_address', locale);

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-semibold text-ink-900">{t('contact.title')}</h1>
      <p className="mt-2 max-w-[var(--measure-prose)] text-ink-600">{t('contact.intro')}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContactForm
            labels={{
              firstName: t('contact.firstName'),
              lastName: t('contact.lastName'),
              email: t('contact.email'),
              phone: t('contact.phone'),
              phoneOptional: t('common.optional'),
              message: t('contact.message'),
              submit: t('contact.submit'),
              sending: t('contact.sending'),
              sent: t('contact.sent'),
              failed: t('contact.failed'),
              errors: {
                tooShort: t('contact.errors.tooShort'),
                tooLong: t('contact.errors.tooLong'),
                invalidEmail: t('contact.errors.invalidEmail'),
                invalid: t('contact.errors.invalid'),
              },
            }}
          />
        </div>

        {/* The same details as the footer, from `settings`. Some people will
            rather phone than fill in a form, and should not have to hunt. */}
        <aside className="space-y-4 text-sm">
          <h2 className="font-semibold text-ink-900">{t('contact.otherWays')}</h2>
          <ul className="space-y-2 text-ink-600">
            {email ? (
              <li>
                <a dir="ltr" className="hover:text-brand-700" href={`mailto:${email}`}>
                  {email}
                </a>
              </li>
            ) : null}
            {phone ? (
              <li>
                <a dir="ltr" className="hover:text-brand-700" href={`tel:${phone.replace(/\s+/g, '')}`}>
                  {phone}
                </a>
              </li>
            ) : null}
            {hours ? <li>{hours}</li> : null}
            {address ? <li>{address}</li> : null}
          </ul>
        </aside>
      </div>
    </Container>
  );
}
