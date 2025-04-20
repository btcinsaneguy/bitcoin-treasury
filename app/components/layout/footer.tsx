import React from "react";
import { XIcon } from "../icons/x";

const Footer = () => {
  return (
    <footer className="w-full fixed bottom-0 border-t border-[#1e1e1e] text-white py-2 text-sm sm:text-base">
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-rows">
          Made by{" "}
          <a
            href="https://x.com/nestedSegwit"
            target="_blank"
            className="flex flex-rows hover:underline"
          >
            <XIcon className="mx-1" /> BTC에 미친 사나이
          </a>
          <span className="mx-2 sm:mx-4">|</span>
          <a
            href="https://blockchain.info/"
            target="_blank"
            className="hover:underline"
          >
            Powered by Blockchain.com API
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
