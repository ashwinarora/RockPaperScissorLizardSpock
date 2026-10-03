/**
 * No-contact mode: the one place the server learns about it.
 *
 * `NO_CONTACT=true` in the server's environment is the no-contact deployment. Unset, or
 * any other value, is the normal site. The client reads the same variable at build time
 * (packages/client/vite.config.ts). See README "No-contact mode".
 */
import type { RequestHandler } from "express";

export const NO_CONTACT: boolean = process.env.NO_CONTACT === "true";

/** Keeps the no-contact deployment out of search results. Covers the files a meta tag cannot. */
export const noIndex: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
};
