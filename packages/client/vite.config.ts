import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";
import { portfolioUrl } from "./site.config";

// No-contact mode. NO_CONTACT is the only variable a deployment sets; the server reads the
// same variable at runtime (packages/server/src/noContact.ts). See README "No-contact mode".
const NO_CONTACT = process.env.NO_CONTACT === "true";

/** Marks index.html noindex for a no-contact build. A no-op otherwise. */
function noContact(): Plugin {
  return {
    name: "no-contact",
    transformIndexHtml() {
      if (!NO_CONTACT) return;
      return [{ tag: "meta", attrs: { name: "robots", content: "noindex, nofollow" }, injectTo: "head" }];
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), noContact()],
  define: {
    __NO_CONTACT__: JSON.stringify(NO_CONTACT),
    __PORTFOLIO_URL__: JSON.stringify(NO_CONTACT ? portfolioUrl.showcase : portfolioUrl.normal),
  },
});
