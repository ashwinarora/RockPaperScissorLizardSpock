import { cn } from "../../lib/cn";

interface WordmarkProps {
  size?: "sm" | "lg";
  className?: string;
}

export const Wordmark = ({ size = "sm", className }: WordmarkProps) => {
  if (size === "sm") {
    return (
      <span
        className={cn(
          "font-display font-extrabold uppercase text-[13px] tracking-[0.11em] whitespace-nowrap text-ink",
          className,
        )}
      >
        Lizard <span className="text-accent">Poisons</span> Spock
      </span>
    );
  }

  return (
    <h1
      className={cn(
        "font-display font-extrabold uppercase leading-[0.82] w-fit flex flex-col items-start text-ink",
        className,
      )}
      style={{ fontSize: "clamp(44px, 11.5vw, 84px)" }}
    >
      <span style={{ letterSpacing: "0.083em" }}>Lizard</span>
      <span className="text-accent" style={{ letterSpacing: "-0.062em" }}>
        Poisons
      </span>
      <span style={{ letterSpacing: "0.113em" }}>Spock</span>
    </h1>
  );
};
