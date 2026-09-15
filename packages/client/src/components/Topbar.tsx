import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { WalletChip } from "./domain/WalletChip";
import { Wordmark } from "./domain/Wordmark";
import { Button } from "./ui/Button";

const Topbar = () => {
  const { isConnected } = useAccount();
  const { open } = useAppKit();

  return (
    <header className="mx-auto flex w-full max-w-[760px] items-center justify-between px-4 py-5">
      <a href="/" className="focus:outline-none">
        <Wordmark size="sm" />
      </a>
      {isConnected ? (
        <WalletChip />
      ) : (
        <Button size="sm" onClick={() => open()}>
          Connect wallet
        </Button>
      )}
    </header>
  );
};

export default Topbar;
