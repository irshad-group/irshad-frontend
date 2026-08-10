'use client';

import { useEffect } from 'react';

/**
 * Last resort: the locale layout itself failed, so the translation provider
 * never mounted and there is no way to know which language the visitor reads.
 *
 * Rather than guessing — which for this audience means guessing wrong two times
 * in three — it says the same thing in all three languages. Each block carries
 * its own `lang` and `dir` so a screen reader announces each in the right voice.
 *
 * This replaces the root layout entirely, so it must render `<html>` and
 * `<body>` itself, and it cannot rely on the stylesheet or the self-hosted
 * font having loaded. Everything here is inline and self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root layout failed:', error);
  }, [error]);

  const messages = [
    { lang: 'en', dir: 'ltr' as const, title: 'Something went wrong', body: 'The site could not be loaded. Please try again in a moment.', retry: 'Try again' },
    { lang: 'ar', dir: 'rtl' as const, title: 'حدث خطأ ما', body: 'تعذر تحميل الموقع. يرجى المحاولة بعد قليل.', retry: 'إعادة المحاولة' },
    { lang: 'ku', dir: 'rtl' as const, title: 'هەڵەیەک ڕوویدا', body: 'ماڵپەڕەکە بار نەکرا. تکایە دوای کەمێک دووبارە هەوڵ بدەرەوە.', retry: 'دووبارە هەوڵ بدەرەوە' },
  ];

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '3rem 1.5rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#f6f7f9',
          color: '#252b38',
          lineHeight: 1.6,
        }}
      >
        <main style={{ maxWidth: '32rem', margin: '0 auto' }}>
          {messages.map((message, index) => (
            <section
              key={message.lang}
              lang={message.lang}
              dir={message.dir}
              style={{
                paddingBlock: '1.5rem',
                borderBlockStart: index === 0 ? 'none' : '1px solid #d7dbe3',
              }}
            >
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{message.title}</h1>
              <p style={{ marginBlock: '0.5rem 1rem', color: '#4d5566' }}>{message.body}</p>
              <button
                type="button"
                onClick={reset}
                style={{
                  font: 'inherit',
                  cursor: 'pointer',
                  border: 0,
                  borderRadius: '0.375rem',
                  background: '#1b5e4b',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                }}
              >
                {message.retry}
              </button>
            </section>
          ))}

          {error.digest ? (
            <p style={{ marginBlockStart: '2rem', fontSize: '0.75rem', color: '#8892a6' }}>
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
