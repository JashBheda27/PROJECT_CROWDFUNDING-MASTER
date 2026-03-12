import React, { useState, useEffect, useRef } from "react";
import { useActiveAccount } from "thirdweb/react";
import { formatEther } from "viem";
import { useEthPrice } from "../context/EthPriceContext";

const WalletDropdown = () => {
  const account = useActiveAccount();
  const { ethPriceUSD, ethPriceINR } = useEthPrice();

  const [balance, setBalance] = useState("0");
  const [network, setNetwork] = useState("");
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  // USD conversion
  const usdValue = (Number(balance) * ethPriceUSD).toFixed(2);
  const inrValue = (Number(balance) * ethPriceINR).toFixed(0);

  const getBalance = async () => {
    if (!account || !window.ethereum) return;

    const bal = await window.ethereum.request({
      method: "eth_getBalance",
      params: [account.address, "latest"],
    });

    const eth = formatEther(BigInt(bal));
    setBalance(eth);
  };

  const getNetwork = async () => {
    if (!window.ethereum) return;

    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    const networks = {
      "0x539": "Hardhat",
      "0x7a69": "Hardhat",
      "0xaa36a7": "Sepolia",
      "0x1": "Ethereum",
      "0x5": "Goerli",
    };

    setNetwork(networks[chainId] || `Chain ${parseInt(chainId, 16)}`);
  };

  useEffect(() => {
    getBalance();
    getNetwork();
  }, [account]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account.address);
    } catch (err) {
      console.log(err);
    }
  };

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!account) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Wallet Button */}
      <button
        onClick={() => setOpen(!open)}
        className="px-4 h-[52px] rounded-full bg-gray-200 dark:bg-[#2c2f32] flex items-center gap-2"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>

        <p className="text-sm font-semibold text-gray-800 dark:text-white">
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </p>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[260px] bg-white dark:bg-[#1c1c24] rounded-xl shadow-lg p-4 z-50">
          
          {/* Connected status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <p className="text-sm text-gray-700 dark:text-white">
                Connected
              </p>
            </div>

            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-[#2c2c34] dark:text-green-400 rounded">
              {network}
            </span>
          </div>

          {/* Wallet */}
          <div className="mb-3">
            <p className="text-xs text-gray-500">Wallet</p>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold break-all text-gray-800 dark:text-white">
                {account.address}
              </p>

              <button
                onClick={copyAddress}
                className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2c2c34]"
                title="Copy Address"
              >
                📋
              </button>
            </div>
          </div>

          {/* Balance */}
          <div>
            <p className="text-xs text-gray-500">Balance</p>

            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              {Number(balance).toFixed(4)} ETH
            </p>

            <p className="text-xs text-green-700  dark:text-green-400">
              ≈ ${usdValue} USD | ₹ {inrValue} INR
            </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default WalletDropdown;