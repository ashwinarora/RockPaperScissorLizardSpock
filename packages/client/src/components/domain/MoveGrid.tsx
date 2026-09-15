import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { MOVES, type Move } from "../../lib/game";
import { MOVE_META } from "../../lib/moves";
import { MoveTile } from "./MoveTile";
import { RulesPanel } from "./RulesPanel";

interface MoveGridProps {
  move: Move | undefined;
  onSelect: (move: Move | undefined) => void;
  disabled?: boolean;
}

export const MoveGrid = ({ move, onSelect, disabled }: MoveGridProps) => {
  const [showRules, setShowRules] = useState(false);

  const legend = move ? (
    <span>
      Beats <span className="text-accent font-medium">{MOVE_META[move].beats.join(" and ")}</span>
    </span>
  ) : (
    <span>Pick your move — five moves, ten ways to win.</span>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        {MOVES.map((m) => (
          <MoveTile
            key={m}
            move={m}
            selected={move === m}
            disabled={disabled}
            onSelect={(next) => onSelect(next === move ? undefined : next)}
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-1 text-[13px] text-ink-faint">
        <div>{legend}</div>
        <button
          type="button"
          onClick={() => setShowRules((v) => !v)}
          className="inline-flex items-center gap-1 text-ink-soft hover:text-ink transition-colors"
        >
          Rules
          {showRules ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {showRules && <RulesPanel />}
    </div>
  );
};
