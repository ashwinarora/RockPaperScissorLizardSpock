import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import type { Move } from "../../lib/game";
import { MOVE_META } from "../../lib/moves";

interface MoveTileProps {
  move: Move;
  selected?: boolean;
  onSelect: (move: Move) => void;
  disabled?: boolean;
}

export const MoveTile = ({ move, selected, onSelect, disabled }: MoveTileProps) => {
  const meta = MOVE_META[move];

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(move)}
      whileHover={disabled ? undefined : { y: -7, rotate: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      animate={selected ? { y: -8 } : { y: 0 }}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl3 border px-2.5 py-5 transition-colors duration-150",
        "bg-surface border-hairline-soft",
        selected && "!border-accent !bg-[rgba(232,254,90,0.09)] shadow-accentPop",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      aria-pressed={selected}
      aria-label={move}
    >
      <span className="text-[34px] leading-none">{meta.glyph}</span>
      <span
        className={cn("text-[13px] font-medium tracking-wide", selected ? "text-accent font-bold" : "text-ink-soft")}
      >
        {move}
      </span>
    </motion.button>
  );
};
