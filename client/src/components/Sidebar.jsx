import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useActiveWallet } from "thirdweb/react";
import { logo } from '../assets';
import { navlinks } from '../constants';
import { useLocation } from "react-router-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";

const Sidebar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [locked, setLocked] = useState(false);
  const wallet = useActiveWallet();
  const location = useLocation();



  const handleClick = (link) => {
    if (link.name === "logout") {
      if (wallet) wallet.disconnect();
      navigate("/");
      return;
    }

    navigate(link.link);
  };

  return (
    <div className="flex flex-col items-center sticky top-5 h-[93vh]">

      {/* LOGO */}
      <Link to="/" className="mb-6 flex items-center gap-3">

        <div className="w-[44px] h-[44px] rounded-[50px] bg-gray-200 dark:bg-[#2c2f32] flex items-center justify-center">
          <img src={logo} alt="FundChain" className="w-9 h-9 object-contain" />
        </div>

        {!collapsed && (
          <h1 className="font-extrabold text-[20px] bg-gradient-to-r from-[#4acd8d] to-[#2ebac6] bg-clip-text text-transparent tracking-wide">
            FundChain
          </h1>
        )}

      </Link>

      {/* SIDEBAR */}
      <div
        onMouseEnter={() => !locked && setCollapsed(false)}
        onMouseLeave={() => !locked && setCollapsed(true)}
        className={
          `flex flex-col justify-between
        ${collapsed ? "w-[76px]" : "w-[200px]"}
        h-full
        bg-gray-100 dark:bg-[#1c1c24]
        border border-gray-200 dark:border-[#2c2f32]
        rounded-[20px] py-4 px-2
        transition-all duration-300`}>

        {/* 🔝 NAV ITEMS */}
        <div className="flex flex-col gap-4">
          {navlinks
            .filter(link => link.name !== "logout")
            .map((link) => (
              <div
                key={link.name}
                onClick={() => handleClick(link)}
                className={`
          flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer
          transition-all duration-200
          ${location.pathname === link.link
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2c2f32]"}`}
              >

                {/* 🔥 ICON CIRCLE */}
                <div className={`
          w-10 h-10 flex items-center justify-center rounded-full
          transition-all duration-300
          ${location.pathname === link.link

                    ? "bg-white/20"
                    : "bg-gray-200 dark:bg-[#2c2f32]"
                  }`}>
                  <img
                    src={link.imgUrl}
                    className={`w-5 h-5 ${location.pathname === link.link ? "invert brightness-0" : ""
                      }`}
                  />
                </div>

                {/* TEXT */}
                {!collapsed && (
                  <span className="text-sm capitalize">
                    {link.name}
                  </span>
                )}
              </div>
            ))}
        </div>

        {/* 🔻 BOTTOM SECTION */}
        <div className="flex flex-col gap-3 mt-4">

          {/* LOGOUT */}
          {navlinks
            .filter(link => link.name === "logout")
            .map((link) => (
              <div
                key={link.name}
                onClick={() => handleClick(link)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2c2f32]"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-[#2c2f32]">
                  <img src={link.imgUrl} className="w-5 h-5" />
                </div>
                {!collapsed && <span className="text-sm">Logout</span>}
              </div>
            ))}

          {/* COLLAPSE BUTTON */}
          <button
            onClick={() => {
              setLocked(!locked); setCollapsed(!collapsed);
            }}
            className="flex items-center justify-center w-full p-2 rounded-full bg-gray-200 dark:bg-[#2c2f32] hover:scale-105 transition">
            {collapsed ? (
              <FaChevronRight className={locked ? "text-indigo-500" : ""} />
            ) : (
              <FaChevronLeft className={locked ? "text-indigo-500" : ""} />
            )}
          </button>

        </div>

      </div>
    </div>
  );
};

export default Sidebar;