/**
 * No-contact mode: the one place the client learns about it.
 *
 * `NO_CONTACT=true` in the build environment produces a deployment with no way to reach
 * me: every link to one of my sites goes to its own no-contact deployment, and the page
 * is noindex. Unset, or any other value, is the normal site. The values below are fixed
 * at build time (see vite.config.ts), so anything gated on NO_CONTACT is removed from the
 * bundle rather than hidden.
 *
 * Gate contact UI with `NO_CONTACT` and take the portfolio link from `PORTFOLIO_URL`.
 * Never hard-code either elsewhere. See README "No-contact mode".
 */
export const NO_CONTACT: boolean = __NO_CONTACT__;

/** The footer credit link, already selected for this deployment. */
export const PORTFOLIO_URL: string = __PORTFOLIO_URL__;
