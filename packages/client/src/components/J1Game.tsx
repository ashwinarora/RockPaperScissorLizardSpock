import { Dispatch, SetStateAction } from "react";
import { gameState } from "../App";

interface IJ1GameProps {
  game: gameState;
  setGame: Dispatch<SetStateAction<gameState>>;
}

const J1Game = ({game, setGame}: IJ1GameProps) => {
  return <div>J1Game</div>;
};

export default J1Game;
