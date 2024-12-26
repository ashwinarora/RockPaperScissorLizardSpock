import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { toHumanNumber } from "./utils";
import { socket } from "../socket";

const Topbar = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const balanceData = useBalance({ address });

  return (
    <div className="flex justify-between border-b border-gray-300 p-4">
      <div className="flex flex-col gap-y-4">
        <h1 className="text-3xl">RockPaperScissorLizardSpock</h1>
        <a className="text-2xl italic underline" href="https://www.ashwinarora.com/" target="_blank">ashwinarora.com</a>
      </div>
      <div className="text-lg">
        {isConnected ? (
          <div>
            <div>Address: {address}</div>
            <div>
              Balance:{" "}
              {toHumanNumber(
                balanceData.data?.value ?? 0n,
                chain?.nativeCurrency.decimals,
                4,
              )}{" "}
              {chain?.nativeCurrency.symbol}
            </div>
            <div>
              Chain: {chain?.id} {chain?.name}
            </div>
            <div className="flex items-center justify-start gap-x-10">
              <button
                className="p-1 bg-red-500 text-white rounded"
                onClick={() => disconnect()}
              >
                Disconnect
              </button>
              <button
                className="p-1 bg-orange-600 text-white rounded"
                onClick={() => {
                  socket.emit("cleanupServer");
                }}
              >
                Cleanup Server
              </button>
            </div>
          </div>
        ) : (
          <button
            className="ml-2 p-1 bg-blue-500 text-white rounded"
            onClick={() => {
              connect({ connector: connectors[0] })
              socket.emit("statusRequest");
            }}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
};

export default Topbar;
