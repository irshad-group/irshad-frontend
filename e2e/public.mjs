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

  // The journey the site exists for: search -> procedure -> forms.
  for (const { locale, dir } of LOCALES) {
    console.log(`\n== /${locale} search -> procedure ==`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded' });
    check(`${locale}: home shows procedure cards`, (await page.locator('main ul li a').count()) > 0);

    // Search by an English term while reading in any language: matching runs
    // across all three languages' fields, not just the active one.
    await page.fill('input[name="q"]', 'passport');
    await page.locator('form[role="search"] button[type="submit"]').first().click();
    await page.waitForURL(/\/search\?/);
    check(`${locale}: search lands on a shareable URL`, page.url().includes('q=passport'));

    const results = page.locator('main ul li a[href*="/procedures/"]');
    check(`${locale}: search returns results`, (await results.count()) > 0);

    await results.first().click();
    await page.waitForURL(/\/procedures\//);

    check(`${locale}: procedure has one h1`, (await page.locator('main h1').count()) === 1);
    const steps = page.locator('main ol > li');
    check(`${locale}: steps render in order`, (await steps.count()) > 0);
    check(
      `${locale}: fee is shown in Latin digits`,
      /[0-9]/.test(await page.locator('main dl').first().innerText()),
    );
    check(
      `${locale}: responsible directorate is linked`,
      (await page.locator('main dl a[href*="/directorates/"]').count()) === 1,
    );
    check(
      `${locale}: attached forms link to PocketBase or elsewhere`,
      (await page.locator('main a[href*="/api/files/"], main a[target="_blank"]').count()) > 0,
    );
    check(`${locale}: page keeps its direction`, (await page.getAttribute('html', 'dir')) === dir);

    // An unpublished or missing procedure must not be distinguishable.
    const missing = await page.goto(`${BASE}/${locale}/procedures/no-such-procedure`, {
      waitUntil: 'domcontentloaded',
    });
    check(`${locale}: unknown procedure returns 404`, missing?.status() === 404);

    // A search that matches nothing must offer a way onward.
    await page.goto(`${BASE}/${locale}/search?q=zzzzqqqq`, { waitUntil: 'domcontentloaded' });
    check(
      `${locale}: empty search offers a route onward`,
      (await page.locator('main a[href*="/procedures"]').count()) > 0,
    );

    // Tag filtering is links, so each filtered view has its own URL.
    await page.goto(`${BASE}/${locale}/procedures`, { waitUntil: 'domcontentloaded' });
    const tagLink = page.locator('nav a[href*="tag="]').first();
    await tagLink.click();
    await page.waitForURL(/tag=/);
    check(`${locale}: tag filter has its own URL`, page.url().includes('tag='));
    check(
      `${locale}: tag filter marks the active tag`,
      (await page.locator('nav a[aria-current="true"]').count()) >= 1,
    );

    await page.setViewportSize({ width: 320, height: 720 });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    check(
      `${locale}: procedures list has no overflow at 320px`,
      overflow.scrollWidth <= overflow.inner,
      JSON.stringify(overflow),
    );

    await context.close();
  }

  // Institutions and places.
  for (const { locale } of LOCALES) {
    console.log(`\n== /${locale} institutions ==`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await page.goto(`${BASE}/${locale}/ministries`, { waitUntil: 'domcontentloaded' });
    const ministryLinks = page.locator('main ul li a[href*="/ministries/"]');
    check(`${locale}: ministries index lists bodies`, (await ministryLinks.count()) === 14);

    // The KRG filter is what the seeded header menu links to.
    await page.goto(`${BASE}/${locale}/ministries?krg=true`, { waitUntil: 'domcontentloaded' });
    const krgCount = await page.locator('main ul li a[href*="/ministries/"]').count();
    await page.goto(`${BASE}/${locale}/ministries?krg=false`, { waitUntil: 'domcontentloaded' });
    const federalCount = await page.locator('main ul li a[href*="/ministries/"]').count();
    check(
      `${locale}: krg filter splits the list`,
      krgCount > 0 && federalCount > 0 && krgCount + federalCount === 14,
      `krg ${krgCount} + federal ${federalCount}`,
    );

    // A mangled filter must degrade to the full list, not to nothing.
    await page.goto(`${BASE}/${locale}/ministries?krg=banana`, { waitUntil: 'domcontentloaded' });
    check(
      `${locale}: unknown filter value shows everything`,
      (await page.locator('main ul li a[href*="/ministries/"]').count()) === 14,
    );

    await page.goto(`${BASE}/${locale}/ministries`, { waitUntil: 'domcontentloaded' });
    await ministryLinks.first().click();
    await page.waitForURL(/\/ministries\//);
    check(`${locale}: ministry page has one h1`, (await page.locator('main h1').count()) === 1);
    const directorateLinks = page.locator('main a[href*="/directorates/"]');
    check(`${locale}: ministry lists its directorates`, (await directorateLinks.count()) > 0);

    await directorateLinks.first().click();
    await page.waitForURL(/\/directorates\//);
    check(
      `${locale}: directorate links back to its ministry`,
      (await page.locator('main a[href*="/ministries/"]').count()) >= 1,
    );
    check(
      `${locale}: directorate lists the procedures it handles`,
      (await page.locator('main a[href*="/procedures/"]').count()) > 0,
    );

    // Locations are links to the visitor's own maps app, never an embed.
    check(`${locale}: no third-party map iframe`, (await page.locator('iframe').count()) === 0);
    const mapLinks = page.locator('main a[href*="openstreetmap.org"]');
    check(`${locale}: locations offer an open-in-maps link`, (await mapLinks.count()) > 0);
    check(
      `${locale}: map links open safely in a new tab`,
      (await mapLinks.first().getAttribute('rel'))?.includes('noopener'),
    );

    // Province filtering on the directorates index.
    await page.goto(`${BASE}/${locale}/directorates`, { waitUntil: 'domcontentloaded' });
    const allDirectorates = await page.locator('main ul li a[href*="/directorates/"]').count();
    check(`${locale}: directorates index lists offices`, allDirectorates === 18);
    const provinceLink = page.locator('nav a[href*="province="]').first();
    await provinceLink.click();
    await page.waitForURL(/province=/);
    const filtered = await page.locator('main ul li a[href*="/directorates/"]').count();
    check(
      `${locale}: province filter narrows the list`,
      filtered < allDirectorates,
      `${filtered} of ${allDirectorates}`,
    );
    check(
      `${locale}: province filter marks the active province`,
      (await page.locator('nav a[aria-current="true"]').count()) >= 1,
    );

    check(
      `${locale}: unknown ministry returns 404`,
      (await page.goto(`${BASE}/${locale}/ministries/no-such-ministry`, { waitUntil: 'domcontentloaded' }))?.status() === 404,
    );

    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`${BASE}/${locale}/directorates`, { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    check(
      `${locale}: directorates index has no overflow at 320px`,
      overflow.scrollWidth <= overflow.inner,
      JSON.stringify(overflow),
    );

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

  // Search is a plain GET form, so it must work with no script at all.
  await page.goto(`${BASE}/ar`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="q"]', 'passport');
  await page.locator('form[role="search"] button[type="submit"]').first().press('Enter');
  await page.waitForURL(/\/search\?/);
  check('no-js: search submits and returns results', page.url().includes('q=passport'));
  check(
    'no-js: results are server-rendered',
    (await page.locator('main a[href*="/procedures/"]').count()) > 0,
  );

  // And a procedure page must be fully readable without script.
  await page.goto(`${BASE}/ar/procedures/renew-iraqi-passport`, { waitUntil: 'domcontentloaded' });
  check('no-js: procedure steps render', (await page.locator('main ol > li').count()) > 0);
  check('no-js: forms are listed', (await page.locator('main a[href*="/api/files/"]').count()) > 0);

  await noJs.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}
