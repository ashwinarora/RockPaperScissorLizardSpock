const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full flex justify-between items-center p-4 bg-[#0A193A] text-white mt-10">
      <div className="flex gap-4 justify-center">
        <p> Developed by</p>
        <img src="/assets/fav.png" className="w-8 h-8" alt="" />
      </div>
      <div className="flex gap-4">
        <a
          href="https://github.com/ashwinarora/"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/ashwin-arora/"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  );
};

export default Footer;
