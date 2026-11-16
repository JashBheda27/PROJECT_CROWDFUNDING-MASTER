import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { formatEther } from "viem";
import { readContract, prepareContractCall } from "thirdweb";
import {
  useActiveAccount,
  useActiveWalletChain,
  useSendTransaction,
} from "thirdweb/react";

import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Heart,
  Info,
  Link2,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
  Users,
  Coins,
  Activity,
} from "lucide-react";

import { toast } from "react-toastify";

import { useStateContext } from "../context";
import { useEthPrice } from "../context/EthPriceContext";
import { thirdweb } from "../assets";


const CampaignDetails = () => {

  const { id } = useParams();

  const pId = Number(id);

  const { mutateAsync: sendTx } = useSendTransaction();

  const {
    donate,
    getDonations,
    contract,
    closeCampaign,
  } = useStateContext();

  const { ethPriceUSD, ethPriceINR } = useEthPrice();

  const activeAccount = useActiveAccount();
  const activeChain = useActiveWalletChain();

  const chainId = activeChain?.id;

  const [campaign, setCampaign] = useState(null);
  const [donators, setDonators] = useState([]);

  const [amount, setAmount] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [error, setError] = useState(null);

  const [copied, setCopied] = useState(false);


  // ----------------------------------
  // CAMPAIGN VALUES
  // ----------------------------------

  const target = BigInt(campaign?.target || 0);
  const raised = BigInt(campaign?.amountCollected || 0);

  const withdrawn = BigInt(campaign?.withdrawnAmount || 0);

  const formattedTarget = Number(formatEther(target));
  const formattedRaised = Number(formatEther(raised));
  const formattedWithdrawn = Number(formatEther(withdrawn));

  const remainingAmount =
    raised >= target
      ? 0
      : Number(formatEther(target - raised));

  const progressPercentage =
    target > 0n
      ? Math.min(
        100,
        Number((raised * 10000n) / target) / 100
      )
      : 0;


  // ----------------------------------
  // DATE AND STATUS
  // ----------------------------------

  const deadline = Number(campaign?.deadline || 0);

  const now = Math.floor(Date.now() / 1000);

  const isExpired = deadline > 0 && now >= deadline;

  const targetReached = target > 0n && raised >= target;

  const remainingDays = Math.max(
    0,
    Math.ceil((deadline - now) / 86400)
  );

  const contractStatus = Number(campaign?.status ?? 0);

  const effectiveStatus =
    contractStatus === 0 && isExpired
      ? targetReached
        ? 1
        : 3
      : contractStatus;


  const statusInfo = useMemo(() => {

    switch (effectiveStatus) {

      case 1:
        return {
          text: "Successful",
          color: "bg-blue-500",
          light: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
          description: "This campaign successfully reached its funding goal.",
        };

      case 2:
        return {
          text: "Closed",
          color: "bg-gray-500",
          light: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400",
          description: "This campaign has been closed by its creator.",
        };

      case 3:
        return {
          text: "Ended",
          color: "bg-red-500",
          light: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
          description: "The campaign deadline has passed.",
        };

      default:
        return {
          text: "Active",
          color: "bg-green-500",
          light: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
          description: "This campaign is currently accepting donations.",
        };

    }

  }, [effectiveStatus]);


  const isOwner =
    activeAccount?.address?.toLowerCase() ===
    campaign?.owner?.toLowerCase();


  const canDonate =
    effectiveStatus === 0 &&
    !isExpired &&
    !targetReached;


  // ----------------------------------
  // CURRENCY CONVERSION
  // ----------------------------------

  const numericAmount = Number(amount);

  const usdValue =
    numericAmount > 0 && ethPriceUSD
      ? (numericAmount * ethPriceUSD).toFixed(2)
      : "0.00";

  const inrValue =
    numericAmount > 0 && ethPriceINR
      ? (numericAmount * ethPriceINR).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })
      : "0.00";


  const raisedUSD =
    ethPriceUSD
      ? (formattedRaised * ethPriceUSD).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      })
      : null;

  const raisedINR =
    ethPriceINR
      ? (formattedRaised * ethPriceINR).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      })
      : null;


  // ----------------------------------
  // FETCH CAMPAIGN
  // ----------------------------------

  const fetchCampaign = async () => {

    if (!contract || isNaN(pId)) return;

    try {

      setError(null);

      const campaigns = await readContract({
        contract,

        method:
          "function getCampaigns() view returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, uint256 withdrawnAmount, string image, string category, uint8 status)[])",
      });

      const campaignData = campaigns[pId];

      if (!campaignData) {

        setError("Campaign not found on this network.");

        setCampaign(null);

        return;
      }

      setCampaign(campaignData);

    } catch (err) {

      console.error("Campaign fetch failed:", err);

      setError("Unable to load campaign details.");

      toast.error("Failed to fetch campaign.");

    }

  };


  // ----------------------------------
  // FETCH DONATIONS
  // ----------------------------------

  const fetchDonators = async () => {

    if (!contract) return;

    try {

      const data = await getDonations(pId);

      setDonators(Array.isArray(data) ? data : []);

    } catch (err) {

      console.error("Donation fetch failed:", err);

      setDonators([]);

    }

  };


  useEffect(() => {

    if (!contract || isNaN(pId) || pId < 0) return;

    const loadData = async () => {

      setIsFetching(true);

      await Promise.all([
        fetchCampaign(),
        fetchDonators(),
      ]);

      setIsFetching(false);

    };

    loadData();

  }, [contract, pId]);


  // ----------------------------------
  // REFRESH DATA
  // ----------------------------------

  const refreshData = async () => {

    await Promise.all([
      fetchCampaign(),
      fetchDonators(),
    ]);

  };


  // ----------------------------------
  // COPY WALLET ADDRESS
  // ----------------------------------

  const copyAddress = async (address) => {

    if (!address) return;

    try {

      await navigator.clipboard.writeText(address);

      setCopied(true);

      toast.success("Wallet address copied!");

      setTimeout(() => setCopied(false), 2000);

    } catch {

      toast.error("Unable to copy address.");

    }

  };


  // ----------------------------------
  // DONATE
  // ----------------------------------

  const handleDonate = async () => {

    if (isLoading) return;

    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {

      toast.error("Please enter a valid donation amount.");

      return;

    }

    if (!canDonate) {

      toast.error("This campaign is not accepting donations.");

      return;

    }

    try {

      setIsLoading(true);

      await donate(pId, amount);

      toast.success("Donation successful! 🎉");

      setAmount("");

      await refreshData();

    } catch (err) {

      console.error(err);

      toast.error(
        err?.reason ||
        err?.shortMessage ||
        err?.message ||
        "Donation failed."
      );

    } finally {

      setIsLoading(false);

    }

  };


  // ----------------------------------
  // WITHDRAW FUNDS
  // ----------------------------------

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

      toast.success("Funds withdrawn successfully!");

      await refreshData();

    } catch (err) {

      console.error(err);

      toast.error(
        err?.reason ||
        err?.shortMessage ||
        "Withdrawal failed."
      );

    } finally {

      setIsLoading(false);

    }

  };


  // ----------------------------------
  // CLOSE CAMPAIGN
  // ----------------------------------

  const handleClose = async () => {

    if (isLoading) return;

    try {

      setIsLoading(true);

      await closeCampaign(pId);

      toast.success("Campaign closed successfully!");

      await refreshData();

    } catch (err) {

      console.error(err);

      toast.error(
        err?.reason ||
        err?.shortMessage ||
        err?.message ||
        "Unable to close campaign."
      );

    } finally {

      setIsLoading(false);

    }

  };


  // ----------------------------------
  // REFUND
  // ----------------------------------

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

      const storageKey =
        `refundHistory_${chainId}_${contractAddress}`;

      const existing = JSON.parse(
        localStorage.getItem(storageKey) || "{}"
      );

      const userDonation = donators.find(
        (d) =>
          d.donator?.toLowerCase() ===
          activeAccount?.address?.toLowerCase()
      );

      if (userDonation) {

        const alreadyRefunded = (
          existing[pId] || []
        ).some(
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

                time: new Date().toISOString(),

              },

            ],

          };

          localStorage.setItem(
            storageKey,
            JSON.stringify(updatedHistory)
          );

        }

      }

      toast.success("Refund claimed successfully!");

      await refreshData();

    } catch (err) {

      console.error(err);

      toast.error(
        err?.reason ||
        err?.shortMessage ||
        err?.message ||
        "Refund failed."
      );

    } finally {

      setIsLoading(false);

    }

  };


  // ----------------------------------
  // HELPER FUNCTIONS
  // ----------------------------------

  const shortAddress = (address) => {

    if (!address) return "Unknown";

    return `${address.slice(0, 6)}...${address.slice(-4)}`;

  };


  const formatDate = (timestamp) => {

    if (!timestamp) return "Timestamp unavailable";

    let value = Number(timestamp);

    // Handle seconds and milliseconds.
    if (value < 1000000000000) {
      value *= 1000;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Timestamp unavailable";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  };


  const getDonationTimestamp = (item) => {

    return (
      item.timestamp ??
      item.time ??
      item.donationTime ??
      item.donationTimestamp ??
      null
    );

  };


  // ----------------------------------
  // LOADING STATE
  // ----------------------------------

  if (isFetching) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f12]">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-500 dark:text-gray-400">
            Loading campaign details...
          </p>

        </div>

      </div>

    );

  }


  // ----------------------------------
  // ERROR STATE
  // ----------------------------------

  if (error || !campaign) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f12] px-4">

        <div className="bg-white dark:bg-[#1c1c24] p-8 rounded-2xl shadow text-center max-w-md">

          <Info size={40} className="text-red-500 mx-auto mb-4" />

          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Campaign unavailable
          </h2>

          <p className="text-gray-500 dark:text-gray-400">
            {error || "The requested campaign could not be found."}
          </p>

        </div>

      </div>

    );

  }


  // ----------------------------------
  // MAIN UI
  // ----------------------------------

  return (

    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f12] transition-colors">

      <div className="max-w-[1450px] mx-auto px-4 md:px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">


          {/* ================================= */}
          {/* LEFT SECTION */}
          {/* ================================= */}

          <div className="space-y-8">


            {/* CAMPAIGN HEADER */}

            <section className="space-y-5">

              <div className="flex flex-wrap items-center gap-3">

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">

                  {campaign.category || "General"}

                </span>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.light}`}>

                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${statusInfo.color}`} />

                  {statusInfo.text}

                </span>

              </div>


              <div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">

                  {campaign.title || "Untitled Campaign"}

                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">

                  Campaign #{pId}

                </p>

              </div>


              <div className="relative overflow-hidden rounded-2xl shadow-lg">

                <img

                  src={campaign.image || "/placeholder.png"}

                  alt={campaign.title || "Campaign"}

                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png";
                  }}

                  className="w-full h-[260px] md:h-[430px] object-cover"

                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

                <div className="absolute bottom-5 left-5">

                  <span className="px-4 py-2 rounded-lg bg-black/50 text-white text-sm backdrop-blur-md">

                    {campaign.category || "Community Campaign"}

                  </span>

                </div>

              </div>

            </section>


            {/* FUNDING PROGRESS */}

            <section className="bg-white dark:bg-[#1c1c24] p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">

              <div className="flex justify-between items-start gap-4 mb-4">

                <div>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total funds raised
                  </p>

                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">

                    {formattedRaised.toFixed(4)} ETH

                  </h2>

                  {raisedUSD && (

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {raisedUSD}
                    </p>

                  )}

                </div>


                <div className="text-right">

                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">

                    {progressPercentage.toFixed(1)}%

                  </span>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Funding progress
                  </p>

                </div>

              </div>


              <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">

                <div

                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-700"

                  style={{
                    width: `${progressPercentage}%`,
                  }}

                />

              </div>


              <div className="flex justify-between flex-wrap gap-2 mt-3 text-sm">

                <p className="text-gray-500 dark:text-gray-400">

                  Goal: <span className="font-semibold text-gray-800 dark:text-white">
                    {formattedTarget.toFixed(4)} ETH
                  </span>

                </p>


                <p className="text-gray-500 dark:text-gray-400">

                  {targetReached
                    ? "Funding goal reached!"
                    : `${remainingAmount.toFixed(4)} ETH remaining`}

                </p>

              </div>

            </section>


            {/* STATISTICS */}

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">


              <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">

                <div className="flex items-center gap-3 mb-3">

                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">

                    <Clock className="text-blue-500" size={20} />

                  </div>

                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Time Remaining
                  </span>

                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">

                  {isExpired ? "0" : remainingDays}

                </h3>

                <p className="text-xs text-gray-500 mt-1">

                  {isExpired ? "Deadline passed" : "Days left"}

                </p>

              </div>


              <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">

                <div className="flex items-center gap-3 mb-3">

                  <div className="p-2 rounded-xl bg-green-50 dark:bg-green-500/10">

                    <Users className="text-green-500" size={20} />

                  </div>

                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total Backers
                  </span>

                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">

                  {donators.length}

                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Supporters
                </p>

              </div>


              <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">

                <div className="flex items-center gap-3 mb-3">

                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10">

                    <Coins className="text-purple-500" size={20} />

                  </div>

                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Amount Withdrawn
                  </span>

                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">

                  {formattedWithdrawn.toFixed(4)}

                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  ETH
                </p>

              </div>


            </section>


            {/* CREATOR */}

            <section>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">

                <Wallet size={20} className="text-indigo-500" />

                Campaign Creator

              </h2>


              <div className="bg-white dark:bg-[#1c1c24] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">

                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">

                  <img
                    src={thirdweb}
                    alt="Wallet"
                    className="w-7 h-7"
                  />

                </div>


                <div className="flex-1 min-w-0">

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Wallet Address
                  </p>

                  <p className="text-sm font-medium text-gray-800 dark:text-white break-all">

                    {campaign.owner}

                  </p>

                </div>


                <button

                  onClick={() => copyAddress(campaign.owner)}

                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition shrink-0"

                  title="Copy wallet address"

                >

                  {copied
                    ? <CheckCircle2 size={18} className="text-green-500" />
                    : <Copy size={18} className="text-gray-600 dark:text-gray-300" />}

                </button>

              </div>

            </section>


            {/* CAMPAIGN STORY */}

            <section>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">

                <Heart size={20} className="text-indigo-500" />

                Campaign Story

              </h2>


              <div className="bg-white dark:bg-[#1c1c24] p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">

                <p className="text-gray-600 dark:text-gray-300 leading-8 whitespace-pre-line">

                  {campaign.description || "No campaign description available."}

                </p>

              </div>

            </section>


            {/* CAMPAIGN OVERVIEW */}

            <section>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">

                <Info size={20} className="text-indigo-500" />

                Campaign Overview

              </h2>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


                <div className="bg-white dark:bg-[#1c1c24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800">

                  <div className="flex items-center gap-3">

                    <CalendarDays className="text-indigo-500" size={20} />

                    <div>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Campaign Deadline
                      </p>

                      <p className="font-semibold text-gray-800 dark:text-white mt-1">

                        {formatDate(deadline)}

                      </p>

                    </div>

                  </div>

                </div>


                <div className="bg-white dark:bg-[#1c1c24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800">

                  <div className="flex items-center gap-3">

                    <Target className="text-indigo-500" size={20} />

                    <div>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Funding Target
                      </p>

                      <p className="font-semibold text-gray-800 dark:text-white mt-1">

                        {formattedTarget.toFixed(4)} ETH

                      </p>

                    </div>

                  </div>

                </div>


                <div className="bg-white dark:bg-[#1c1c24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800">

                  <div className="flex items-center gap-3">

                    <Activity className="text-indigo-500" size={20} />

                    <div>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Campaign Status
                      </p>

                      <p className="font-semibold text-gray-800 dark:text-white mt-1">

                        {statusInfo.text}

                      </p>

                    </div>

                  </div>

                </div>


                <div className="bg-white dark:bg-[#1c1c24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800">

                  <div className="flex items-center gap-3">

                    <TrendingUp className="text-indigo-500" size={20} />

                    <div>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Raised in INR
                      </p>

                      <p className="font-semibold text-gray-800 dark:text-white mt-1">

                        {raisedINR || "Price unavailable"}

                      </p>

                    </div>

                  </div>

                </div>


              </div>

            </section>


            {/* DONATION HISTORY */}

            <section>

              <div className="flex justify-between items-center mb-4">

                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">

                  <Heart size={20} className="text-indigo-500" />

                  Donation History

                </h2>

                <span className="text-xs text-gray-500 dark:text-gray-400">

                  {donators.length} Donations

                </span>

              </div>


              {donators.length > 0 ? (

                <div className="space-y-3">

                  {donators.map((item, index) => {

                    const donor = item.donator;

                    const rawDonation = item.donation ?? 0;

                    const donationValue =
                      typeof rawDonation === "bigint"
                        ? Number(formatEther(rawDonation))
                        : Number(rawDonation) > 1000000
                          ? Number(formatEther(BigInt(rawDonation)))
                          : Number(rawDonation);

                    const timestamp = getDonationTimestamp(item);


                    return (

                      <div

                        key={`${donor}-${index}`}

                        className="bg-white dark:bg-[#1c1c24] p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"

                      >

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">


                          <div className="flex items-center gap-3 min-w-0">

                            <div className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">

                              <Wallet size={19} className="text-indigo-500" />

                            </div>


                            <div className="min-w-0">

                              <p className="text-sm font-semibold text-gray-800 dark:text-white">

                                {shortAddress(donor)}

                              </p>

                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">

                                {formatDate(timestamp)}

                              </p>

                            </div>

                          </div>


                          <div className="sm:text-right">

                            <p className="font-bold text-gray-900 dark:text-white">

                              {donationValue.toFixed(4)} ETH

                            </p>

                            <p className="text-xs text-green-500 mt-1">

                              Donation #{index + 1}

                            </p>

                          </div>


                        </div>

                      </div>

                    );

                  })}

                </div>

              ) : (

                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800">

                  <Heart size={35} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />

                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    No donations yet
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Be the first person to support this campaign.
                  </p>

                </div>

              )}

            </section>


            {/* CAMPAIGN ACTIVITY */}

            <section>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">

                <Activity size={20} className="text-indigo-500" />

                Campaign Activity

              </h2>


              <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-5">


                <div className="flex gap-3">

                  <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">

                    <CheckCircle2 size={18} className="text-indigo-500" />

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      Campaign registered on blockchain
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Campaign #{pId}
                    </p>

                  </div>

                </div>


                {donators.length > 0 && (

                  <div className="flex gap-3">

                    <div className="w-9 h-9 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center shrink-0">

                      <Coins size={18} className="text-green-500" />

                    </div>

                    <div>

                      <p className="text-sm font-semibold text-gray-800 dark:text-white">

                        {donators.length} donation(s) received

                      </p>

                      <p className="text-xs text-gray-500 mt-1">

                        Total raised: {formattedRaised.toFixed(4)} ETH

                      </p>

                    </div>

                  </div>

                )}


                {targetReached && (

                  <div className="flex gap-3">

                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">

                      <Target size={18} className="text-blue-500" />

                    </div>

                    <div>

                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        Funding goal achieved!
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        The campaign has reached its funding target.
                      </p>

                    </div>

                  </div>

                )}


                {effectiveStatus === 2 && (

                  <div className="flex gap-3">

                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">

                      <CheckCircle2 size={18} className="text-gray-500" />

                    </div>

                    <div>

                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        Campaign closed
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        The creator closed this campaign.
                      </p>

                    </div>

                  </div>

                )}


                {isExpired && (

                  <div className="flex gap-3">

                    <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">

                      <Clock size={18} className="text-red-500" />

                    </div>

                    <div>

                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        Campaign deadline passed
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(deadline)}
                      </p>

                    </div>

                  </div>

                )}

              </div>

            </section>


            {/* BLOCKCHAIN DETAILS */}

            <section>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">

                <ShieldCheck size={20} className="text-indigo-500" />

                Blockchain Details

              </h2>


              <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-4">


                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Network
                  </p>

                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {activeChain?.name || "Unknown Network"}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Chain ID
                  </p>

                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {chainId || "Unavailable"}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Smart Contract Address
                  </p>

                  <div className="flex items-center justify-between gap-3">

                    <p className="text-sm text-gray-800 dark:text-gray-300 break-all">
                      {contract?.address || "Unavailable"}
                    </p>

                    {contract?.address && (

                      <button

                        onClick={() => copyAddress(contract.address)}

                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"

                      >

                        <Copy size={16} />

                      </button>

                    )}

                  </div>

                </div>


                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Campaign ID
                  </p>

                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {pId}
                  </p>

                </div>


              </div>

            </section>


          </div>


          {/* ================================= */}
          {/* RIGHT FUNDING PANEL */}
          {/* ================================= */}

          <aside className="w-full">

            <div className="lg:sticky lg:top-6 space-y-5">


              {/* FUNDING CARD */}

              <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 space-y-5">


                <div>

                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Support This Campaign
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Every contribution makes a difference.
                  </p>

                </div>


                <div className={`p-4 rounded-xl ${statusInfo.light}`}>

                  <div className="flex items-center gap-2 mb-1">

                    <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />

                    <p className="font-semibold text-sm">
                      {statusInfo.text}
                    </p>

                  </div>

                  <p className="text-xs opacity-80">
                    {statusInfo.description}
                  </p>

                </div>


                {canDonate && (

                  <div className="space-y-4">


                    <div>

                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                        Donation Amount (ETH)
                      </label>

                      <div className="relative">

                        <input

                          type="number"

                          min="0"

                          step="any"

                          placeholder="0.00"

                          value={amount}

                          onChange={(e) => setAmount(e.target.value)}

                          disabled={isLoading}

                          className="w-full p-4 pr-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#25252e] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"

                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                          ETH
                        </span>

                      </div>

                    </div>


                    {numericAmount > 0 && (

                      <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 space-y-2">

                        <div className="flex justify-between text-sm">

                          <span className="text-gray-500 dark:text-gray-400">
                            USD
                          </span>

                          <span className="font-semibold text-gray-800 dark:text-white">
                            ${usdValue}
                          </span>

                        </div>

                        <div className="flex justify-between text-sm">

                          <span className="text-gray-500 dark:text-gray-400">
                            INR
                          </span>

                          <span className="font-semibold text-gray-800 dark:text-white">
                            ₹{inrValue}
                          </span>

                        </div>

                      </div>

                    )}


                    <button

                      onClick={handleDonate}

                      disabled={isLoading || !amount || numericAmount <= 0}

                      className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition"

                    >

                      {isLoading
                        ? "Processing Transaction..."
                        : <>Fund Campaign <ArrowUpRight size={18} /></>}

                    </button>


                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Your donation will be processed through the connected blockchain wallet.
                    </p>

                  </div>

                )}


                {/* OWNER ACTIONS */}

                {isOwner && effectiveStatus === 0 && !isExpired && (

                  <button

                    onClick={handleClose}

                    disabled={isLoading}

                    className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition"

                  >

                    Close Campaign

                  </button>

                )}


                {isOwner && effectiveStatus === 1 && (

                  <button

                    onClick={handlePayout}

                    disabled={isLoading}

                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50"

                  >

                    {isLoading ? "Processing..." : "Withdraw Funds"}

                  </button>

                )}


                {/* REFUND */}

                {!isOwner &&

                  (effectiveStatus === 2 || effectiveStatus === 3) &&

                  raised < target && (

                    <button

                      onClick={handleRefund}

                      disabled={isLoading}

                      className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition disabled:opacity-50"

                    >

                      {isLoading ? "Processing..." : "Claim Refund"}

                    </button>

                  )}


                {/* WITHDRAWAL INFORMATION */}

                {formattedWithdrawn > 0 && (

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Total withdrawn
                    </p>

                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {formattedWithdrawn.toFixed(4)} ETH
                    </p>

                  </div>

                )}


              </div>


              {/* TRANSPARENCY CARD */}

              <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-5">

                <div className="flex items-center gap-3 mb-2">

                  <ShieldCheck size={22} className="text-indigo-600 dark:text-indigo-400" />

                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Blockchain Transparency
                  </h3>

                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 leading-6">
                  Campaign funding information is retrieved from the connected smart contract. Transactions can be independently verified on the relevant blockchain explorer.
                </p>

              </div>


            </div>

          </aside>


        </div>

      </div>

    </div>

  );

};


export default CampaignDetails;
