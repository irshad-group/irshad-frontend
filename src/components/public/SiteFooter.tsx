import { Container } from '@/components/ui/primitives';
import type { SettingsLookup } from '@/lib/public/settings';
import { settingValue } from '@/lib/public/settings';

/**
 * The public footer, driven entirely by the `settings` collection.
 *
 * Nothing here is hardcoded: staff change a phone number or an opening-hours
 * line in the admin and it appears, with no deployment. Every field is
 * therefore optional — a key may be absent or emptied — so each block renders
 * only when it has something to say.
 *
 * Contact details are `no_trans` settings, so they read from the canonical
 * column rather than through the translation fallback. Phone numbers and email
 * addresses are the same in every language.
 */
export default function SiteFooter({
  settings,
  locale,
  labels,
}: {
  settings: SettingsLookup;
  locale: string;
  labels: { contact: string; follow: string };
}) {
  const value = (key: string) => settingValue(settings, key, locale);

  const email = value('contact_email');
  const phone = value('contact_phone');
  const hours = value('support_hours');
  const address = value('office_address');
  const note = value('footer_note');
  const tagline = value('site_tagline');

  const socials = (
    [
      ['facebook_url', 'Facebook'],
      ['x_url', 'X'],
      ['youtube_url', 'YouTube'],
    ] as const
  )
    .map(([key, name]) => ({ name, url: value(key) }))
    .filter((social) => social.url);

  return (
    <footer className="mt-16 border-t border-ink-200/70 bg-white">
      <Container className="py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-ink-900">{value('site_name')}</p>
            {tagline ? <p className="mt-1 text-sm text-ink-500">{tagline}</p> : null}
          </div>

          {email || phone || hours || address ? (
            <div>
              <h2 className="text-sm font-semibold text-ink-900">{labels.contact}</h2>
              <ul className="mt-2 space-y-1 text-sm text-ink-600">
                {email ? (
                  <li>
                    <a className="hover:text-brand-700" href={`mailto:${email}`} dir="ltr">
                      {email}
                    </a>
                  </li>
                ) : null}
                {phone ? (
                  <li>
                    {/* `dir="ltr"` keeps a +964 number from being reordered in RTL. */}
                    <a className="hover:text-brand-700" href={`tel:${phone.replace(/\s+/g, '')}`} dir="ltr">
                      {phone}
                    </a>
                  </li>
                ) : null}
                {hours ? <li>{hours}</li> : null}
                {address ? <li>{address}</li> : null}
              </ul>
            </div>
          ) : null}

          {socials.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-ink-900">{labels.follow}</h2>
              <ul className="mt-2 space-y-1 text-sm text-ink-600">
                {socials.map((social) => (
                  <li key={social.name}>
                    <a
                      className="hover:text-brand-700"
                      href={social.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {social.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {note ? (
          <p className="mt-8 max-w-[var(--measure-prose)] border-t border-ink-200/70 pt-6 text-sm text-ink-500">
            {note}
          </p>
        ) : null}
      </Container>
    </footer>
  );
}
