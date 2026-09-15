import { Skeleton } from "../ui/Skeleton";

export const ReconnectScreen = () => (
  <div className="mx-auto max-w-[620px] px-4 py-16 flex flex-col items-center gap-4 text-center animate-risein">
    <div className="flex items-center gap-3">
      <span className="inline-block h-5 w-5 rounded-full border-[2.5px] border-accent border-t-transparent animate-spin" />
      <span className="font-display text-[20px] font-bold text-ink">Restoring your game…</span>
    </div>
    <p className="text-ink-soft text-[13.5px]">Your move and stake are safe on-chain.</p>
    <div className="w-full max-w-md rounded-xl4 border border-hairline-soft bg-surface p-4 flex flex-col gap-3 mt-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);
