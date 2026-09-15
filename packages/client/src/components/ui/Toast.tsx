import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const AppToastContainer = () => (
  <ToastContainer
    position="top-right"
    autoClose={5000}
    hideProgressBar
    newestOnTop
    closeOnClick={false}
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="dark"
    transition={Slide}
    toastClassName="!bg-[#1A1216] !border !border-[rgba(255,138,122,0.35)] !rounded-xl2 !text-loss-hi !font-body !text-[13px]"
  />
);
