import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { formatEther } from "viem";
import { useActiveAccount } from "thirdweb/react";
import { useStateContext } from "../context";
import { calculateBarPercentage, daysLeft } from "../utils";
import { thirdweb } from "../assets";
import { useEthPrice } from "../context/EthPriceContext";
import { readContract } from "thirdweb";
import { prepareContractCall } from "thirdweb";
import { useSendTransaction , useActiveWalletChain} from "thirdweb/react";
import { toast } from "react-toastify";

const CampaignDetails = () => {
  const { id } = useParams();
  const { state } = useLocation();

  const pId = Number(id);

  const { mutateAsync: sendTx } = useSendTransaction();

  const { donate, getDonations, contract, account, closeCampaign, refund } = useStateContext();

  const { ethPriceUSD, ethPriceINR } = useEthPrice();

  const activeAccount = useActiveAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [donators, setDonators] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState(null);

  const activeChain = useActiveWalletChain();
  const chainId = activeChain?.id;

  const usdValue =
    amount && ethPriceUSD
      ? (Number(amount) * ethPriceUSD).toFixed(2)
      : "0.00";

  const inrValue =
    amount && ethPriceINR
      ? (Number(amount) * ethPriceINR).toLocaleString("en-IN")
      : "0";

  const target = BigInt(campaign?.target || 0);
  const raised = BigInt(campaign?.amountCollected || 0);

  const formattedTarget = formatEther(target);
  const formattedRaised = formatEther(raised);

  const contractStatus = campaign?.status;

  const isOwner =
    activeAccount?.address?.toLowerCase() ===
    campaign?.owner?.toLowerCase();

  const remainingDays =
    contractStatus === 0 ? daysLeft(Number(campaign?.deadline)) : 0;

  /* STATUS LOGIC */
  const getStatusInfo = () => {
    if (contractStatus === 1)
      return { text: "Successful", color: "bg-blue-500" };

    if (contractStatus === 0)
      return { text: "Active", color: "bg-green-500" };

    return { text: "Closed", color: "bg-gray-500" };
  };

  const statusInfo = getStatusInfo();

  /* ---------------------------------- */
  /* FETCH DONATIONS                    */
  /* ---------------------------------- */

  const fetchDonators = async () => {
    const data = await getDonations(pId);
    setDonators(data);
  };


  const fetchCampaign = async () => {
    if (!contract || isNaN(pId)) return;

    try {
      const campaigns = await readContract({
        contract,
        method:
          "function getCampaigns() view returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, uint256 withdrawnAmount, string image, string category, uint8 status)[])",
      });

      console.log("Campaigns:", campaigns);

      if (!campaigns || campaigns.length === 0) {
        toast.error("No campaigns found on this network");
        return;
      }

      const campaignData = campaigns[pId];

      if (!campaignData) {
        setError("Invalid campaign ID");
        return;
      }

      setCampaign(campaignData);

    } catch (err) {
      console.error("Fetch failed:", err);
      toast.error("Failed to fetch campaign");
    }
  };

  useEffect(() => {
    console.log("pId:", pId);
    console.log("contract:", contract);

    if (!contract) return;
    if (isNaN(pId)) return;

    fetchCampaign();
    fetchDonators();

  }, [contract, pId]);



  /* ---------------------------------- */
  /* DONATE                             */
  /* ---------------------------------- */

  const handleDonate = async () => {
    if (isLoading) return;

    if (!amount || Number(amount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    try {
      setIsLoading(true);
      await donate(pId, amount);
      toast.success("Donation successful 🎉");
      await fetchCampaign();
      await fetchDonators();
    } catch (err) {
      console.log(err);
      toast.error(err?.reason || err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------- */
  /* WITHDRAW (OWNER)                   */
  /* ---------------------------------- */

  const handlePayout = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      const tx = prepareContractCall({
        contract,
        method: "function payout(uint256 _id)",
        params: [pId],
      });

      await sendTx(tx);

      toast.success("Funds Withdrawn Successfully 🎉");

      await fetchCampaign();
      await fetchDonators();
    } catch (err) {
      console.log(err);

      if (err?.message?.includes("No donation")) {
        toast.error("Already withdrawn or no funds ❌");
      } else {
        toast.error("Withdraw failed ❌");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------- */
  /* CLOSE CAMPAIGN                     */
  /* ---------------------------------- */

  const handleClose = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      await closeCampaign(pId);
      toast.success("Campaign Closed Successfully 🚫");
      await fetchCampaign();
    } catch (err) {
      console.log(err);
      toast.error(err?.reason || err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------- */
  /* REFUND                             */
  /* ---------------------------------- */

  const handleRefund = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      const tx = prepareContractCall({
        contract,
        method: "function refund(uint256 _id)",
        params: [pId],
      });

      await sendTx(tx);
      
      const contractAddress = contract?.address;
      const storageKey = `refundHistory_${chainId}_${contractAddress}`;

      // get existing
      const existing = JSON.parse(localStorage.getItem(storageKey)) || {};

      // find user donation
      const userDonation = donators.find(
        (d) =>
          d.donator?.toLowerCase() ===
          activeAccount?.address?.toLowerCase()
      );

      if (userDonation) {
        const alreadyRefunded = (existing[pId] || []).some(
          (r) =>
            r.user?.toLowerCase() ===
            activeAccount?.address?.toLowerCase()
        );

        if (!alreadyRefunded) {
          const updatedHistory = {
            ...existing,
            [pId]: [
              ...(existing[pId] || []),
              {
                user: activeAccount.address,
                amount: userDonation.donation,
                time: new Date().toLocaleString(),
              },
            ],
          };

          localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
        }
      }

      toast.success("Refund claimed successfully 💸");

      await fetchCampaign();
      await fetchDonators();
    } catch (err) {
      console.log(err);

      if (err?.message?.includes("No donation")) {
        toast.error("Already refunded or no donation ❌");
      } else {
        toast.error("Refund failed ❌");
      }
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
              src={state?.image || "/placeholder.png"}
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
              className={`h-2 rounded-full ${contractStatus === 0
                ? "bg-green-500"
                : contractStatus === 1
                  ? "bg-blue-500"
                  : "bg-red-500"
                }`}
              style={{
                width: `${campaign
                  ? calculateBarPercentage(target, raised)
                  : 0
                  }%`,
              }}
            />
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4">

            <div className="bg-white dark:bg-[#1c1c24] p-4 rounded-xl shadow text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {campaign ? remainingDays : 0}
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
                {donators?.length || 0}
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
                {campaign?.owner}
              </p>

            </div>
          </div>

          {/* STORY */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Story
            </h3>

            <p className="text-gray-600 dark:text-gray-400 leading-7">
              {state?.description || "No description available"}
            </p>
          </div>

          {/* DONATORS */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Donation History
            </h3>

            {donators?.length > 0 ? (
              <div className="space-y-2">
                {donators?.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 rounded-lg bg-white dark:bg-[#1c1c24] shadow"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {item.donator.slice(0, 6)}...
                      {item.donator.slice(-4)}
                    </p>

                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      Donated {
                        Number(item.amount) > 1000000
                          ? Number(formatEther(BigInt(item.donation))).toFixed(4)
                          : Number(item.donation || 0).toFixed(4)
                      } ETH
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

            {contractStatus === 0 && (
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

            <div className="w-full py-3 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center font-medium">
              Campaign is {statusInfo.text}
            </div>

            {/* CLOSE BUTTON */}
            {isOwner && contractStatus === 0 && (
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
              >
                Close Campaign
              </button>
            )}

            {/* WITHDRAW BUTTON */}
            {isOwner && contractStatus === 1 && (
              <button
                onClick={handlePayout}
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition"
              >
                Withdraw Funds
              </button>
            )}

            {/* REFUND BUTTON */}
            {!isOwner && contractStatus === 2 &&
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