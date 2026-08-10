'use client';

import LocaleError from '../error';

/**
 * Errors raised by a public page, kept inside the site shell.
 *
 * Same view as the locale-level boundary, but this one renders within
 * `(public)/layout.tsx`, so a visitor whose page failed still has the header,
 * the menu and the footer to navigate away with.
 */
export default LocaleError;
