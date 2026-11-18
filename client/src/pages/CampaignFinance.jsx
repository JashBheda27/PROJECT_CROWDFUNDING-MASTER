import React, { useEffect, useMemo, useState } from "react";
import { useStateContext } from "../context";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { formatEther } from "viem";
import { calculateBarPercentage } from "../utils";
import { useNavigate } from "react-router-dom";
import {
  FaBullhorn,
  FaUsers,
  FaEthereum,
  FaTrophy,
  FaWallet,
  FaEye,
  FaHistory,
  FaHeartbeat,
  FaSearch,
  FaSortAmountDown,
  FaTimes,
  FaRegClock,
} from "react-icons/fa";

const CampaignFinance = () => {
  const { getCampaigns, getDonations, payout, refund, contract } = useStateContext();
  const activeAccount = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const chainId = activeChain?.id;
  const contractAddress = contract?.address;
  const storageKey = `refundHistory_${chainId}_${contractAddress}`;
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [donationsMap, setDonationsMap] = useState({});
  const [backers, setBackers] = useState({});
  const [topDonators, setTopDonators] = useState({});
  const [withdrawHistory, setWithdrawHistory] = useState({});
  const [refundHistory, setRefundHistory] = useState({});
  const [campaignMessages, setCampaignMessages] = useState({});
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [totalRaised, setTotalRaised] = useState(0);
  const [totalBackers, setTotalBackers] = useState(0);

  // New dashboard controls
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const formatEth = (value) => {
    if (value === undefined || value === null || value === "") return "0.000";
    try {
      const num = Number(value);
      // Values returned by the contract are normally Wei; smaller values may already be ETH.
      if (num > 1000000) return Number(formatEther(BigInt(value))).toFixed(3);
      return num.toFixed(3);
    } catch {
      return "0.000";
    }
  };

  const getHealth = (percentage) => {
    if (percentage >= 80) return { label: "Excellent", color: "text-green-500" };
    if (percentage >= 50) return { label: "Good", color: "text-yellow-500" };
    if (percentage >= 20) return { label: "Weak", color: "text-orange-500" };
    return { label: "Poor", color: "text-red-500" };
  };

  const getCampaignStatus = (campaign) => {
    if (Number(campaign.amountCollected) >= Number(campaign.target)) {
      return { label: "Goal Reached", filter: "reached", style: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    }
    if (Number(campaign.status) === 2) {
      return { label: "Goal Not Reached", filter: "closed", style: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    }
    return { label: "Funding", filter: "funding", style: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  };

  const fetchCampaignData = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await getCampaigns();
      const safeCampaigns = data || [];
      setCampaigns(safeCampaigns);

      const counts = {};
      const top = {};
      const withdraws = {};
      const donationsStorage = {};

      let raised = 0;
      let backersCount = 0;

      // Fetch donations for campaigns concurrently rather than waiting one-by-one.
      const donationResults = await Promise.all(
        safeCampaigns.map((campaign) => getDonations(campaign.pId))
      );

      safeCampaigns.forEach((campaign, index) => {
        const donations = donationResults[index] || [];
        donationsStorage[campaign.pId] = donations;
        counts[campaign.pId] = donations.length;
        backersCount += donations.length;
        raised += Number(campaign.amountCollected || 0);

        // BigInt comparison avoids precision loss when sorting Wei amounts.
        // Sort donations by amount (stored as ETH decimal values)
        const sorted = [...donations].sort(
          (a, b) => Number(b.donation || 0) - Number(a.donation || 0)
        );

        top[campaign.pId] = sorted.slice(0, 3);
        top[campaign.pId] = sorted.slice(0, 3);
        withdraws[campaign.pId] = Number(campaign.withdrawnAmount || 0);
      });

      setDonationsMap(donationsStorage);
      setBackers(counts);
      setTopDonators(top);
      setWithdrawHistory(withdraws);
      setTotalRaised(raised);
      setTotalBackers(backersCount);
    } catch (error) {
      console.error("Failed to load finance dashboard:", error);
      setLoadError("Unable to load campaign data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!chainId || !contractAddress) return;
    try {
      const storedRefunds = localStorage.getItem(storageKey);
      setRefundHistory(storedRefunds ? JSON.parse(storedRefunds) : {});
    } catch {
      setRefundHistory({});
    }
    fetchCampaignData();
    // Network and contract changes should reload data for that network.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, contractAddress]);

  const handleWithdraw = async (pId) => {
    if (withdrawHistory[pId] && withdrawHistory[pId] > 0) {
      setCampaignMessages((prev) => ({ ...prev, [pId]: "Funds already withdrawn" }));
      return;
    }
    try {
      await payout(pId);
      setCampaignMessages((prev) => ({ ...prev, [pId]: "Funds withdrawn successfully 🎉" }));
      await fetchCampaignData();
    } catch (err) {
      console.error("Withdraw failed:", err);
      setCampaignMessages((prev) => ({ ...prev, [pId]: "Withdrawal failed. Please try again." }));
    }
  };

  const handleRefund = async (pId) => {
    if (!chainId || !contractAddress) return;
    const refunds = refundHistory[pId] || [];
    const alreadyRefunded = refunds.some(
      (entry) => entry.user?.toLowerCase() === activeAccount?.address?.toLowerCase()
    );
    if (alreadyRefunded) {
      setCampaignMessages((prev) => ({ ...prev, [pId]: "Refund already claimed" }));
      return;
    }
    try {
      await refund(pId);
      const donations = donationsMap[pId] || [];
      const userDonation = donations.find(
        (donation) => donation.donator?.toLowerCase() === activeAccount?.address?.toLowerCase()
      );
      if (userDonation) {
        const existingHistory = JSON.parse(localStorage.getItem(storageKey) || "{}");
        const updatedHistory = {
          ...existingHistory,
          [pId]: [
            ...(existingHistory[pId] || []),
            {
              user: activeAccount.address,
              amount: userDonation.donation,
              time: new Date().toISOString(),
            },
          ],
        };
        setRefundHistory(updatedHistory);
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      }
      setCampaignMessages((prev) => ({ ...prev, [pId]: "Refund claimed successfully 💸" }));
      await fetchCampaignData();
    } catch (err) {
      console.error("Refund failed:", err);
      setCampaignMessages((prev) => ({ ...prev, [pId]: "Refund failed. Please try again." }));
    }
  };

  // Search, status filter and sorting are applied without modifying the source campaign list.
  const visibleCampaigns = useMemo(() => {
    const filtered = campaigns.filter((campaign) => {
      const matchesSearch = campaign.title?.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const status = getCampaignStatus(campaign).filter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "raised-high") return Number(b.amountCollected || 0) - Number(a.amountCollected || 0);
      if (sortBy === "raised-low") return Number(a.amountCollected || 0) - Number(b.amountCollected || 0);
      if (sortBy === "backers") return (backers[b.pId] || 0) - (backers[a.pId] || 0);
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      return Number(b.pId || 0) - Number(a.pId || 0); // newest first
    });
  }, [campaigns, searchTerm, statusFilter, sortBy, backers]);

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedCampaign(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-7 dark:bg-[#0f0f12] sm:px-6 lg:px-12">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Campaign Finance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitor funding, backers and campaign activity.</p>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<FaBullhorn className="text-2xl text-purple-500" />} title="Total Campaigns" value={campaigns.length} />
        <StatCard icon={<FaEthereum className="text-2xl text-green-500" />} title="Total Raised" value={`${formatEth(totalRaised)} ETH`} />
        <StatCard icon={<FaUsers className="text-2xl text-blue-500" />} title="Total Backers" value={totalBackers} />
      </div>

      {/* Campaign search, filter and sort controls */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#1c1c24]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search your campaigns..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-[#111116] dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-green-500 dark:border-gray-700 dark:bg-[#111116] dark:text-gray-200"
              aria-label="Filter campaigns by status"
            >
              <option value="all">All Campaigns</option>
              <option value="funding">Funding</option>
              <option value="reached">Goal Reached</option>
              <option value="closed">Goal Not Reached</option>
            </select>
            <div className="relative">
              <FaSortAmountDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-green-500 dark:border-gray-700 dark:bg-[#111116] dark:text-gray-200 sm:min-w-[190px]"
                aria-label="Sort campaigns"
              >
                <option value="newest">Newest First</option>
                <option value="raised-high">Highest Raised</option>
                <option value="raised-low">Lowest Raised</option>
                <option value="backers">Most Backers</option>
                <option value="title">Campaign Name</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{visibleCampaigns.length} campaign{visibleCampaigns.length !== 1 ? "s" : ""} shown</span>
          {(searchTerm || statusFilter !== "all" || sortBy !== "newest") && (
            <button
              onClick={() => { setSearchTerm(""); setStatusFilter("all"); setSortBy("newest"); }}
              className="font-medium text-green-600 hover:text-green-700 dark:text-green-400"
            >Reset controls</button>
          )}
        </div>
      </div>

      {isLoading && campaigns.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center text-gray-500 dark:border-gray-800 dark:bg-[#1c1c24] dark:text-gray-400">Loading campaigns...</div>
      )}
      {loadError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {loadError} <button onClick={fetchCampaignData} className="ml-2 font-semibold underline">Retry</button>
        </div>
      )}

      {/* Campaign cards */}
      {!isLoading && visibleCampaigns.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-[#1c1c24]">
          <FaBullhorn className="mx-auto mb-3 text-3xl text-gray-400" />
          <h3 className="font-semibold text-gray-800 dark:text-white">No campaigns found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try changing your search or filter.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleCampaigns.map((campaign) => {
          const raised = formatEth(campaign.amountCollected);
          const target = formatEth(campaign.target);
          const withdrawn = formatEth(withdrawHistory[campaign.pId]);
          const percentage = calculateBarPercentage(campaign.target, campaign.amountCollected);
          const health = getHealth(percentage);
          const status = getCampaignStatus(campaign);
          const isOwner = activeAccount?.address?.toLowerCase() === campaign.owner?.toLowerCase();
          const donations = donationsMap[campaign.pId] || [];
          const hasDonated = donations.some((donation) => donation.donator?.toLowerCase() === activeAccount?.address?.toLowerCase());

          return (
            <div key={campaign.pId} className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-[#1c1c24] sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">{campaign.title}</h3>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.style}`}>{status.label}</span>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <Metric label="Raised" value={`${raised} ETH`} />
                <Metric label="Target" value={`${target} ETH`} />
                <Metric label="Withdrawn" value={`${withdrawn} ETH`} />
                <Metric label="Backers" value={backers[campaign.pId] || 0} />
              </div>

              {/* Funding progress */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Funding progress</span><span className="font-semibold">{percentage}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-600 transition-all duration-700" style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-[#111116]">
                <FaHeartbeat className={health.color} />
                <span className="text-gray-600 dark:text-gray-300">Campaign Health</span>
                <span className={`ml-auto font-semibold ${health.color}`}>{health.label}</span>
              </div>

              <div className="mb-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"><FaTrophy className="text-yellow-500" /> Top Donators</p>
                {topDonators[campaign.pId]?.length > 0 ? (
                  <div className="space-y-1">
                    {topDonators[campaign.pId].map((donation, index) => (
                      <p key={`${donation.donator}-${index}`} className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="mr-1 text-gray-400">{index + 1}.</span>{donation.donator.slice(0, 6)}...{donation.donator.slice(-4)}
                      </p>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-400">No donations yet</p>}
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-2">
                {isOwner && campaign.status === 1 && Number(campaign.amountCollected) >= Number(campaign.target) && (
                  <button onClick={() => handleWithdraw(campaign.pId)} className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"><FaWallet /> Withdraw Funds</button>
                )}
                {!isOwner && campaign.status === 2 && hasDonated && (
                  <button onClick={() => handleRefund(campaign.pId)} className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"><FaWallet /> Refund Donation</button>
                )}
                <button onClick={() => navigate(`/campaign-details/${campaign.pId}`, { state: campaign })} className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"><FaEye /> View Campaign</button>
                <button onClick={() => { setSelectedCampaign(campaign); setShowHistoryModal(true); }} className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"><FaHistory /> View History</button>
              </div>

              {campaignMessages[campaign.pId] && <p className="mt-3 rounded-lg bg-gray-50 p-2 text-center text-xs text-gray-600 dark:bg-[#111116] dark:text-gray-300">{campaignMessages[campaign.pId]}</p>}
            </div>
          );
        })}
      </div>

      {/* Transaction history modal */}
      {showHistoryModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeHistoryModal}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-700 bg-[#1c1c24] p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Transaction History</h2>
                <p className="mt-1 text-sm text-gray-400 line-clamp-1">{selectedCampaign.title}</p>
              </div>
              <button onClick={closeHistoryModal} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white" aria-label="Close history"><FaTimes /></button>
            </div>

            <section>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-green-400"><FaWallet /> Withdraw History</h3>
              {Number(withdrawHistory[selectedCampaign.pId]) > 0 ? (
                <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-3">
                  <div className="flex justify-between gap-3 text-sm"><span className="text-gray-300">Campaign Owner</span><span className="font-semibold text-green-400">{formatEth(withdrawHistory[selectedCampaign.pId])} ETH</span></div>
                </div>
              ) : <p className="rounded-lg bg-gray-800/30 p-3 text-sm text-gray-500">No withdrawals yet</p>}
            </section>

            <section className="mt-5">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-400"><FaHistory /> Refund History</h3>
              {refundHistory[selectedCampaign.pId]?.length > 0 ? (
                <div className="space-y-2">
                  {refundHistory[selectedCampaign.pId].map((refundEntry, index) => (
                    <div key={`${refundEntry.user}-${index}`} className="rounded-lg border border-gray-700 bg-gray-800/40 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-300">{refundEntry.user?.slice(0, 6)}...{refundEntry.user?.slice(-4)}</span>
                        <span className="font-semibold text-amber-400">{formatEth(refundEntry.amount)} ETH</span>
                      </div>
                      {refundEntry.time && <p className="mt-2 flex items-center gap-1 text-xs text-gray-500"><FaRegClock /> {new Date(refundEntry.time).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="rounded-lg bg-gray-800/30 p-3 text-sm text-gray-500">No refunds claimed yet</p>}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-[#1c1c24] sm:p-6">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-[#111116]">{icon}</div>
    <div className="min-w-0">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <h2 className="mt-1 break-words text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{value}</h2>
    </div>
  </div>
);

const Metric = ({ label, value }) => (
  <div className="rounded-xl bg-gray-50 p-3 dark:bg-[#111116]">
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
  </div>
);

export default CampaignFinance;
