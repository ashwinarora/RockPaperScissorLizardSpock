import { Check, ChevronDown, Copy, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAccount, useBalance, useDisconnect, useSwitchChain } from "wagmi";
import { SUPPORTED_CHAINS, isSupported, isTestnet } from "../../lib/chains";
import { cn } from "../../lib/cn";
import { shortAddress, toHumanNumber } from "../../lib/game";
import { ChainDot } from "../ui/Pill";

export const WalletChip = () => {
  const { address, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  if (!address) return null;

  const chainSupported = chain ? isSupported(chain.id) : false;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={chainSupported ? chain?.name : "Unsupported network"}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border py-1.5 pl-3 pr-2 text-[13px] transition-colors duration-150",
          "bg-surface-2",
          chainSupported
            ? "border-hairline-strong hover:border-[rgba(232,254,90,0.45)] hover:bg-surface-hover"
            : "border-[rgba(255,138,122,0.4)] hover:border-loss",
        )}
      >
        <ChainDot active={chainSupported} />
        <span className="font-mono text-ink text-[12.5px]">{shortAddress(address)}</span>
        <span className="h-3 w-px bg-hairline-strong" />
        <span className="font-mono text-ink-soft text-[12px]">
          {toHumanNumber(balance?.value ?? 0n, chain?.nativeCurrency.decimals, 3)} {chain?.nativeCurrency.symbol ?? ""}
        </span>
        <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface">
          <ChevronDown size={12} className="text-ink-faint" />
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[280px] rounded-xl4 bg-surface-2 border border-hairline-strong shadow-2xl p-2 animate-fadeup z-50">
          <div className="px-2 pt-1 pb-2 text-[10px] uppercase tracking-widest text-ink-faint">Switch chain</div>
          <ul className="flex flex-col">
            {SUPPORTED_CHAINS.map((c) => {
              const active = c.id === chain?.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={active}
                    onClick={() => {
                      if (!active) switchChain({ chainId: c.id });
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl2 px-2.5 py-2 text-[13px] transition-colors",
                      "hover:bg-white/5",
                      active && "cursor-default",
                    )}
                  >
                    <ChainDot active />
                    <span className="text-ink">{c.name}</span>
                    {isTestnet(c.id) && (
                      <span className="text-[10px] uppercase tracking-widest text-ink-faint">testnet</span>
                    )}
                    {active && <Check size={14} className="ml-auto text-accent" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="my-1 h-px bg-hairline-soft mx-1" />
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(address);
              } catch {
                /* clipboard blocked */
              }
              setAddressCopied(true);
              setTimeout(() => setAddressCopied(false), 1200);
            }}
            className="flex w-full items-center gap-2 rounded-xl2 px-2.5 py-2 text-[13px] text-ink-soft hover:text-ink hover:bg-white/5"
          >
            <Copy size={13} />
            {addressCopied ? "Address copied ✓" : "Copy address"}
          </button>
          <button
            type="button"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-xl2 px-2.5 py-2 text-[13px] text-loss hover:bg-[rgba(255,138,122,0.1)]"
          >
            <LogOut size={13} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
