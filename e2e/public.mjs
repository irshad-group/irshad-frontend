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

/**
 * Locale, expected direction, and the shell strings that must come from
 * PocketBase.
 *
 * `nativeTerm` is a word that appears in the *displayed* procedure title for
 * that language. The highlight only marks text the reader can see, so an
 * English term while reading Kurdish correctly highlights nothing — the record
 * matched on `title_en`, which is not what is on screen.
 */
const LOCALES = [
  { locale: 'en', dir: 'ltr', menuLabel: 'Menu', skip: 'Skip to content', firstItem: 'Home', nativeTerm: 'passp' },
  { locale: 'ar', dir: 'rtl', menuLabel: 'القائمة', skip: 'تخطي إلى المحتوى', firstItem: 'الرئيسية', nativeTerm: 'جواز' },
  { locale: 'ku', dir: 'rtl', menuLabel: 'پێڕست', skip: 'بازدان بۆ ناوەڕۆک', firstItem: 'سەرەکی', nativeTerm: 'پاسپۆرت' },
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

    // Footer, driven by `settings`. Both of these are optional: the site publishes a
    // contact address and phone only if someone has set them, and pinning the test to
    // the development seed's invented values meant clearing those values — which was
    // the right thing to do, they were fabricated — turned the suite red. Assert the
    // behaviour where the setting exists instead of asserting that it exists.
    const mailLink = page.locator('footer a[href^="mailto:"]');
    if (await mailLink.count()) {
      const href = await mailLink.first().getAttribute('href');
      check(
        `${locale}: footer email is a usable mailto link`,
        href?.startsWith('mailto:') && href.includes('@'),
        href ?? '',
      );
    } else {
      console.log(`  SKIP  ${locale}: no contact email published`);
    }
    const telLink = page.locator('footer a[href^="tel:"]');
    if (await telLink.count()) {
      check(
        `${locale}: phone renders left-to-right even in RTL`,
        (await telLink.first().getAttribute('dir')) === 'ltr',
      );
    } else {
      console.log(`  SKIP  ${locale}: no contact phone published`);
    }
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

    // The brand survived the squeeze. Absence of overflow is not enough on its
    // own: the header used to stay exactly 320px wide while the controls beside
    // the brand took 270 of it, leaving the link 6px and letting its 36px mark
    // spill out over the language switcher. Compare the mark against its own
    // link box rather than against the viewport, which is what hid this.
    const brand = await page.evaluate(() => {
      const link = document.querySelector('header a:has(span[aria-hidden])');
      const mark = link?.querySelector('span[aria-hidden]');
      if (!link || !mark) return null;
      const l = link.getBoundingClientRect();
      const m = mark.getBoundingClientRect();
      return { linkWidth: l.width, markWidth: m.width, spillsLeft: m.left < l.left - 1, spillsRight: m.right > l.right + 1 };
    });
    check(`${locale}: the brand mark is present at 320px`, (brand?.markWidth ?? 0) > 0);
    check(
      `${locale}: the brand mark is not clipped by its own link`,
      brand !== null && !brand.spillsLeft && !brand.spillsRight && brand.linkWidth >= brand.markWidth,
      JSON.stringify(brand),
    );

    // Every control a thumb can reach clears the WCAG 2.2 AA target floor of
    // 24x24 (2.5.8). `checkVisibility` is what makes this reliable: a closed
    // <details> still reports a layout rect for its contents, so the drawer's
    // own links would otherwise be measured while hidden.
    const smallTargets = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('header a[href], header button, header summary')) {
        if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 24) {
          out.push({ text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20), w: Math.round(r.width), h: Math.round(r.height) });
        }
      }
      return out;
    });
    check(
      `${locale}: every header control clears 24x24 at 320px`,
      smallTargets.length === 0,
      JSON.stringify(smallTargets),
    );

    const drawer = page.locator('header details').last();
    check(`${locale}: drawer is reachable on mobile`, await drawer.isVisible());
    await drawer.locator('summary').click();
    check(`${locale}: drawer lists its entries`, (await drawer.locator('nav a').count()) === 7);

    await context.close();
  }

  // The journey the site exists for: search -> procedure -> forms.
  for (const { locale, dir, nativeTerm } of LOCALES) {
    console.log(`\n== /${locale} search -> procedure ==`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await page.goto(`${BASE}/${locale}`, { waitUntil: 'domcontentloaded' });
    check(`${locale}: home shows procedure cards`, (await page.locator('main ul li a').count()) > 0);

    // Live suggestions. These are an enhancement on top of the plain GET form,
    // which the no-script block at the end of this file proves still works —
    // so every assertion here is about what script *adds*, never about the
    // only route to a result.
    await page.setViewportSize({ width: 1280, height: 900 });
    const searchBox = page.locator('input[name="q"]').first();
    await searchBox.click();
    await searchBox.fill('passp');
    const listbox = page.locator('[role="listbox"]');
    await listbox.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const options = listbox.locator('[role="option"]');
    // 'passp' is English in every locale, so this also proves the
    // cross-language match: an Arabic reader typing an English word still
    // finds the record, because the filter covers all three languages.
    check(`${locale}: typing offers suggestions`, (await options.count()) > 0);

    await searchBox.fill(nativeTerm);
    // Wait for the highlight rather than for a fixed 700ms. The suggestions come from
    // PocketBase over the network, so a fixed sleep passes on a quiet machine and fails
    // on a busy one — this assertion failed once in three runs before the change.
    await listbox.locator('mark').first()
      .waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    check(
      `${locale}: the suggestion highlights what was typed`,
      (await listbox.locator('mark').count()) > 0,
    );
    check(
      `${locale}: suggestions are 44px touch targets`,
      ((await options.first().boundingBox())?.height ?? 0) >= 44,
    );
    check(
      `${locale}: the combobox reports itself expanded`,
      (await searchBox.getAttribute('aria-expanded')) === 'true',
    );

    // Arrow keys move the active option, which is what a screen reader follows.
    await searchBox.press('ArrowDown');
    // Resolved in the page: the id is generated by React's useId and contains
    // characters that need CSS.escape, which only exists in a browser.
    const activeDescendant = await page.evaluate(() => {
      const input = document.querySelector('input[name="q"]');
      const id = input?.getAttribute('aria-activedescendant');
      if (!id) return { id: null, pointsAtSelectedOption: false };
      const target = document.getElementById(id);
      return {
        id,
        pointsAtSelectedOption:
          target?.getAttribute('role') === 'option' &&
          target.getAttribute('aria-selected') === 'true',
      };
    });
    check(
      `${locale}: arrow keys move the active suggestion`,
      activeDescendant.pointsAtSelectedOption,
      JSON.stringify(activeDescendant),
    );

    await searchBox.press('Escape');
    check(`${locale}: escape dismisses the suggestions`, (await listbox.count()) === 0);

    // A term that matches nothing says so rather than showing an empty box.
    await searchBox.fill('zzzqqq');
    await page.waitForTimeout(700);
    check(
      `${locale}: a hopeless term reports no matches`,
      (await listbox.count()) === 1 && (await options.count()) === 0,
    );

    // One character is below the threshold — no request, no list.
    await searchBox.fill('p');
    await page.waitForTimeout(500);
    check(`${locale}: one character offers nothing`, (await listbox.count()) === 0);
    await searchBox.fill('');

    // Search by an English term while reading in any language: matching runs
    // across all three languages' fields, not just the active one.
    await page.fill('input[name="q"]', 'passport');
    await page.locator('form[role="search"] button[type="submit"]').first().click();
    await page.waitForURL(/\/search\?/);
    check(`${locale}: search lands on a shareable URL`, page.url().includes('q=passport'));

    const results = page.locator('main ul li a[href*="/procedures/"]');
    check(`${locale}: search returns results`, (await results.count()) > 0);

    // The results page carries the same suggestions as the hero, on top of the
    // same plain GET form. Two things matter here that do not on the home page:
    // the box is seeded with the query so it can be refined rather than
    // retyped, and the list stays shut on arrival — a dropdown covering the
    // results the reader just asked for would be worse than no dropdown.
    const resultsBox = page.locator('input[name="q"]').first();
    check(
      `${locale}: the results box is seeded with the query`,
      (await resultsBox.inputValue()) === 'passport',
    );
    check(
      `${locale}: suggestions stay shut on arrival`,
      (await page.locator('[role="listbox"]').count()) === 0,
    );

    await resultsBox.click();
    await resultsBox.fill(nativeTerm);
    const resultsList = page.locator('[role="listbox"]');
    await resultsList.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    check(
      `${locale}: the results box suggests as you type`,
      (await resultsList.locator('[role="option"]').count()) > 0,
    );
    check(
      `${locale}: results-page suggestions align with their own box`,
      await page.evaluate(() => {
        const list = document.querySelector('[role="listbox"]')?.getBoundingClientRect();
        const form = document.querySelector('form[role="search"]')?.getBoundingClientRect();
        return !!list && !!form && Math.abs(list.left - form.left) < 2 && Math.abs(list.right - form.right) < 2;
      }),
    );
    await resultsBox.press('Escape');
    await resultsBox.fill('passport');

    await results.first().click();
    await page.waitForURL(/\/procedures\//);

    check(`${locale}: procedure has one h1`, (await page.locator('main h1').count()) === 1);
    const steps = page.locator('main ol > li');
    check(`${locale}: steps render in order`, (await steps.count()) > 0);
    check(
      `${locale}: fee is shown in Latin digits`,
      /[0-9]/.test(await page.locator('main dl').first().innerText()),
    );
    // The responsible office moved out of the stats strip and into its own
    // sidebar card when the procedure page was redesigned, so look for it in
    // the aside. Still exactly one link: two would mean the card rendered
    // twice, none would mean the relation failed to expand.
    const office = page.locator('main aside a[href*="/directorates/"]');
    check(`${locale}: responsible directorate is linked`, (await office.count()) === 1);
    check(
      `${locale}: the directorate link keeps the active locale`,
      (await office.first().getAttribute('href'))?.startsWith(`/${locale}/directorates/`),
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

    // The tag index — the destination of the seeded "Browse by Tag" menu entry.
    await page.goto(`${BASE}/${locale}/procedures/tags`, { waitUntil: 'domcontentloaded' });
    const tagCards = page.locator('main ul li a[href*="tag="]');
    check(`${locale}: tag index lists tags`, (await tagCards.count()) > 0);
    check(
      `${locale}: every listed tag has a count`,
      await page.evaluate(() =>
        [...document.querySelectorAll('main ul li a')].every((a) => /\d/.test(a.textContent ?? '')),
      ),
    );
    const firstTagHref = await tagCards.first().getAttribute('href');
    await tagCards.first().click();
    await page.waitForURL(/tag=/);
    check(
      `${locale}: a tag leads to procedures carrying it`,
      (await page.locator('main ul li a[href*="/procedures/"]').count()) > 0,
      `from ${firstTagHref}`,
    );

    // The static segment must win over /procedures/[slug].
    await page.goto(`${BASE}/${locale}/procedures/tags`, { waitUntil: 'domcontentloaded' });
    check(
      `${locale}: /procedures/tags is the index, not a 404`,
      (await page.locator('main h1').count()) === 1,
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
    // Asserted as a relationship, not a magic number. These counts track whatever is
    // published, so pinning them to the development seed's 14 meant the suite went red
    // the first time real content landed — which says nothing about the page working.
    const allMinistries = await ministryLinks.count();
    check(`${locale}: ministries index lists bodies`, allMinistries > 0, `${allMinistries} listed`);

    // The KRG filter is what the seeded header menu links to.
    await page.goto(`${BASE}/${locale}/ministries?krg=true`, { waitUntil: 'domcontentloaded' });
    const krgCount = await page.locator('main ul li a[href*="/ministries/"]').count();
    await page.goto(`${BASE}/${locale}/ministries?krg=false`, { waitUntil: 'domcontentloaded' });
    const federalCount = await page.locator('main ul li a[href*="/ministries/"]').count();
    check(
      `${locale}: krg filter splits the list`,
      krgCount > 0 && federalCount > 0 && krgCount + federalCount === allMinistries,
      `krg ${krgCount} + federal ${federalCount}, unfiltered ${allMinistries}`,
    );

    // A mangled filter must degrade to the full list, not to nothing.
    await page.goto(`${BASE}/${locale}/ministries?krg=banana`, { waitUntil: 'domcontentloaded' });
    check(
      `${locale}: unknown filter value shows everything`,
      (await page.locator('main ul li a[href*="/ministries/"]').count()) === allMinistries,
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

    // Locations hand off to the visitor's own maps app, never an embed.
    check(`${locale}: no third-party map iframe`, (await page.locator('iframe').count()) === 0);
    const mapLinks = page.locator('main a[href*="waze.com/ul"]');
    check(`${locale}: locations offer a navigate-in-Waze link`, (await mapLinks.count()) > 0);
    check(
      `${locale}: map links open safely in a new tab`,
      (await mapLinks.first().getAttribute('rel'))?.includes('noopener'),
    );

    // Province filtering on the directorates index.
    await page.goto(`${BASE}/${locale}/directorates`, { waitUntil: 'domcontentloaded' });
    const allDirectorates = await page.locator('main ul li a[href*="/directorates/"]').count();
    check(`${locale}: directorates index lists offices`, allDirectorates > 0, `${allDirectorates} listed`);
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

  // Support pages.
  //
  // The contact form is the portal's only write. This suite stays read-only, so
  // it exercises the paths that store nothing: validation failures, and the
  // honeypot (which reports success to a bot without creating a record). A real
  // submission is verified separately against a development instance.
  for (const { locale } of LOCALES) {
    console.log(`\n== /${locale} support pages ==`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await page.goto(`${BASE}/${locale}/faq`, { waitUntil: 'domcontentloaded' });
    const questions = page.locator('main details');
    check(`${locale}: faq lists questions`, (await questions.count()) === 10);
    check(`${locale}: faq starts collapsed`, !(await questions.first().evaluate((d) => d.open)));
    await questions.first().locator('summary').click();
    check(`${locale}: faq opens on click`, await questions.first().evaluate((d) => d.open));

    await page.goto(`${BASE}/${locale}/team`, { waitUntil: 'domcontentloaded' });
    // Not pinned to a count: the team is real content that staff edit, and a
    // test that fails because someone joined is a test that gets ignored.
    check(`${locale}: team lists members`, (await page.locator('main ul > li').count()) >= 1);

    await page.goto(`${BASE}/${locale}/partners`, { waitUntil: 'domcontentloaded' });
    check(`${locale}: partners listed`, (await page.locator('main ul > li').count()) === 6);
    const partnerLinks = page.locator('main a[target="_blank"]');
    check(
      `${locale}: partner links are safe`,
      (await partnerLinks.first().getAttribute('rel'))?.includes('noopener'),
    );

    // 404: localized, inside the shell, and offering real ways out.
    const missing = await page.goto(`${BASE}/${locale}/procedures/no-such-thing`, {
      waitUntil: 'domcontentloaded',
    });
    check(`${locale}: 404 status`, missing?.status() === 404);
    const heading = (await page.locator('main h1').innerText()).trim();
    check(`${locale}: 404 is translated, not a raw message key`, !heading.includes('notFound.'));
    check(
      `${locale}: 404 keeps the site shell`,
      (await page.locator('header').count()) === 1 && (await page.locator('footer').count()) === 1,
    );
    const exits = page.locator('main a');
    check(`${locale}: 404 offers routes onward`, (await exits.count()) >= 3);
    check(
      `${locale}: 404 exits carry the locale`,
      (await exits.first().getAttribute('href'))?.startsWith(`/${locale}`),
    );

    await page.goto(`${BASE}/${locale}/contact`, { waitUntil: 'domcontentloaded' });
    check(`${locale}: contact form renders`, (await page.locator('form textarea').count()) === 1);
    check(
      `${locale}: every field has a label`,
      await page.evaluate(() =>
        [...document.querySelectorAll('form input:not([type=hidden]), form textarea')]
          .filter((el) => el.closest('[aria-hidden="true"]') === null)
          .every((el) => !!document.querySelector(`label[for="${el.id}"]`)),
      ),
    );
    check(
      `${locale}: honeypot is hidden from assistive technology`,
      (await page.locator('form [aria-hidden="true"] input[name="website"]').count()) === 1,
    );

    // Validation failure: nothing is stored, and nothing typed is lost.
    await page.fill('#first_name', 'Zainab');
    await page.fill('#last_name', 'Hassan');
    await page.fill('#email', 'not-an-email');
    await page.fill('#message', 'too short');
    await page.locator('form button[type="submit"]').click();
    await page.waitForSelector('p[id$="-error"]');
    check(
      `${locale}: invalid submission reports field errors`,
      (await page.locator('p[id$="-error"]').count()) >= 2,
    );
    check(
      `${locale}: a failed submission keeps what was typed`,
      (await page.inputValue('#first_name')) === 'Zainab' &&
        (await page.inputValue('#message')) === 'too short',
    );
    check(
      `${locale}: the bad field is marked invalid`,
      (await page.locator('#email').getAttribute('aria-invalid')) === 'true',
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
  // Was keyed on the contact email, which is optional — this check is about the
  // footer surviving without JavaScript, not about a particular setting being set.
  check('no-js: footer still renders', (await page.locator('footer a').count()) > 0);
  const details = page.locator('header details').first();
  await details.locator('summary').click();
  check('no-js: native disclosure still opens', await details.evaluate((d) => d.open));
  check(
    'no-js: language switcher links are real anchors',
    (await page.locator('nav[aria-label] a[hreflang]').count()) === 3,
  );

  // Cache headers. A deploy has to be visible on the next page load, and no
  // amount of tuning for that may make an authenticated page cacheable.
  //
  // Both halves are here because the obvious fix breaks the second one: a
  // `headers()` rule matching `/:path*` replaces Cache-Control on every HTML
  // response, stripping `s-maxage` from the prerendered pages and turning the
  // `private, no-cache, no-store` on /account and /admin into `public`.
  const cacheControlFor = async (path) => {
    const response = await page.request.get(`${BASE}${path}`, {
      headers: { Accept: 'text/html' },
      maxRedirects: 0,
    });
    return response.headers()['cache-control'] ?? '';
  };

  const prerendered = await cacheControlFor('/en');
  check(
    'cache: a prerendered page is still shared-cacheable for an hour',
    prerendered.includes('s-maxage=3600'),
    prerendered,
  );
  check(
    'cache: a prerendered page has no stale-while-revalidate window',
    !prerendered.includes('stale-while-revalidate'),
    prerendered,
  );

  for (const path of ['/en/account', '/en/account/login', '/en/search?q=passport']) {
    const header = await cacheControlFor(path);
    check(`cache: ${path} is never stored`, header.includes('no-store'), header);
    check(`cache: ${path} is not public`, !header.includes('public'), header);
  }

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
