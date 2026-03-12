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
  const [totalRaised, setTotalRaised] = useState(0);
  const [totalBackers, setTotalBackers] = useState(0);

  const fetchCampaignData = async () => {

    const data = await getCampaigns();
    setCampaigns(data);

    const counts = {};
    const top = {};
    const withdraws = {};
    const donationsStorage = {};

    let raised = 0;
    let backersCount = 0;

    for (let campaign of data) {

      raised += Number(campaign.amountCollected);

      const donations = await getDonations(campaign.pId);

      donationsStorage[campaign.pId] = donations;

      counts[campaign.pId] = donations.length;
      backersCount += donations.length;

      const sorted = donations.sort(
        (a, b) => Number(b.donation) - Number(a.donation)
      );

      top[campaign.pId] = sorted.slice(0, 3);

      withdraws[campaign.pId] = campaign.withdrawnAmount;

    }

    setDonationsMap(donationsStorage);
    setBackers(counts);
    setTopDonators(top);
    setWithdrawHistory(withdraws);
    setTotalRaised(raised);
    setTotalBackers(backersCount);

  };

  useEffect(() => {
    fetchCampaignData();
  }, []);

  const handleWithdraw = async (pId) => {

    try {

      await payout(pId);
      alert("Funds withdrawn successfully 🎉");

      fetchCampaignData();

    } catch (err) {

      console.error("Withdraw failed:", err);

    }

  };

  const handleRefund = async (pId) => {

    try {

      await refund(pId);
      alert("Refund claimed successfully 💸");

      fetchCampaignData();

    } catch (err) {

      console.error("Refund failed:", err);

    }

  };

  return (

    <div className="px-6 md:px-12 py-8 bg-gray-50 dark:bg-[#0f0f12] min-h-screen">

      {/* PAGE TITLE */}

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
          value={`${formatEther(BigInt(totalRaised))} ETH`}
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

          const raised = campaign.amountCollected
            ? formatEther(campaign.amountCollected)
            : "0";

          const target = campaign.target
            ? formatEther(campaign.target)
            : "0";

          const withdrawn = withdrawHistory[campaign.pId]
            ? formatEther(withdrawHistory[campaign.pId])
            : "0";

          const percentage = calculateBarPercentage(
            campaign.target,
            campaign.amountCollected
          );

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
              className="bg-white dark:bg-[#1c1c24] p-6 rounded-xl shadow hover:shadow-lg transition flex flex-col gap-4"
            >

              {/* TITLE */}

              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {campaign.title}
              </h3>

              {/* INFO */}

              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">

                <p>
                  Raised: <span className="font-semibold">{raised} ETH</span>
                </p>

                <p>
                  Target: <span className="font-semibold">{target} ETH</span>
                </p>

                <p>
                  Withdrawn: <span className="font-semibold">{withdrawn} ETH</span>
                </p>

                <p>
                  Backers:{" "}
                  <span className="font-semibold">
                    {backers[campaign.pId] || 0}
                  </span>
                </p>

              </div>

              {/* PROGRESS BAR */}

              <div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">

                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />

                </div>

                <div className="flex justify-between text-xs mt-2">

                  <span className="text-gray-500">
                    {percentage}% funded
                  </span>

                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      percentage >= 100
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {percentage >= 100 ? "Goal Reached" : "Funding"}
                  </span>

                </div>

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
                      {i + 1}. {d.donator.slice(0,6)}...{d.donator.slice(-4)}
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

                {/* OWNER WITHDRAW */}

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

                {/* DONOR REFUND */}

                {!isOwner &&
                 campaign.status === 2 &&
                 hasDonated && (

                  <button
                    onClick={() => handleRefund(campaign.pId)}
                    className="flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                  >
                    <FaWallet/>
                    Refund Donation
                  </button>

                )}

                {/* VIEW */}

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

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

};

const StatCard = ({ icon, title, value }) => (

  <div className="flex items-center gap-4 p-6 bg-white dark:bg-[#1c1c24] rounded-xl shadow">

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