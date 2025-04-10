import React from "react";
import { Goose } from "../icons/goose";

const Footer = () => {
  return (
    <footer className="w-full fixed bottom-0 border-t border-[#1e1e1e] text-white py-2 text-sm sm:text-base">
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-rows">
          Made with{" "}
          <a
            href="https://block.github.io/goose/"
            target="_blank"
            className="flex flex-rows hover:underline"
          >
            <Goose className="mx-1" /> codename goose
          </a>
          <span className="mx-2 sm:mx-4">|</span>
          <a
            href="https://github.com/block/bitcoin-treasury/blob/main/DISCLAIMER.md"
            target="_blank"
            className="hover:underline"
          >
            Disclaimer
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
