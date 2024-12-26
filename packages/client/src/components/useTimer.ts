import { useReadContracts } from 'wagmi';
import { HexString } from './utils';
import { RPSLS } from "@kleros-assignment/contract";

const useTimer = (contractAddress: string | undefined) => {
  const { data: contractData } = useReadContracts({
    contracts: [
      {
        abi: RPSLS.abi,
        address: contractAddress as HexString,
        functionName: "TIMEOUT",
      },
      {
        abi: RPSLS.abi,
        address: contractAddress as HexString,
        functionName: "lastAction",
      },
    ],
  });
  const [gameTimeout, gameLastAction] = contractData || [];

  return {gameTimeout, gameLastAction}
}

export default useTimer