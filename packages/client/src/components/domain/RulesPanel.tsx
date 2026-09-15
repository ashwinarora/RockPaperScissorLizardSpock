import { cn } from "../../lib/cn";
import { MOVES } from "../../lib/game";
import { MOVE_META, VERBS } from "../../lib/moves";

export const RulesPanel = () => (
  <div className="rounded-xl4 border border-hairline-soft bg-surface p-4 animate-fadeup">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px] text-ink-soft">
      {MOVES.flatMap((winner) =>
        MOVE_META[winner].beats.map((loser) => {
          const verb = VERBS[`${winner}>${loser}`] ?? "beats";
          const isNamesake = (winner === "Lizard" && loser === "Spock") || (winner === "Spock" && loser === "Lizard");
          return (
            <div
              key={`${winner}>${loser}`}
              className={cn(
                "flex items-center gap-2 rounded-xl2 px-3 py-2",
                isNamesake && "bg-[rgba(232,254,90,0.08)] text-accent",
              )}
            >
              <span className="text-[16px]">{MOVE_META[winner].glyph}</span>
              <span className="font-medium">{winner}</span>
              <span className={cn("italic", isNamesake ? "text-accent" : "text-ink-faint")}>{verb}</span>
              <span>{loser}</span>
              <span className="text-[16px] ml-auto">{MOVE_META[loser].glyph}</span>
            </div>
          );
        }),
      )}
    </div>
  </div>
);
