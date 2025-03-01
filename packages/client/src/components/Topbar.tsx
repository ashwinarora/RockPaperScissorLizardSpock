import { useAccount, useConnect, useBalance } from "wagmi";
import { toHumanNumber } from "./utils";
import { FaWallet } from "react-icons/fa";
// import { socket } from "../socket";
import { useState } from "react";

const Topbar = () => {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  // const { disconnect } = useDisconnect();
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
    <div className="min-h-28 bg-gradient-to-b from-slate-950 to-slate-950 text-slate-50 ">
      <header className="border-b border-slate-800 bg-[#0A193A] backdrop-blur-sm fixed w-full z-10">
        <div className="container flex  items-center justify-between p-4 lg:p-5 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            {/* <LiaHandScissorsSolid className="h-6 w-6 text-blue-400" /> */}
            <img
              src="assests/rock.svg
              "
              alt="Rock Logo"
              className="w-8 h-8 object-contain "
            />

            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Lizard poison Spock
              {/* <span className="hidden sm:inline"> - Lizard poison Spock</span> */}
            </h1>
          </div>

          {/* Wallet Info */}
          <div className="flex items-center gap-2  justify-end w-full md:w-auto">
            {isConnected ? (
              <div className="flex  items-center gap-4 justify-end">
                {/* Balance Card */}
                <div className="bg-slate-950  rounded-lg px-4 py-2 flex items-center gap-2 border border-slate-700/50">
                  {/* <FaCoins className="w-4 h-4 text-yellow-500" /> */}
                  <span className="text-slate-300 text-sm sm:text-base">
                    {toHumanNumber(
                      balanceData.data?.value ?? 0n,
                      chain?.nativeCurrency.decimals,
                      4,
                    )}{" "}
                    {chain?.nativeCurrency.symbol}
                  </span>
                  {/* Divider */}
                  {/* <div className="h-4 w-px bg-slate-700 hidden sm:block" /> */}
                  {/* Address Copy */}
                  <div
                    onClick={handleCopy}
                    className="cursor-pointer flex items-center gap-1 text-slate-300 hover:text-white transition relative bg px-2 rounded-md bg-[#0A193A]"
                    title={copied ? "Copied!" : "Click to copy"}
                  >
                    {/* <FaRegCopy className="w-4 h-4 text-white opacity-90 hover:opacity-100 transition-opacity " /> */}
                    <span className="hidden md:inline">
                      {formatAddress(address)}
                    </span>
                  </div>
                </div>

                {/* Disconnect Button */}
                {/* <button
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg text-xs sm:text-sm transition duration-200"
                  onClick={() => disconnect()}
                >
                  <IoPower className="w-4 h-4" />
                  Disconnect
                </button> */}
              </div>
            ) : (
              // Connect Wallet Button
              <button
                onClick={() => {
                  connect({ connector: connectors[0] });
                }}
                className="flex items-center gap-3 px-8 py-2 bg-green-700 text-gray-300 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 text-xs sm:text-sm"
              >
                <FaWallet className="h-4 w-4" />
                Connect
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Topbar;
