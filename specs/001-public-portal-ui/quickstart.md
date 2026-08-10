# Quickstart: Public Portal

## Run it

```bash
npm run dev
```

Requires `.env.local` with `NEXT_PUBLIC_PB_URL` pointing at the PocketBase
instance. The portal reads anonymously, so no credentials are needed to develop
or view it — superuser credentials are only for schema and seed tooling.

Visit `/en`, `/ar`, `/ku`. The language switcher preserves the current path, so
the fastest way to check a screen in all three languages is to build it once and
click through.

## Verify a change

```bash
npm run typecheck && npm run lint && npm run build
```

The build output is a check in itself: content routes should appear as `●` (SSG).
A route that silently becomes `ƒ` (dynamic) has picked up a per-request
dependency — usually `useSearchParams` outside a Suspense boundary, or a
`cookies()` call — and has lost the caching the performance budget depends on.

## The four checks that catch most defects here

1. **All three languages.** Not just English. Arabic and Kurdish reveal
   direction bugs, overflow and font-fallback problems that English never will.
2. **320 px.** Resize to a small phone; nothing should scroll horizontally.
3. **Keyboard only.** Tab through the page. Every interactive element must be
   reachable, with a visible focus ring, in a sensible order.
4. **JavaScript disabled.** Content pages must still read and navigate.

## Checking the font

Open a Kurdish page, select text containing ڕ ڵ ۆ ێ گ چ پ ژ, and confirm in the
browser's font inspector that the chosen family is rendering those glyphs rather
than a system fallback. This is the failure that looks fine to a reviewer who
does not read Kurdish.

## Confirming what the public can actually see

The portal reads anonymously, so any curl against the API sees exactly what a
visitor sees:

```bash
curl -s "https://irshad-api.esite-lab.com/api/collections/procedures/records?perPage=1"
```

An archived or unpublished record must be absent from these results. If a page
renders something this call cannot return, the page is reading with privileges it
should not have.
