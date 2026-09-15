import { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/cn";

interface CountdownRingProps {
  timeout: bigint;
  lastAction: bigint;
  onExpire?: () => void;
  label?: string;
  labelExpired?: string;
}

const formatTime = (seconds: number) => {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

export const CountdownRing = ({
  timeout,
  lastAction,
  onExpire,
  label = "until you can claim",
  labelExpired = "window closed — claim now",
}: CountdownRingProps) => {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const { remaining, pct, expired } = useMemo(() => {
    const elapsed = now - Number(lastAction);
    const remain = Number(timeout) - elapsed;
    const rawPct = Math.max(0, Math.min(100, (remain / Number(timeout)) * 100));
    return { remaining: remain, pct: rawPct, expired: remain <= 0 };
  }, [now, timeout, lastAction]);

  useEffect(() => {
    if (expired && onExpire) onExpire();
  }, [expired, onExpire]);

  const color = expired ? "#FF8A7A" : remaining < 60 ? "#FFC46B" : "#E8FE5A";

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-[46px] w-[46px] rounded-full"
        style={{
          background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.07) 0)`,
        }}
      >
        <span className="absolute inset-1 rounded-full bg-surface-clock" />
      </div>
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-mono text-[19px] tabular-nums",
            expired ? "text-loss" : remaining < 60 ? "text-warn" : "text-ink",
          )}
        >
          {formatTime(remaining)}
        </span>
        <span className="text-[11.5px] text-ink-faint">{expired ? labelExpired : label}</span>
      </div>
    </div>
  );
};
