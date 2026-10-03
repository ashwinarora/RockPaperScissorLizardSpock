## Running the Project Locally

Follow these steps to run the project locally:

1. Install dependencies:
    ```bash
    yarn install
    ```

2. Compile the contracts:
    ```bash
    yarn compileContracts
    ```

3. Start the development server in terminal 1:
    ```bash
    yarn server:dev
    ```

4. Start the client in terminal 2:
    ```bash
    yarn client:dev
    ```

## No-contact mode

This repo builds two deployments from the same branch (`master`). The only difference between them is one environment variable:

| `NO_CONTACT` | Deployment | Result |
| --- | --- | --- |
| unset, or anything but `true` | `lizardpoisonspock.com` | The normal site |
| `true` | `showcase.lizardpoisonspock.com` | Identical, except a visitor has no way to contact me or find my contact details |

The only thing on this site that leads to me is the footer credit, which links to my portfolio. In no-contact mode that link goes to the portfolio's own no-contact deployment (`https://showcase.ashwinarora.com`) instead of `https://ashwinarora.com`, and the site is `noindex`: a `<meta name="robots">` in `index.html` and an `X-Robots-Tag` header on every response from the server. The link is decided at build time, so the normal URL is absent from the JavaScript rather than hidden.

The client reads `NO_CONTACT` when it is built and the server reads it when it starts. On Railway both happen in the same service, so the one variable covers both.

### Where it lives

| File | Role |
| --- | --- |
| `packages/client/src/lib/noContact.ts` | **The flag, client side.** Exports `NO_CONTACT` and `PORTFOLIO_URL`. The only place the app learns which deployment it is |
| `packages/client/site.config.ts` | Both URLs (normal and showcase) for every link to one of my sites. `vite.config.ts` selects one and injects it; nothing in `src/` imports this file |
| `packages/client/vite.config.ts` | Reads `NO_CONTACT`, defines the two build-time constants, and adds the `noindex` meta tag to `index.html` |
| `packages/server/src/noContact.ts` | **The flag, server side.** Exports `NO_CONTACT` and the `noIndex` middleware that `index.ts` mounts first |
| `scripts/check-no-contact.mjs` | `yarn check:no-contact` |

### Rules for future changes

1. **Gate contact UI on `NO_CONTACT`, in the JSX**: `{!NO_CONTACT && <a href="…">…</a>}`. `NO_CONTACT` is a build-time constant, so the bundler deletes the whole branch. Hiding it with CSS, or checking anything at runtime, leaves it in the bundle.
2. **Never hard-code a link to one of my sites.** Add it to `site.config.ts` with both URLs, select it in `vite.config.ts`, and export the selected value from `noContact.ts`, as `PORTFOLIO_URL` does.
3. **Anything else that leads to me stays out of a no-contact build**: an email address, a social profile, a handle, my GitHub, a calendar link. That includes meta tags in `index.html` (`twitter:creator`, an author link) and anything the server returns.
4. **Copy that invites contact needs a second wording** that reads complete without it: `NO_CONTACT ? "…" : "…"`.
5. **Images are yours to check.** The script reads text, not pixels.
6. **Run `yarn check:no-contact` before pushing.** It compiles the contracts, builds the client with `NO_CONTACT=true` and fails if `packages/client/dist` contains an email address, `mailto:`, `tel:`, Calendly, Telegram, WhatsApp, LinkedIn, X/Twitter, Discord, my GitHub, my handles or the normal domain of any of my sites (a `showcase.` prefix is allowed), or if the `noindex` meta tag is missing. There is no CI in this repo, so this is the check. It leaves a no-contact build in `packages/client/dist`; rebuild before serving the normal site locally.
7. **Keep the allowlist in the script narrow.** The wallet libraries (Reown AppKit, WalletConnect, MetaMask SDK) ship strings such as `isTelegram()` and the social-login provider id `"discord"`. Each one is excused by an entry that names the pattern, the chunk and the exact library code around the match, with a line saying what it is. A dependency upgrade can move those strings: read every new finding, and add an entry only for third-party code. Never add one for something this repo produces, and never excuse a whole file.

### Deploying it

Set `NO_CONTACT=true` on the service and deploy `master`. Nothing else in the code differs. The deployment needs its own Postgres: the scripts do not run migrations, so apply them once with `yarn workspace @rpsls/server exec prisma migrate deploy` against the new `DATABASE_URL`. If the Reown project restricts domains, add the new domain to its allowlist at dashboard.reown.com.
