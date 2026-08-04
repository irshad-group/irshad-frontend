/**
 * End-to-end smoke test for the public shell.
 *
 * Drives a real browser so the things unit tests cannot reach are actually
 * exercised: the navigation tree rendered from live PocketBase content, text
 * direction, the native disclosures, the skip link, and the layout at the
 * smallest viewport the portal supports.
 *
 *   BASE_URL=http://localhost:3000 node e2e/public.mjs
 *
 * Read-only: the public portal writes nothing except the contact form, which
 * this suite does not touch. Safe against any instance.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

let passed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** Locale, expected direction, and the shell strings that must come from PocketBase. */
const LOCALES = [
  { locale: 'en', dir: 'ltr', menuLabel: 'Menu', skip: 'Skip to content', firstItem: 'Home' },
  { locale: 'ar', dir: 'rtl', menuLabel: 'القائمة', skip: 'تخطي إلى المحتوى', firstItem: 'الرئيسية' },
  { locale: 'ku', dir: 'rtl', menuLabel: 'پێڕست', skip: 'بازدان بۆ ناوەڕۆک', firstItem: 'سەرەکی' },
];

const browser = await chromium.launch();

try {
  for (const { locale, dir, menuLabel, skip, firstItem } of LOCALES) {
    console.log(`\n== /${locale} ==`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded' });

    check(
      `${locale}: html lang and dir`,
      (await page.getAttribute('html', 'lang')) === locale &&
        (await page.getAttribute('html', 'dir')) === dir,
    );

    // Skip link first, on an untouched page: "first tab stop" is only
    // meaningful before anything else has taken focus.
    const skipLink = page.locator('a.skip-link');
    check(`${locale}: skip link text`, (await skipLink.innerText()).trim() === skip);
    const beforeTop = await skipLink.evaluate((el) => el.getBoundingClientRect().top);
    await page.keyboard.press('Tab');
    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    check(`${locale}: skip link is the first tab stop`, focusedText === skip, `got "${focusedText}"`);
    // The link slides in over 150ms, so the rect must be read after the
    // transition rather than in the same tick as the key press.
    await page
      .waitForFunction(
        () => (document.querySelector('a.skip-link')?.getBoundingClientRect().top ?? -1) >= 0,
        null,
        { timeout: 2000 },
      )
      .catch(() => {});
    const afterTop = await skipLink.evaluate((el) => el.getBoundingClientRect().top);
    check(
      `${locale}: skip link is offscreen until focused`,
      beforeTop < 0 && afterTop >= 0,
      `before ${beforeTop}, after ${afterTop}`,
    );
    check(`${locale}: skip link targets the main landmark`, (await page.locator('main#main').count()) === 1);

    const menu = page.locator(`header nav[aria-label="${menuLabel}"]`).first();
    const roots = menu.locator(':scope > ul > li');
    check(`${locale}: menu renders from PocketBase`, (await roots.count()) === 6);
    check(
      `${locale}: first menu item is translated`,
      (await roots.first().innerText()).trim().startsWith(firstItem),
    );

    // Two menu entries have children in the seeded navigation.
    const disclosures = menu.locator('details');
    check(`${locale}: two submenus`, (await disclosures.count()) === 2);

    const firstDisclosure = disclosures.first();
    check(`${locale}: submenu starts closed`, !(await firstDisclosure.evaluate((d) => d.open)));
    await firstDisclosure.locator('summary').click();
    check(`${locale}: submenu opens on click`, await firstDisclosure.evaluate((d) => d.open));
    check(
      `${locale}: submenu links carry the locale prefix`,
      (await firstDisclosure.locator('ul a').first().getAttribute('href'))?.startsWith(`/${locale}/`),
    );
    await firstDisclosure.locator('summary').click();

    // The leading edge must follow the writing direction.
    const box = await skipLink.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { left: cs.left, right: cs.right };
    });
    check(
      `${locale}: skip link sits on the leading edge`,
      dir === 'rtl' ? box.right === '8px' : box.left === '8px',
      JSON.stringify(box),
    );

    // Footer, driven by `settings`.
    check(
      `${locale}: footer contact email from settings`,
      (await page.locator('footer a[href^="mailto:"]').innerText()) === 'info@irshad.gov.iq',
    );
    check(
      `${locale}: phone renders left-to-right even in RTL`,
      (await page.locator('footer a[href^="tel:"]').getAttribute('dir')) === 'ltr',
    );
    check(`${locale}: social links`, (await page.locator('footer a[target="_blank"]').count()) === 3);

    // Smallest supported viewport.
    await page.setViewportSize({ width: 320, height: 720 });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    check(
      `${locale}: no horizontal overflow at 320px`,
      overflow.scrollWidth <= overflow.inner,
      JSON.stringify(overflow),
    );

    const drawer = page.locator('header details').last();
    check(`${locale}: drawer is reachable on mobile`, await drawer.isVisible());
    await drawer.locator('summary').click();
    check(`${locale}: drawer lists its entries`, (await drawer.locator('nav a').count()) === 7);

    await context.close();
  }

  // The shell must survive with JavaScript switched off.
  console.log('\n== JavaScript disabled ==');
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const page = await noJs.newPage();
  await page.goto(`${BASE}/ar`, { waitUntil: 'domcontentloaded' });
  check('no-js: menu still renders', (await page.locator('header nav ul > li').count()) > 0);
  check('no-js: skip link present', (await page.locator('a.skip-link').count()) === 1);
  check('no-js: footer still renders', (await page.locator('footer a[href^="mailto:"]').count()) === 1);
  const details = page.locator('header details').first();
  await details.locator('summary').click();
  check('no-js: native disclosure still opens', await details.evaluate((d) => d.open));
  check(
    'no-js: language switcher links are real anchors',
    (await page.locator('nav[aria-label] a[hreflang]').count()) === 3,
  );
  await noJs.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}
