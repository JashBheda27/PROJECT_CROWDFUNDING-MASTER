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
    <div className="p-6 transition-colors duration-300">

      <h1 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">
        Platform Statistics
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

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

      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Recent Donations
        </h2>

        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 shadow-md">

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
                  <TableCell colSpan={3}>
                    No donations yet
                  </TableCell>
                </TableRow>
              ) : (
                recentDonations.map((don, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-gray-800 dark:text-gray-200">
                      {don.donor?.slice(0, 6)}...
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

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Campaign Categories
        </h2>

        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 shadow-md space-y-3">

          {Object.keys(categoryStats).length === 0 ? (
            <p className="text-gray-500">No campaigns available</p>
          ) : (
            Object.entries(categoryStats).map(([cat, count]) => (
              <div
                key={cat}
                className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {cat}
                </span>

                <span className="font-semibold text-gray-900 dark:text-white">
                  {count}
                </span>
              </div>
            ))
          )}

        </div>
      </div>

    </div>
  );
};

const StatCard = ({ title, value, icon, iconBg }) => (
  <div className="bg-white dark:bg-[#1c1c24] p-6 rounded-2xl shadow-md hover:shadow-xl transition">
    <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-white bg-gradient-to-r ${iconBg}`}>
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