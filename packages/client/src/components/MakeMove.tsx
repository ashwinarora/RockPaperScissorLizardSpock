import { Move, MOVES } from "./utils";

interface IMakeMoveProps {
  setMove: (move: Move | undefined) => void;
  move: Move | undefined;
}

const MakeMove = ({ move, setMove }: IMakeMoveProps) => {
  return (
    <div>
      <h2 className="text-3xl mb-4">Choose your move!</h2>
      <div className="flex gap-x-8">
        {MOVES.map((m) => (
            <button
              key={m}
              onClick={() => {
                if(move !== m) {
                  setMove(m);
                } else {
                  setMove(undefined);
                }
              }}
              className={`p-3 border text-white rounded ${move === m ? 'bg-blue-500' : 'bg-gray-700'}`}
            >
              {m}
            </button>
        ))}
      </div>
    </div>
  );
};

export default MakeMove;
