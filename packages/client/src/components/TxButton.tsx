import { useState } from "react";

type TButtonStatus = "loading" | "ready" | "success" | "error";

interface ITxButtonProps {
  asyncTask: () => Promise<void | boolean>;
  children: string | string[];
  isLoading?: boolean;
}

const TxButton = ({ asyncTask, children, isLoading }: ITxButtonProps) => {
  const [status, setStatus] = useState<TButtonStatus>("ready");

  return (
    <button
      disabled={status === "loading" || isLoading}
      className={`flex justify-center w-6/12 mt-8 px-5 py-1.5 bg-blue-600 rounded-md text-center text-white text-2xl cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed m-auto`}
      onClick={async () => {
        setStatus("loading");
        try {
          await asyncTask();
          setStatus("success");
        } catch (error) {
          setStatus("error");
        }
      }}
    >
      <div className="mx-auto">{children}</div>
      {status === "loading" && (
        <div className="mr-3 border-4 border-blue-300 rounded-full w-7 h-7 border-t-white animate-spin"></div>
      )}
    </button>
  );
};

export default TxButton;
