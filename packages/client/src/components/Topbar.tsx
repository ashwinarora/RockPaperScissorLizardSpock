import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { toHumanNumber } from "./utils";

const Topbar = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const balanceData = useBalance({ address });

  return (
    <div className="flex justify-between border-b border-gray-300 p-4">
      <h1 className="text-3xl">RockPaperScissorLizardSpock - Ashwin Arora</h1>
      <div className="text-lg">
        {isConnected ? (
          <div>
            <div>Address: {address}</div>
            <div>
              Balance: {toHumanNumber(balanceData.data?.value ?? 0n, chain?.nativeCurrency.decimals, 4)} {chain?.nativeCurrency.symbol}
            </div>
            <div>Chain: {chain?.id}  {chain?.name}</div>
            <button
              className="p-1 bg-red-500 text-white rounded"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="ml-2 p-1 bg-blue-500 text-white rounded"
            onClick={() => connect({ connector: connectors[0] })}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
};

export default Topbar;
