import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { toHumanNumber } from "./utils";
import { FaCoins, FaRegCopy, FaWallet } from "react-icons/fa";
// import { socket } from "../socket";
import { LiaHandScissorsSolid } from "react-icons/lia";
import { IoPower } from "react-icons/io5";
import { useState } from "react";

const Topbar = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const balanceData = useBalance({ address });
  const [copied, setCopied] = useState(false);

  // Format address like 0x12...34AB
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  // Copy full address on click
  const handleCopy = () => {
    navigator.clipboard.writeText(address || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
  };

  return (
    <div className="min-h-28 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm fixed w-full z-10">
        <div className="container flex  items-center justify-between p-4 lg:p-6 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            <LiaHandScissorsSolid className="h-6 w-6 text-blue-400" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              RPSLS
              <span className="hidden sm:inline">
                {" "}
                - Rock Paper Scissors Lizard Spock
              </span>
            </h1>
          </div>

          {/* Wallet Info */}
          <div className="flex items-center gap-2  justify-end w-full md:w-auto">
            {isConnected ? (
              <div className="flex  items-center gap-4 justify-end">
                {/* Balance Card */}
                <div className="bg-slate-800/50  rounded-lg px-4 py-2 flex items-center gap-2 border border-slate-700/50">
                  <FaCoins className="w-4 h-4 text-yellow-500" />
                  <span className="text-slate-300 text-sm sm:text-base">
                    {toHumanNumber(
                      balanceData.data?.value ?? 0n,
                      chain?.nativeCurrency.decimals,
                      4,
                    )}{" "}
                    {chain?.nativeCurrency.symbol}
                  </span>
                  {/* Divider */}
                  <div className="h-4 w-px bg-slate-700 hidden sm:block" />
                  {/* Address Copy */}
                  <div
                    onClick={handleCopy}
                    className="cursor-pointer flex items-center gap-1 text-slate-300 hover:text-white transition relative"
                    title={copied ? "Copied!" : "Click to copy"}
                  >
                    <FaRegCopy className="w-4 h-4 text-white opacity-90 hover:opacity-100 transition-opacity" />
                    <span className="hidden md:inline">
                      {formatAddress(address)}
                    </span>
                  </div>
                </div>

                {/* Disconnect Button */}
                <button
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg text-xs sm:text-sm transition duration-200"
                  onClick={() => disconnect()}
                >
                  <IoPower className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ) : (
              // Connect Wallet Button
              <button
                onClick={() => {
                  connect({ connector: connectors[0] });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs sm:text-sm"
              >
                <FaWallet className="h-4 w-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Topbar;
