import React, { useEffect, useState } from "react";
import { useStateContext } from "../context";
import { formatEther } from "viem";

import {
  FaEthereum,
  FaBullhorn,
  FaHandHoldingUsd,
  FaCheckCircle,
  FaTimesCircle,
  FaPlayCircle,
  FaChartBar,
} from "react-icons/fa";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const Stats = () => {
  const { getCampaigns, getDonations } = useStateContext();

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalRaised: 0n,
    totalDonations: 0,
    activeCampaigns: 0,
    successfulCampaigns: 0,
    failedCampaigns: 0,
  });

  const [recentDonations, setRecentDonations] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});

  useEffect(() => {
    const loadStats = async () => {
      const campaigns = await getCampaigns();
      if (!campaigns || campaigns.length === 0) return;

      let totalRaised = 0n;
      let totalDonations = 0;
      let activeCampaigns = 0;
      let successfulCampaigns = 0;
      let failedCampaigns = 0;

      let allDonations = [];
      let categories = {};

      for (let camp of campaigns) {
        let collected = 0n;

        try {
          collected =
            typeof camp.amountCollected === "bigint"
              ? camp.amountCollected
              : BigInt(camp.amountCollected ?? 0);
        } catch {
          collected = 0n;
        }

        totalRaised += collected;

        const donationData = await getDonations(camp.pId);

        totalDonations += donationData.length;

        donationData.forEach((d) => {
          allDonations.push({
            donor: d.donator,
            amount: BigInt(Math.floor(parseFloat(d.donation) * 1e18)),
            campaign: camp.title,
          });
        });

        if (camp.status === 0) activeCampaigns++;
        else if (camp.status === 1) successfulCampaigns++;
        else if (camp.status === 2) failedCampaigns++;

        const category = camp.category || "Other";
        categories[category] = (categories[category] || 0) + 1;
      }

      setStats({
        totalCampaigns: campaigns.length,
        totalRaised,
        totalDonations,
        activeCampaigns,
        successfulCampaigns,
        failedCampaigns,
      });

      setRecentDonations([...allDonations].reverse().slice(0, 5));
      setCategoryStats(categories);
    };

    loadStats();
  }, [getCampaigns, getDonations]);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 via-blue-100 to-purple-100 dark:bg-gradient-to-b dark:from-[#0f0f1a] dark:via-[#111827] dark:to-[#020617]">
      <div className="flex items-center gap-3 mb-10">

        <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30">
          <FaChartBar size={20} />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Platform Statistics
        </h1>

      </div>

      {/* Stats Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">

        <StatCard
          title="Total Campaigns"
          value={stats.totalCampaigns}
          icon={<FaBullhorn />}
          iconBg="from-blue-500 to-indigo-500"
        />

        <StatCard
          title="Total Raised"
          value={`${formatEther(stats.totalRaised)} ETH`}
          icon={<FaEthereum />}
          iconBg="from-purple-500 to-pink-500"
        />

        <StatCard
          title="Total Donations"
          value={stats.totalDonations}
          icon={<FaHandHoldingUsd />}
          iconBg="from-green-500 to-emerald-500"
        />

        <StatCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          icon={<FaPlayCircle />}
          iconBg="from-yellow-500 to-orange-500"
        />

        <StatCard
          title="Successful Campaigns"
          value={stats.successfulCampaigns}
          icon={<FaCheckCircle />}
          iconBg="from-green-600 to-teal-500"
        />

        <StatCard
          title="Failed Campaigns"
          value={stats.failedCampaigns}
          icon={<FaTimesCircle />}
          iconBg="from-gray-500 to-gray-700"
        />

      </div>

      {/* Recent Donations */}

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-black dark:text-white">
          <FaHandHoldingUsd className="text-green-500" />
          Recent Donations
        </h2>

        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-800">

          <Table>

            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>

              {recentDonations.length === 0 ? (

                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    No donations yet
                  </TableCell>
                </TableRow>

              ) : (

                recentDonations.map((don, i) => (

                  <TableRow
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                  >

                    <TableCell className="text-gray-800 dark:text-gray-200">
                      {don.donor?.slice(0, 6)}...{don.donor?.slice(-4)}
                    </TableCell>

                    <TableCell className="text-gray-800 dark:text-gray-200">
                      {don.campaign}
                    </TableCell>

                    <TableCell className="font-semibold text-gray-900 dark:text-white">
                      {formatEther(don.amount)} ETH
                    </TableCell>

                  </TableRow>

                ))

              )}

            </TableBody>

          </Table>

        </div>
      </div>

      {/* Categories */}

      <div>

        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-black dark:text-white">
          <FaBullhorn className="text-blue-500" />
          Campaign Categories
        </h2>

        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-800 space-y-4">

          {Object.keys(categoryStats).length === 0 ? (

            <div className="flex flex-col items-center py-6 text-gray-500">
              <FaBullhorn size={36} />
              <p className="mt-2">No campaigns available</p>
            </div>

          ) : (

            Object.entries(categoryStats).map(([cat, count]) => (

              <div key={cat}>

                <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-1">
                  <span>{cat}</span>
                  <span className="font-semibold">{count}</span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded"
                    style={{ width: `${count * 20}%` }}
                  />
                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
};

const StatCard = ({ title, value, icon, iconBg }) => (

  <div className="bg-white dark:bg-[#1c1c24] p-6 rounded-2xl shadow-md hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 border border-gray-200 dark:border-gray-800">

    <div
      className={`w-12 h-12 flex items-center justify-center rounded-xl text-white bg-gradient-to-r ${iconBg} shadow-lg`}
    >
      {icon}
    </div>

    <h2 className="text-sm mt-4 text-gray-500 dark:text-gray-400">
      {title}
    </h2>

    <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-white">
      {value}
    </p>

  </div>

);

export default Stats;