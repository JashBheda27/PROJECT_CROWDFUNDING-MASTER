import React, { useEffect, useState } from "react";
import { useStateContext } from "../context";
import { useActiveAccount } from "thirdweb/react";
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
  FaHeartbeat
} from "react-icons/fa";

const CampaignFinance = () => {

  const { getCampaigns, getDonations, payout, refund } = useStateContext();
  const activeAccount = useActiveAccount();
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

const formatEth = (value) => {

  if (!value) return "0.0000";

  const num = Number(value);

  // If value is huge → it's Wei
  if (num > 1000000) {
    return Number(formatEther(BigInt(value))).toFixed(3);
  }

  // Otherwise it's already ETH
  return num.toFixed(3);

};

  const getHealth = (percentage) => {

    if (percentage >= 80)
      return { label: "Excellent", color: "text-green-400" };

    if (percentage >= 50)
      return { label: "Good", color: "text-yellow-400" };

    if (percentage >= 20)
      return { label: "Weak", color: "text-orange-400" };

    return { label: "Poor", color: "text-red-400" };
  };

  const fetchCampaignData = async () => {

  const data = await getCampaigns();
  setCampaigns(data);

  const counts = {};
  const top = {};
  const withdraws = {};
  const donationsStorage = {};

  let raised = 0n;
  let backersCount = 0;

  for (let campaign of data) {

    raised += BigInt(campaign.amountCollected || 0);

    const donations = await getDonations(campaign.pId);

    donationsStorage[campaign.pId] = donations;

    counts[campaign.pId] = donations.length;
    backersCount += donations.length;

    // FIXED BIGINT SORTING
    const sorted = donations.sort(
      (a, b) => (BigInt(b.donation) > BigInt(a.donation) ? 1 : -1)
    );

    top[campaign.pId] = sorted.slice(0, 3);

    // SAFE BIGINT STORAGE
    withdraws[campaign.pId] = BigInt(campaign.withdrawnAmount || 0);

  }

  setDonationsMap(donationsStorage);
  setBackers(counts);
  setTopDonators(top);
  setWithdrawHistory(withdraws);
  setTotalRaised(raised);
  setTotalBackers(backersCount);

};

useEffect(() => {

  const storedRefunds = localStorage.getItem("refundHistory");

  if (storedRefunds) {
    setRefundHistory(JSON.parse(storedRefunds));
  }

  fetchCampaignData();

}, []);

const handleWithdraw = async (pId) => {

  // FIXED BIGINT CHECK
  if (withdrawHistory[pId] && withdrawHistory[pId] > 0n) {

    setCampaignMessages((prev) => ({
      ...prev,
      [pId]: "Funds already withdrawn"
    }));

    return;
  }

  try {

    await payout(pId);

    setCampaignMessages((prev) => ({
      ...prev,
      [pId]: "Funds withdrawn successfully 🎉"
    }));

    fetchCampaignData();

  } catch (err) {

    console.error("Withdraw failed:", err);

  }

};

const handleRefund = async (pId) => {

  const refunds = refundHistory[pId] || [];

  const alreadyRefunded = refunds.some(
    (r) =>
      r.user?.toLowerCase() ===
      activeAccount?.address?.toLowerCase()
  );

  if (alreadyRefunded) {

    setCampaignMessages((prev) => ({
      ...prev,
      [pId]: "Refund already claimed"
    }));

    return;

  }

  try {

    await refund(pId);

    const donations = donationsMap[pId] || [];

    const userDonation = donations.find(
      (d) =>
        d.donator?.toLowerCase() ===
        activeAccount?.address?.toLowerCase()
    );

    if (userDonation) {

      const updatedHistory = {
        ...(JSON.parse(localStorage.getItem("refundHistory")) || {}),
        [pId]: [
          ...(refundHistory[pId] || []),
          {
            user: activeAccount.address,
            amount: userDonation.donation,
            time: new Date().toLocaleString(),
          },
        ],
      };

      setRefundHistory(updatedHistory);

      // save in browser so refresh doesn't erase it
      localStorage.setItem("refundHistory", JSON.stringify(updatedHistory));

    }

    setCampaignMessages((prev) => ({
      ...prev,
      [pId]: "Refund claimed successfully 💸"
    }));

    fetchCampaignData();

  } catch (err) {

    console.error("Refund failed:", err);

  }

};

  return (

    <div className="px-6 md:px-12 py-8 bg-gray-50 dark:bg-[#0f0f12] min-h-screen">

      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        Campaign Finance Dashboard
      </h1>

      {/* PLATFORM STATS */}

      <div className="grid md:grid-cols-3 gap-6 mb-10">

        <StatCard
          icon={<FaBullhorn className="text-purple-500 text-3xl" />}
          title="Total Campaigns"
          value={campaigns.length}
        />

        <StatCard
          icon={<FaEthereum className="text-green-500 text-3xl" />}
          title="Total Raised"
          value={`${formatEth(totalRaised)} ETH`}
        />

        <StatCard
          icon={<FaUsers className="text-blue-500 text-3xl" />}
          title="Total Backers"
          value={totalBackers}
        />

      </div>

      {/* CAMPAIGNS */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {campaigns.map((campaign, index) => {

          const raised = formatEth(campaign.amountCollected);
          const target = formatEth(campaign.target);
          const withdrawn = formatEth(withdrawHistory[campaign.pId]);

          const percentage = calculateBarPercentage(
            campaign.target,
            campaign.amountCollected
          );

          const health = getHealth(percentage);

         let campaignStatus = "Funding";
let statusStyle = "bg-blue-100 text-blue-600";

if (Number(campaign.amountCollected) >= Number(campaign.target)) {

  campaignStatus = "Goal Reached";
  statusStyle = "bg-green-100 text-green-600";

} 
else if (campaign.status === 2) {

  campaignStatus = "Goal Not Reached";
  statusStyle = "bg-red-100 text-red-600";

}

          const isOwner =
            activeAccount?.address?.toLowerCase() ===
            campaign.owner?.toLowerCase();

          const donations = donationsMap[campaign.pId] || [];

          const hasDonated = donations.some(
            (d) =>
              d.donator?.toLowerCase() ===
              activeAccount?.address?.toLowerCase()
          );

          return (

            <div
              key={index}
              className="
              bg-white/10 backdrop-blur-lg
              border border-white/10
              p-6 rounded-xl shadow
              hover:shadow-2xl hover:scale-[1.02]
              transition-all duration-300
              flex flex-col gap-4"
            >

              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {campaign.title}
              </h3>

              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">

                <p>Raised: <span className="font-semibold">{raised} ETH</span></p>
                <p>Target: <span className="font-semibold">{target} ETH</span></p>
                <p>Withdrawn: <span className="font-semibold">{withdrawn} ETH</span></p>
                <p>Backers: <span className="font-semibold">{backers[campaign.pId] || 0}</span></p>

              </div>

              {/* PROGRESS BAR */}

              <div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">

                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  />

                </div>

                <div className="flex justify-between text-xs mt-2">

                  <span className="text-gray-500">
                    {percentage}% funded
                  </span>

                  <span className={`px-2 py-1 rounded-full text-xs ${statusStyle}`}>
                    {campaignStatus}
                  </span>

                </div>

              </div>

              {/* HEALTH INDICATOR */}

              <div className="flex items-center gap-2 text-sm">

                <FaHeartbeat className={health.color} />

                <span className={`${health.color} font-medium`}>
                  Campaign Health: {health.label}
                </span>

              </div>

              {/* TOP DONATORS */}

              <div>

                <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  <FaTrophy className="text-yellow-500" />
                  Top Donators
                </p>

                {topDonators[campaign.pId]?.length > 0 ? (

                  topDonators[campaign.pId].map((d, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      {i + 1}. {d.donator.slice(0, 6)}...{d.donator.slice(-4)}
                    </p>
                  ))

                ) : (

                  <p className="text-xs text-gray-400">
                    No donations yet
                  </p>

                )}

              </div>

              {/* ACTION BUTTONS */}

              <div className="flex flex-col gap-2 mt-2">

                {isOwner &&
                  campaign.status === 1 &&
                  Number(campaign.amountCollected) >= Number(campaign.target) && (

                    <button
                      onClick={() => handleWithdraw(campaign.pId)}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      <FaWallet />
                      Withdraw Funds
                    </button>

                  )}

                {!isOwner &&
                  campaign.status === 2 &&
                  hasDonated && (

                    <button
                      onClick={() => handleRefund(campaign.pId)}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                    >
                      <FaWallet />
                      Refund Donation
                    </button>

                  )}

                <button
                  onClick={() =>
                    navigate(`/campaign-details/${campaign.pId}`, {
                      state: campaign,
                    })
                  }
                  className="flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  <FaEye />
                  View Campaign
                </button>

                <button
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setShowHistoryModal(true);
                  }}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm"
                >
                  <FaHistory />
                  View History
                </button>

              </div>

              {campaignMessages[campaign.pId] && (

                <div className="text-xs text-center text-green-400 mt-2">

                  {campaignMessages[campaign.pId]}

                </div>

              )}

            </div>

          );

        })}

      </div>

      {/* HISTORY MODAL */}

      {showHistoryModal && selectedCampaign && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-[#1c1c24] w-[500px] max-h-[80vh] overflow-y-auto rounded-xl p-6">

            <div className="flex justify-between mb-4">

              <h2 className="text-lg font-bold text-white">
                Transaction History
              </h2>

              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>

            </div>

            {/* WITHDRAW HISTORY */}

            <h3 className="text-green-400 mb-2 font-semibold">
              Withdraw History
            </h3>

            {Number(withdrawHistory[selectedCampaign.pId]) > 0 ? (

              <div className="flex justify-between text-sm border-b border-gray-700 py-2">

                <span className="text-gray-300">
                  Campaign Owner
                </span>

                <span className="text-green-400">
                  {formatEth(withdrawHistory[selectedCampaign.pId])} ETH
                </span>

              </div>

            ) : (

              <p className="text-gray-500 text-sm">
                No withdrawals yet
              </p>

            )}

            {/* REFUND HISTORY */}

            <h3 className="text-yellow-400 mt-6 mb-2 font-semibold">
              Refund History
            </h3>

            {refundHistory[selectedCampaign.pId]?.length > 0 ? (

              refundHistory[selectedCampaign.pId].map((refund, i) => (

                <div
                  key={i}
                  className="flex justify-between text-sm border-b border-gray-700 py-2"
                >

                  <span className="text-gray-300">
                    {refund.user.slice(0, 6)}...{refund.user.slice(-4)}
                  </span>

                  <span className="text-yellow-400">
                    {formatEth(refund.amount)} ETH
                  </span>

                </div>

              ))

            ) : (

              <p className="text-gray-500 text-sm">
                No refunds claimed yet
              </p>

            )}

          </div>

        </div>

      )}

    </div>

  );

};

const StatCard = ({ icon, title, value }) => (

  <div className="flex items-center gap-4 p-6 bg-white dark:bg-[#1c1c24] rounded-xl shadow transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] cursor-pointer ">

    {icon}

    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold dark:text-white">
        {value}
      </h2>
    </div>

  </div>

);

export default CampaignFinance;