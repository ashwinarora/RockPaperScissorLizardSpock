import { FaGithub, FaLinkedin } from "react-icons/fa";
const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full flex justify-between items-center p-4 bg-[#0A193A] text-white mt-10">
      <div className="flex gap-4 justify-center">
        <p> Developed by</p>
        <a
          href="https://www.ashwinarora.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/assets/fav.png" className="w-8 h-8" alt="" />
        </a>
      </div>

      <div className="flex gap-4">
        <a
          href="https://github.com/ashwinarora/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center text-xl gap-2 items-center"
        >
          <span>
            <FaGithub />
          </span>{" "}
          <p>GitHub</p>
        </a>
        <a
          href="https://www.linkedin.com/in/ashwin-arora/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center text-xl gap-2 items-center"
        >
          <span>
            <FaLinkedin />
          </span>{" "}
          <p>LinkedIn</p>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
