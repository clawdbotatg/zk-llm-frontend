import React from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";

/**
 * Site footer
 */
export const Footer = () => {
  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="flex flex-col md:flex-row gap-2 pointer-events-auto">
          </div>
          <SwitchTheme className="pointer-events-auto" />
        </div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <div className="flex justify-center items-center gap-1">
              <span>Built with</span>
              <HeartIcon className="inline-block h-4 w-4" />
            </div>
            <span>·</span>
            <div className="text-center">
              <a href="https://zkllmapi.com" target="_blank" rel="noreferrer" className="link">
                zkllmapi.com
              </a>
            </div>
            <span>·</span>
            <div className="text-center">
              <a href="https://github.com/clawdbotatg/zk-api-credits" target="_blank" rel="noreferrer" className="link">
                View on GitHub
              </a>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};
