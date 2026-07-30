/**
 * End-to-end smoke test for the admin dashboard.
 *
 * Drives a real browser so the Server Action round trip — sign in, validate,
 * write to PocketBase, revalidate — is actually exercised rather than assumed.
 *
 *   BASE_URL=http://localhost:3000 \
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   node e2e/admin.mjs
 *
 * It writes to whichever PocketBase instance the app points at, so run it
 * against a development instance only. Everything it creates, it deletes.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const MOD_EMAIL = process.env.MOD_EMAIL;

if (!EMAIL || !PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  process.exit(1);
}

let pass = 0;
let fail = 0;
const check = (label, ok, detail = '') => {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}  ${detail}`);
  }
};

const stamp = process.env.RUN_ID ?? String(Date.now()).slice(-8);
const SLUG = `e2e-check-${stamp}`;

/** Waits for a non-empty alert. Two alert nodes can exist mid-render. */
async function alertText(page, role = 'alert') {
  const node = page.locator(`[role=${role}]`, { hasText: /\S/ }).first();
  await node.waitFor({ timeout: 20000 });
  return (await node.textContent()) ?? '';
}

async function signIn(page, email, password) {
  await page.goto(`${BASE}/en/admin/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await Promise.all([
    page.waitForURL(/\/en\/admin(?!\/login)/, { timeout: 20000 }).catch(() => {}),
    page.click('button[type=submit]'),
  ]);
  await page.waitForLoadState('networkidle');
}

async function main() {
  const browser = await chromium.launch();
  let createdId = null;

  try {
    // ---------------------------------------------------------------- login
    {
      const page = await browser.newPage();
      await page.goto(`${BASE}/en/admin/login`, { waitUntil: 'networkidle' });
      await page.fill('#email', EMAIL);
      await page.fill('#password', 'definitely-not-the-password');
      await page.click('button[type=submit]');
      const text = await alertText(page);
      check('wrong password is rejected', /not recognised/i.test(text), text);
      check('rejection does not reveal whether the account exists',
        !/no such user|unknown user|not found/i.test(text), text);

      // Regression: React 19 resets an uncontrolled form once the action
      // resolves. That wiped the email box, and the browser's `required` check
      // then blocked the retry silently — no request was even sent.
      check('email survives a rejected sign-in', (await page.inputValue('#email')) === EMAIL,
        await page.inputValue('#email'));

      await page.fill('#password', PASSWORD);
      await Promise.all([
        page.waitForURL(/\/en\/admin$/, { timeout: 20000 }).catch(() => {}),
        page.click('button[type=submit]'),
      ]);
      check('retrying after a failed sign-in works', /\/en\/admin$/.test(page.url()), page.url());
      await page.close();
    }

    {
      const page = await browser.newPage();
      await signIn(page, EMAIL, PASSWORD);
      check('valid staff credentials sign in', /\/en\/admin/.test(page.url()) && !page.url().includes('login'), page.url());
      await page.close();
    }

    // A citizen-role account must not be able to sign in to the admin at all.
    if (process.env.CITIZEN_EMAIL) {
      const page = await browser.newPage();
      await page.goto(`${BASE}/en/admin/login`, { waitUntil: 'networkidle' });
      await page.fill('#email', process.env.CITIZEN_EMAIL);
      await page.fill('#password', PASSWORD);
      await page.click('button[type=submit]');
      await alertText(page);
      check('citizen account cannot sign in to the admin', page.url().includes('login'), page.url());
      await page.close();
    }

    // --------------------------------------------------------------- create
    const page = await browser.newPage();
    await signIn(page, EMAIL, PASSWORD);

    {
      await page.goto(`${BASE}/en/admin/tags/new`, { waitUntil: 'networkidle' });
      // Submit with the required English name empty.
      await page.fill('#slug', SLUG);
      await page.click('button[type=submit]');
      const text = await alertText(page);
      check('required field is enforced server-side', /correct the highlighted/i.test(text), text);

      // Regression: the same React 19 form reset would have discarded every
      // field an editor had filled in — on a long description, real data loss.
      check('typed values survive a validation failure',
        (await page.inputValue('#slug')) === SLUG, await page.inputValue('#slug'));
    }

    {
      await page.fill('#name_en', `E2E ${stamp}`);
      await page.fill('#name_ar', `اختبار ${stamp}`);
      await page.click('button[type=submit]');
      await page.waitForURL(/\/en\/admin\/tags\/[a-z0-9]{15}/, { timeout: 20000 });
      createdId = page.url().split('/').pop();
      check('creating a record redirects to its edit page', !!createdId, page.url());

      const value = await page.inputValue('#name_en');
      check('created values are persisted and read back', value === `E2E ${stamp}`, value);
    }

    {
      // The Kurdish field was left empty — the form should say so.
      const emptyMarkers = await page.locator('text=empty').count();
      check('untranslated languages are flagged in the form', emptyMarkers >= 1, String(emptyMarkers));
    }

    // --------------------------------------------------------------- update
    {
      await page.fill('#name_ku', `تاقیکردنەوە ${stamp}`);
      await page.click('button[type=submit]');
      const text = await alertText(page, 'status');
      check('updating an existing record succeeds', /saved/i.test(text), text);

      await page.reload({ waitUntil: 'networkidle' });
      const value = await page.inputValue('#name_ku');
      check('update survives a reload', value === `تاقیکردنەوە ${stamp}`, value);
    }

    // ------------------------------------------------------------ list view
    {
      await page.goto(`${BASE}/en/admin/tags?q=${SLUG}`, { waitUntil: 'networkidle' });
      const body = await page.textContent('body');
      check('new record appears in a filtered list', (body ?? '').includes(`E2E ${stamp}`), '');
    }

    // -------------------------------------------------------- moderator gate
    if (MOD_EMAIL) {
      const modPage = await browser.newPage();
      await signIn(modPage, MOD_EMAIL, PASSWORD);
      const res = await modPage.goto(`${BASE}/en/admin/users`, { waitUntil: 'networkidle' });
      check('moderator cannot open an admin-only section', res?.status() === 404, String(res?.status()));
      await modPage.close();
    }

    // --------------------------------------------------------------- delete
    if (createdId) {
      await page.goto(`${BASE}/en/admin/tags/${createdId}`, { waitUntil: 'networkidle' });
      page.once('dialog', (d) => d.accept());
      await page.click('button:has-text("Delete")');
      await page.waitForURL(/\/en\/admin\/tags$/, { timeout: 20000 });

      const res = await page.goto(`${BASE}/en/admin/tags/${createdId}`, { waitUntil: 'networkidle' });
      check('deleted record is gone', res?.status() === 404, String(res?.status()));
      createdId = null;
    }

    await page.close();
  } finally {
    if (createdId) {
      console.log(`  NOTE  leftover tag ${createdId} — delete it manually`);
    }
    await browser.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
