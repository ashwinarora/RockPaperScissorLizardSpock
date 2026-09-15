import { cn } from "../../lib/cn";

export const Skeleton = ({ className }: { className?: string }) => (
  <span className={cn("block rounded-xl2 shimmer-bar animate-shimmer", className)} />
);
