import { IoHandRightOutline } from "react-icons/io5";
import { RiFilePaper2Line } from "react-icons/ri";
import { AiOutlineScissor } from "react-icons/ai";
import { LiaHandSpock } from "react-icons/lia";
import { FaRegHandLizard } from "react-icons/fa";

import { Move, MOVES } from "./utils";

interface IMakeMoveProps {
  setMove: (move: Move | undefined) => void;
  move: Move | undefined;
}

// Mapping each move to its corresponding icon
const moveIcons = {
  Rock: IoHandRightOutline,
  Paper: RiFilePaper2Line,
  Scissors: AiOutlineScissor,
  Spock: LiaHandSpock,
  Lizard: FaRegHandLizard,
};

const MakeMove = ({ move, setMove }: IMakeMoveProps) => {
  return (
    // <div>
    //   <h2 className="text-3xl mb-4 text-white text-center">
    //     Choose your move!
    //   </h2>
    //   <div className="flex gap-6 justify-center flex-wrap">
    //     {MOVES.map((m) => {
    //       const Icon = moveIcons[m]; // Dynamically select the icon
    //       return (
    //         <button
    //           key={m}
    //           onClick={() => setMove(move !== m ? m : undefined)}
    //           className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-transform hover:scale-110 ${
    //             move === m
    //               ? "bg-blue-600 text-white border-blue-400"
    //               : "bg-gray-700 text-gray-300 border-gray-600"
    //           }`}
    //         >
    //           <Icon className="w-8 h-8" />
    //           <span>{m}</span>
    //         </button>
    //       );
    //     })}
    //   </div>
    // </div>
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8 text-slate-100">
          Choose your move!
        </h2>

        <div className="grid grid-cols-5 gap-4 mb-8">
          {MOVES.map((m) => {
            const Icon = moveIcons[m]; // Dynamically select the icon
            return (
              <button
                key={m}
                onClick={() => setMove(move !== m ? m : undefined)}
                className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-transform hover:scale-110 ${
                  move === m
                    ? "bg-blue-600 text-white border-blue-400"
                    : "bg-white text-gray-900 border-gray-600"
                }`}
              >
                <Icon className="w-8 h-8" />
                <span>{m}</span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default MakeMove;
