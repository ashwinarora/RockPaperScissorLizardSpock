import { useAccount, useConnect } from "wagmi";
import { WalletChip } from "./domain/WalletChip";
import { Wordmark } from "./domain/Wordmark";
import { Button } from "./ui/Button";

const Topbar = () => {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  return (
    <header className="mx-auto flex max-w-[720px] items-center justify-between px-4 py-5">
      <a href="/" className="focus:outline-none">
        <Wordmark size="sm" />
      </a>
      {isConnected ? (
        <WalletChip />
      ) : (
        <Button size="sm" onClick={() => connect({ connector: connectors[0] })} disabled={isPending}>
          {isPending ? "Opening MetaMask…" : "Connect wallet"}
        </Button>
      )}
    </header>
  );
};

export default Topbar;
