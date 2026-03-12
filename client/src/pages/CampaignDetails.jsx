import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatEther } from "viem";
import { useActiveAccount } from "thirdweb/react";
import { getContract } from "../utils/etherscontract";
import { useStateContext } from "../context";
import { calculateBarPercentage, daysLeft } from "../utils";
import { thirdweb } from "../assets";
import { useEthPrice } from "../context/EthPriceContext";

const CampaignDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { donate, getDonations, contract, account, closeCampaign, refund } =
    useStateContext();

  const { ethPriceUSD, ethPriceINR } = useEthPrice();  

  const activeAccount = useActiveAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [donators, setDonators] = useState([]);

   const usdValue =
    amount && ethPriceUSD
      ? (Number(amount) * ethPriceUSD).toFixed(2)
      : "0.00";

  const inrValue =
    amount && ethPriceINR
      ? (Number(amount) * ethPriceINR).toLocaleString("en-IN")
      : "0";

  if (!state) {
    return (
      <div className="text-center mt-10 text-gray-600">
        Invalid Campaign
      </div>
    );
  }

  const formattedTarget = formatEther(BigInt(state.target || 0));
  const formattedRaised = formatEther(BigInt(state.amountCollected || 0));

  const target = BigInt(state.target || 0);
  const raised = BigInt(state.amountCollected || 0);

  const isOwner =
    activeAccount?.address?.toLowerCase() === state?.owner?.toLowerCase();

  const remainingDays = state.status === 0 ? daysLeft(state.deadline) : 0;

  /* ---------------------------------- */
  /* STATUS LOGIC (FIXED)               */
  /* ---------------------------------- */

  const getStatusInfo = () => {
    const now = Date.now() / 1000;

    // SUCCESSFUL if goal reached
    if (raised >= target) {
      return { text: "Successful", color: "bg-blue-500" };
    }

    // ACTIVE if deadline not reached
    if (state.status === 0 && state.deadline > now) {
      return { text: "Active", color: "bg-green-500" };
    }

    // CLOSED if deadline passed without reaching goal
    if (state.deadline <= now || state.status === 1) {
      return { text: "Closed", color: "bg-gray-500" };
    }

    return { text: "Closed", color: "bg-gray-500" };
  };

  const statusInfo = getStatusInfo();

  /* ---------------------------------- */
  /* FETCH DONATIONS                    */
  /* ---------------------------------- */

  const fetchDonators = async () => {
    const data = await getDonations(state.pId);
    setDonators(data);
  };

  useEffect(() => {
    if (contract) fetchDonators();
  }, [contract, account]);

  /* ---------------------------------- */
  /* DONATE                             */
  /* ---------------------------------- */

  const handleDonate = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      setIsLoading(true);
      await donate(state.pId, amount);
      navigate("/");
    } catch (err) {
      console.error("Donation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------- */
  /* WITHDRAW (OWNER)                   */
  /* ---------------------------------- */

  const handlePayout = async () => {
    try {
      setIsLoading(true);

      const contract = await getContract();
      const tx = await contract.payout(state.pId);

      await tx.wait();

      alert("Funds Withdrawn Successfully 🎉");
      navigate("/");
    } catch (err) {
      console.error("Payout failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------- */
  /* CLOSE CAMPAIGN                     */
  /* ---------------------------------- */

  const handleClose = async () => {
    try {
      setIsLoading(true);

      await closeCampaign(state.pId);

      alert("Campaign Closed");
      navigate("/");
    } catch (err) {
      console.error("Close failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------- */
  /* REFUND                             */
  /* ---------------------------------- */

  const handleRefund = async () => {
    try {
      setIsLoading(true);

      await refund(state.pId);

      alert("Refund claimed successfully 💸");
      navigate("/");
    } catch (err) {
      console.error("Refund failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-10 py-6 bg-gray-50 dark:bg-[#0f0f12] min-h-screen transition-colors">

      <div className="flex flex-col lg:flex-row gap-8">

        {/* LEFT SIDE */}
        <div className="flex-1 space-y-6">

          {/* IMAGE */}
          <div className="relative">
            <img
              src={state.image}
              alt="campaign"
              className="w-full h-[400px] object-cover rounded-2xl shadow-md"
            />

            <div
              className={`absolute top-4 right-4 px-3 py-1 text-xs font-semibold text-white rounded-full ${statusInfo.color}`}
            >
              {statusInfo.text}
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                statusInfo.text === "Active"
                  ? "bg-green-500"
                  : statusInfo.text === "Successful"
                  ? "bg-blue-500"
                  : "bg-red-500"
              }`}
              style={{
                width: `${calculateBarPercentage(
                  state.target,
                  state.amountCollected
                )}%`,
              }}
            />
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4">

            <div className="bg-white dark:bg-[#1c1c24] p-4 rounded-xl shadow text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {remainingDays}
              </p>
              <p className="text-sm text-gray-500">Days Left</p>
            </div>

            <div className="bg-white dark:bg-[#1c1c24] p-4 rounded-xl shadow text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {formattedRaised} ETH
              </p>
              <p className="text-sm text-gray-500">
                of {formattedTarget} ETH
              </p>
            </div>

            <div className="bg-white dark:bg-[#1c1c24] p-4 rounded-xl shadow text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {donators.length}
              </p>
              <p className="text-sm text-gray-500">Backers</p>
            </div>

          </div>

          {/* CREATOR */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Creator
            </h3>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#1c1c24] shadow">

              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <img src={thirdweb} className="w-6 h-6" alt="icon" />
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                {state.owner}
              </p>

            </div>
          </div>

          {/* STORY */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Story
            </h3>

            <p className="text-gray-600 dark:text-gray-400 leading-7">
              {state.description}
            </p>
          </div>

          {/* DONATORS */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Donation History
            </h3>

            {donators.length > 0 ? (
              <div className="space-y-2">
                {donators.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 rounded-lg bg-white dark:bg-[#1c1c24] shadow"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {item.donator.slice(0, 6)}...
                      {item.donator.slice(-4)}
                    </p>

                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                    Donated {parseFloat(item.donation).toFixed(4)} ETH
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No donations yet</p>
            )}

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-[350px]">

          <div className="bg-white dark:bg-[#1c1c24] p-5 rounded-2xl shadow-lg space-y-4">

            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Fund Campaign
            </h3>

            {statusInfo.text === "Active" && (
              <>
                <input
                  type="number"
                  placeholder="Enter ETH (e.g. 0.1)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-transparent text-gray-800 dark:text-white focus:outline-none"
                />
                 {/* ADDED BOX */}
                {amount && (
                  <div className="w-full p-3 rounded-lg bg-gray-100 dark:bg-[#2a2a33] text-sm text-green-500 dark:text-green-400">
                    ≈ ${usdValue} USD | ₹{inrValue} INR
                  </div>
                )}

                <button
                  onClick={handleDonate}
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
                >
                  {isLoading ? "Processing..." : "Fund Campaign"}
                </button>
              </>
            )}

            {statusInfo.text !== "Active" && (
              <div className="w-full py-3 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center font-medium">
                Campaign is {statusInfo.text}
              </div>
            )}

            {/* CLOSE BUTTON */}
            {isOwner && statusInfo.text === "Active" && (
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
              >
                Close Campaign
              </button>
            )}

            {/* WITHDRAW BUTTON */}
            {isOwner && statusInfo.text === "Successful" && (
              <button
                onClick={handlePayout}
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition"
              >
                Withdraw Funds
              </button>
            )}

            {/* REFUND BUTTON */}
            {!isOwner &&
              statusInfo.text === "Closed" &&
              raised < target && (
                <button
                  onClick={handleRefund}
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition"
                >
                  Claim Refund
                </button>
              )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default CampaignDetails;