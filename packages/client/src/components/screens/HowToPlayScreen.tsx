import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { MOVES } from "../../lib/game";
import { FAQ, MOVE_CARDS, PAYOUTS, STEPS, VISIBILITY } from "../../lib/howToPlay";
import { MOVE_META, VERBS } from "../../lib/moves";

type Tone = "muted" | "accent" | "warn" | "draw";

const toneClasses: Record<Tone, string> = {
  muted: "text-ink-faint bg-white/5",
  accent: "text-accent bg-[rgba(232,254,90,0.12)]",
  warn: "text-warn bg-[rgba(255,196,107,0.12)]",
  draw: "text-draw bg-[rgba(159,180,255,0.12)]",
};

const chips = [
  { href: "#rules", label: "The hands" },
  { href: "#chain", label: "What's on-chain" },
  { href: "#money", label: "Your money" },
  { href: "#faq", label: "FAQ" },
];

const ruleLines = MOVES.flatMap((winner) =>
  MOVE_META[winner].beats.map((loser) => ({
    winner,
    loser,
    verb: VERBS[`${winner}>${loser}`] ?? "beats",
    winnerGlyph: MOVE_META[winner].glyph,
    loserGlyph: MOVE_META[loser].glyph,
  })),
);

export const HowToPlayScreen = () => {
  const [openFaq, setOpenFaq] = useState<number>(-1);
  const [devOpen, setDevOpen] = useState<Record<number, boolean>>({});

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-20 text-ink font-body">
      <p className="mt-6 mb-3 font-mono text-[11px] uppercase tracking-[0.11em] text-ink-faint">How it works</p>
      <h1 className="mb-4 font-display text-[clamp(32px,6.6vw,50px)] font-extrabold leading-[1] tracking-[-0.04em] text-balance">
        Five hands, two wallets,
        <br />
        and one thing nobody can see.
      </h1>
      <p className="mb-3 max-w-[40em] text-[16px] leading-[1.6] text-ink-faint">
        Two parts to this page: how the hands beat each other, and what is actually visible on the blockchain while you
        play. The second part surprises most people — so it gets the longer explanation.
      </p>

      <div className="mb-12 mt-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="rounded-full border border-hairline-soft bg-surface-inset px-4 py-2 text-[13px] text-ink-soft transition-colors hover:border-[rgba(232,254,90,0.4)] hover:text-ink"
          >
            {c.label}
          </a>
        ))}
      </div>

      {/* ─── 01 · THE GAME ─── */}
      <section id="rules" className="mb-14 scroll-mt-6">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-[13px] text-accent">01</span>
          <h2 className="font-display text-[clamp(25px,5vw,32px)] font-extrabold tracking-[-0.035em]">The game</h2>
        </div>
        <p className="mb-6 max-w-[42em] text-[15.5px] leading-[1.65] text-ink-faint">
          Rock-paper-scissors with two extra hands: <span className="text-ink">Lizard</span> and{" "}
          <span className="text-ink">Spock</span>. Both players pick in secret, then the hands are compared. Every hand
          beats two others and loses to the other two — which makes draws much rarer than in the three-hand game, and
          means there's no safe default pick.
        </p>

        <div className="mb-6 flex flex-col gap-2.5">
          {MOVE_CARDS.map((m) => (
            <div
              key={m.key}
              className="flex flex-wrap items-center gap-4 rounded-xl3 border border-hairline-soft bg-surface px-5 py-4"
            >
              <span aria-hidden="true" className="w-[52px] flex-none text-center text-[40px] leading-none">
                {m.glyph}
              </span>
              <div className="flex min-w-[150px] flex-1 flex-col gap-1">
                <span className="font-display text-[19px] font-extrabold tracking-[-0.03em]">{m.name}</span>
                <span className="text-[13.5px] text-ink-deep">{m.tagline}</span>
              </div>
              <div className="flex min-w-[186px] flex-none flex-col gap-1.5">
                <span className="text-[12.5px] text-accent">{m.beats}</span>
                <span className="text-[12.5px] text-ink-deep">{m.losesTo}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl3 border border-hairline-soft bg-surface p-5">
          <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.09em] text-ink-faint">
            All ten outcomes
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {ruleLines.map((l) => (
              <div key={`${l.winner}>${l.loser}`} className="flex items-center gap-2.5 text-[14px]">
                <span aria-hidden="true" className="text-[18px]">
                  {l.winnerGlyph}
                </span>
                <span className="text-ink">{l.winner}</span>
                <span className="text-accent">{l.verb}</span>
                <span className="text-ink">{l.loser}</span>
                <span aria-hidden="true" className="text-[18px]">
                  {l.loserGlyph}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-[1.6] text-ink-deep">
            Same hand on both sides is a draw — both stakes go straight back. This five-hand variant is Sam Kass and
            Karen Bryla's; the rules are unchanged here.
          </p>
        </div>
      </section>

      {/* ─── 02 · ON-CHAIN ─── */}
      <section id="chain" className="mb-14 scroll-mt-6">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-[13px] text-accent">02</span>
          <h2 className="font-display text-[clamp(25px,5vw,32px)] font-extrabold tracking-[-0.035em]">
            "Isn't everything on a blockchain public?"
          </h2>
        </div>
        <p className="mb-2.5 max-w-[42em] text-[15.5px] leading-[1.65] text-ink-faint">
          Yes — and that's exactly the problem a game like this has to solve. If your move went on-chain as "Rock", your
          opponent could read it before choosing and beat you every single time.
        </p>
        <p className="mb-6 max-w-[42em] text-[15.5px] leading-[1.65] text-ink-faint">
          So your move <span className="text-ink">doesn't</span> go on-chain. Only a fingerprint of it does. The move
          itself stays in your browser until the very last step, when revealing it is what settles the game and pays the
          winner.
        </p>

        <div className="mb-3 rounded-xl4 border border-hairline-soft bg-surface p-5">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.09em] text-ink-faint">Step by step</div>
          <div className="flex flex-col">
            {STEPS.map((s, i) => {
              const isLast = i === STEPS.length - 1;
              const open = !!devOpen[i];
              return (
                <div key={s.title} className="flex items-start gap-4">
                  <div className="flex flex-none flex-col items-center self-stretch">
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-[rgba(232,254,90,0.45)] bg-[rgba(232,254,90,0.1)] font-mono text-[12.5px] text-accent">
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        "min-h-[14px] w-px flex-1",
                        isLast ? "bg-transparent" : "bg-[rgba(232,254,90,0.22)]",
                      )}
                    />
                  </div>
                  <div className={cn("flex flex-col gap-1.5", isLast ? "pb-0" : "pb-7")}>
                    <span className="text-[16px] font-bold tracking-[-0.01em]">{s.title}</span>
                    <span className="text-[14px] leading-[1.6] text-ink-faint">{s.body}</span>
                    <span className="text-[13px] italic leading-[1.6] text-ink-deep">{s.aside}</span>
                    <button
                      type="button"
                      onClick={() => setDevOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
                      aria-expanded={open}
                      className="mt-1 self-start rounded-full border border-white/10 bg-transparent px-3 py-1 font-mono text-[11.5px] text-ink-faint transition-colors hover:border-[rgba(232,254,90,0.4)] hover:text-ink"
                    >
                      {open ? "Hide the technical version" : "For developers"}
                    </button>
                    {open && (
                      <p className="mt-1 break-words rounded-xl2 border border-hairline-soft bg-[#0D0C10] p-4 font-mono text-[12.5px] leading-[1.7] text-ink-faint">
                        {s.dev}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-3 rounded-xl4 border border-hairline-soft bg-surface p-5">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.09em] text-ink-faint">
            What a stranger with a block explorer sees
          </div>
          <p className="mb-4 text-[13.5px] leading-[1.6] text-ink-deep">
            Assuming you're the host — the player who commits first.
          </p>
          <div className="flex flex-col gap-2">
            {VISIBILITY.map((v) => (
              <div
                key={v.stage}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-xl2 border border-hairline-soft bg-surface-inset px-4 py-3"
              >
                <span className="text-[14px] text-ink">{v.stage}</span>
                <span
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1 font-mono text-[12.5px]",
                    toneClasses[v.tone],
                  )}
                >
                  {v.label}
                </span>
                <span className="col-span-2 text-[13px] leading-[1.55] text-ink-deep">{v.detail}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl4 border border-[rgba(232,254,90,0.25)] bg-[rgba(232,254,90,0.06)] p-5">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.09em] text-accent">
            The one asymmetry, stated plainly
          </div>
          <p className="mb-3 text-[14.5px] leading-[1.65] text-ink-mute">
            The challenger's move goes on-chain in the clear, so the host <span className="text-ink">can</span> see it
            before revealing. That sounds unfair, and it isn't — because by then the host's move is already locked to a
            fingerprint they can't change. Reveal a different move and the contract rejects the transaction.
          </p>
          <p className="text-[14.5px] leading-[1.65] text-ink-mute">
            The host's only other option is to stall and never reveal. Do that, and after five minutes the challenger
            claims <span className="text-ink">both</span> stakes. Refusing to reveal costs you more than losing does.
          </p>
        </div>
      </section>

      {/* ─── 03 · MONEY ─── */}
      <section id="money" className="mb-14 scroll-mt-6">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-[13px] text-accent">03</span>
          <h2 className="font-display text-[clamp(25px,5vw,32px)] font-extrabold tracking-[-0.035em]">
            Where your money sits
          </h2>
        </div>
        <p className="mb-6 max-w-[42em] text-[15.5px] leading-[1.65] text-ink-faint">
          Every match deploys its own contract, holding exactly two stakes and knowing exactly four ways to pay them
          out. There's no shared pool, no house wallet, and no owner key that can move your funds — including ours.
        </p>
        <div className="flex flex-col gap-2.5">
          {PAYOUTS.map((p) => (
            <div
              key={p.title}
              className="flex flex-wrap items-start gap-4 rounded-xl3 border border-hairline-soft bg-surface px-5 py-4"
            >
              <span className={cn("flex-none rounded-full px-3 py-1 font-mono text-[12.5px]", toneClasses[p.tone])}>
                {p.tag}
              </span>
              <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                <span className="text-[15px] font-bold">{p.title}</span>
                <span className="text-[13.5px] leading-[1.6] text-ink-deep">{p.body}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 04 · FAQ ─── */}
      <section id="faq" className="mb-12 scroll-mt-6">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[13px] text-accent">04</span>
          <h2 className="font-display text-[clamp(25px,5vw,32px)] font-extrabold tracking-[-0.035em]">
            Straight answers
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {FAQ.map((f, i) => {
            const open = openFaq === i;
            return (
              <div
                key={f.q}
                className={cn(
                  "overflow-hidden rounded-xl3 border bg-surface",
                  open ? "border-[rgba(232,254,90,0.3)]" : "border-hairline-soft",
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  aria-expanded={open}
                  className={cn(
                    "flex w-full items-center justify-between gap-3.5 px-5 py-4 text-left text-[15px] text-ink transition-colors hover:text-accent",
                    open ? "font-bold" : "font-medium",
                  )}
                >
                  {f.q}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid h-5.5 w-5.5 flex-none place-items-center rounded-full bg-white/5 text-[11px] text-ink-faint transition-transform duration-200",
                      open && "rotate-180",
                    )}
                    style={{ width: 22, height: 22 }}
                  >
                    ▾
                  </span>
                </button>
                {open && (
                  <div className="flex flex-col gap-2.5 px-5 pb-5">
                    <p className="text-[14.5px] leading-[1.68] text-ink-faint">{f.a}</p>
                    <p className="text-[13.5px] leading-[1.6] text-ink-deep">{f.a2}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl4 border border-hairline-soft bg-surface p-6">
        <div className="flex flex-col gap-1">
          <span className="font-display text-[20px] font-extrabold tracking-[-0.03em]">That's the whole thing.</span>
          <span className="text-[13.5px] text-ink-deep">Start with an amount you'd be relaxed about losing.</span>
        </div>
        <Link
          to="/"
          className="rounded-xl3 bg-accent px-6 py-3.5 text-[15.5px] font-bold text-bg transition-colors hover:bg-accent-hi"
        >
          Play a game
        </Link>
      </div>
    </div>
  );
};
