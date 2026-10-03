/**
 * Every URL that differs between the two deployments of this site, both columns committed.
 *
 * vite.config.ts picks one column from NO_CONTACT and injects only that one into the build,
 * so the other column never reaches the bundle. Nothing in src/ may import this file —
 * read the selected value from src/lib/noContact.ts instead.
 * See README "No-contact mode".
 */

/** The footer credit link: my portfolio. */
export const portfolioUrl = {
  normal: "https://ashwinarora.com",
  showcase: "https://showcase.ashwinarora.com",
};
