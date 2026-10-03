import { Heart } from "lucide-react";
import { PORTFOLIO_URL } from "../lib/noContact";

const Footer = () => (
  <footer className="mx-auto flex max-w-[760px] items-center justify-center gap-1 px-4 py-8 text-[12.5px] text-ink-faint">
    Built with <Heart size={12} className="text-accent" aria-label="love" /> by
    <a
      href={PORTFOLIO_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="text-ink-soft hover:text-ink transition-colors"
    >
      Ashwin Arora
    </a>
  </footer>
);

export default Footer;
