import { Move, MOVES } from "./utils";

interface IMakeMoveProps {
  setMove: (move: Move | undefined) => void;
  move: Move | undefined;
}

const moveImages: Record<Move, string> = {
  Rock: "/assets/rock2.svg",
  Paper: "/assets/paper.svg",
  Scissors: "/assets/scissors.svg",
  Spock: "/assets/spock.svg",
  Lizard: "/assets/lizard.svg",
};

const MakeMove = ({ move, setMove }: IMakeMoveProps) => {
  return (
    <main className="container mx-auto mt-4 md:px-4 py-2 flex justify-center items-center">
      <div className=" rounded-3xl p-8 w-full max-w-4xl text-center">
        <h2 className="text-2xl sm:text-3xl font-bold -mt-10 mb-10 text-slate-100">
          Choose your move!
        </h2>

        {/* Responsive Grid */}
        <div className="flex justify-center gap-6 mb-8">
          {MOVES.map((m) => {
            // const Icon = moveIcons[m]; // Dynamically select the icon
            return (
              <div className="flex flex-col items-center gap-6">
                <button
                  key={m}
                  onClick={() => setMove(move !== m ? m : undefined)}
                  className={`w-28 h-28 rounded-full bg-gradient-to-r from-[#1766FE] to-[#089AFB] 
                  border-8 border-[#2563EB] flex items-center justify-center transition-all 
                  ${move === m ? "shadow-[0_0_15px_#1766FE]" : ""}`}
                >
                  {/* Image */}
                  <img
                    src={moveImages[m]}
                    alt={m}
                    className={`w-12 h-12 sm:w-16 sm:h-16 object-contain 
                      ${move === m ? "filter brightness-0 invert" : ""}`}
                  />
                </button>
                <span
                  className={`text-xs sm:text-xl font-semibold ${move === m ? "text-[#089BFB]" : "text-white"}`}
                >
                  {m}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default MakeMove;
