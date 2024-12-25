import { useEffect, useState } from "react";

interface ITimeoutProps {
  timeout: bigint;
  lastAction: bigint;
  setTimeover: React.Dispatch<React.SetStateAction<boolean>>;
}

const Timeout = ({ timeout, lastAction, setTimeover }: ITimeoutProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeElapsed = currentTime - Number(lastAction);
      const remainingTime = Number(timeout) - timeElapsed;
      setTimeLeft(remainingTime);
      if (remainingTime <= 0) {
        setTimeover(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeout, lastAction, setTimeover]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className={`text-3xl ${timeLeft < 0 ? "text-red-500" : "text-white"}`}>
      Timeout = {timeLeft < 0 ? "-" : ""}{formatTime(timeLeft)}
    </div>
  );
};

export default Timeout;
