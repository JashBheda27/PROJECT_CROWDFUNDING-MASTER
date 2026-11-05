import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useActiveWallet } from "thirdweb/react";
import { toast } from "react-toastify";
import { LockKeyhole, Wallet } from "lucide-react";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { logo } from "../assets";
import { navlinks } from "../constants";


const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const wallet = useActiveWallet();
  const [collapsed, setCollapsed] = useState(true);
  const [locked, setLocked] = useState(false);

  const isConnected = Boolean(wallet);

  const connectWallet = async () => {
    try {
      await connect({
        client,
        wallets,
      });
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const handleClick = (link) => {
    if (link.name === "logout") {
      if (wallet) wallet.disconnect();
      navigate("/");
      return;
    }

    const isHome = link.link === "/";

    if (!isHome && !isConnected) {
      toast.info(
        <div>
          <p className="font-semibold">Connect your wallet first</p>
          <p className="mt-1 text-sm">
            Connect your wallet to access this feature.
          </p>
          <button
            onClick={connectWallet}
            className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <span className="inline-flex items-center gap-2">
              <Wallet size={16} />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </span>
          </button>
        </div>,
        { autoClose: 5000 }
      );
      return;
    }

    navigate(link.link);
  };

  return (
    <div className="sticky top-5 flex h-[93vh] flex-col items-center">
      <Link to="/" className="mb-6 flex items-center gap-3">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-gray-200 dark:bg-[#2c2f32]">
          <img src={logo} alt="FundChain" className="h-9 w-9 object-contain" />
        </div>

        {!collapsed && (
          <h1 className="bg-gradient-to-r from-[#4acd8d] to-[#2ebac6] bg-clip-text text-[20px] font-extrabold tracking-wide text-transparent">
            FundChain
          </h1>
        )}
      </Link>

      <div
        onMouseEnter={() => !locked && setCollapsed(false)}
        onMouseLeave={() => !locked && setCollapsed(true)}
        className={`flex h-full flex-col justify-between rounded-[20px] border border-gray-200 bg-gray-100 px-2 py-4 transition-all duration-300 dark:border-[#2c2f32] dark:bg-[#1c1c24] ${
          collapsed ? "w-[76px]" : "w-[220px]"
        }`}
      >
        <div className="flex flex-col gap-4">
          {navlinks
            .filter((link) => link.name !== "logout")
            .map((link) => {
              const isHome = link.link === "/";
              const isLocked = !isHome && !isConnected;
              const isActive = location.pathname === link.link;

              return (
                <button
                  key={link.name}
                  type="button"
                  title={
                    isLocked
                      ? "Connect wallet to access"
                      : link.name
                  }
                  onClick={() => handleClick(link)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200 ${
                    isLocked
                      ? "cursor-not-allowed text-gray-400 opacity-65 dark:text-gray-500"
                      : isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                      : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#2c2f32]"
                  }`}
                >
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      isActive && !isLocked
                        ? "bg-white/20"
                        : "bg-gray-200 dark:bg-[#2c2f32]"
                    }`}
                  >
                    <img
                      src={link.imgUrl}
                      alt=""
                      className={`h-5 w-5 ${
                        isActive && !isLocked ? "invert brightness-0" : ""
                      } ${isLocked ? "opacity-50" : ""}`}
                    />

                    {isLocked && (
                      <LockKeyhole
                        size={13}
                        className="absolute -right-1 -top-1 rounded-full bg-gray-100 text-gray-500 dark:bg-[#1c1c24] dark:text-gray-400"
                      />
                    )}
                  </div>

                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm capitalize">
                        {link.name}
                      </span>
                      {isLocked && (
                        <LockKeyhole size={15} className="shrink-0" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {isConnected && (
            <button
              type="button"
              onClick={() => handleClick({ name: "logout" })}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#2c2f32]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-[#2c2f32]">
                <Wallet size={19} />
              </div>
              {!collapsed && <span className="text-sm">Disconnect</span>}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setLocked(!locked);
              setCollapsed(!collapsed);
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex w-full items-center justify-center rounded-full bg-gray-200 p-2 transition hover:scale-105 dark:bg-[#2c2f32]"
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;