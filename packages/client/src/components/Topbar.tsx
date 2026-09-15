import { useAppKit } from "@reown/appkit/react";
import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { WalletChip } from "./domain/WalletChip";
import { Wordmark } from "./domain/Wordmark";
import { Button } from "./ui/Button";

const Topbar = () => {
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const { pathname } = useLocation();
  const onHowToPlay = pathname === "/how-to-play";

  return (
    <header className="mx-auto flex w-full max-w-[760px] items-center justify-between px-4 py-5">
      <Link to="/" className="focus:outline-none">
        <Wordmark size="sm" />
      </Link>
      <div className="flex items-center gap-4">
        <Link
          to={onHowToPlay ? "/" : "/how-to-play"}
          className="whitespace-nowrap text-[13px] text-ink-faint transition-colors hover:text-ink"
        >
          {onHowToPlay ? "← Back to the game" : "How to play"}
        </Link>
        {isConnected ? (
          <WalletChip />
        ) : (
          <Button size="sm" onClick={() => open()}>
            Connect wallet
          </Button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
