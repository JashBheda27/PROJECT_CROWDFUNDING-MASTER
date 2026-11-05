import React, { useEffect, useState } from "react";
import { useStateContext } from "../context";
import { formatEther, parseEther } from "viem";

import {
  FaEthereum,
  FaBullhorn,
  FaHandHoldingUsd,
  FaCheckCircle,
  FaTimesCircle,
  FaPlayCircle,
  FaChartBar,
  FaTrophy,
  FaWallet,
  FaCoins,
  FaUsers,
  FaChartLine,
  FaLightbulb,
} from "react-icons/fa";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// Helpers
const toBigInt = (value) => {
  try {
    return typeof value === "bigint" ? value : BigInt(value ?? 0);
  } catch {
    return 0n;
  }
};

const formatETH = (value) => {
  const num = Number(formatEther(value));
  return `${num.toFixed(4).replace(/\.?0+$/, "")} ETH`;
};

const formatDonation = (value) => {
  try {
    return typeof value === "bigint"
      ? value
      : parseEther(String(value ?? "0"));
  } catch {
    return 0n;
  }
};

const Stats = () => {
  const { getCampaigns, getDonations } = useStateContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalRaised: 0n,
    totalDonations: 0,
    activeCampaigns: 0,
    successfulCampaigns: 0,
    failedCampaigns: 0,
    totalWithdrawn: 0n,
  });

  const [recentDonations, setRecentDonations] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [topCampaigns, setTopCampaigns] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");

        const campaigns = await getCampaigns();

        if (!mounted) return;

        if (!campaigns || campaigns.length === 0) {
          setStats({
            totalCampaigns: 0,
            totalRaised: 0n,
            totalDonations: 0,
            activeCampaigns: 0,
            successfulCampaigns: 0,
            failedCampaigns: 0,
            totalWithdrawn: 0n,
          });

          setRecentDonations([]);
          setCategoryStats({});
          setTopCampaigns([]);
          return;
        }

        let totalRaised = 0n;
        let totalWithdrawn = 0n;
        let totalDonations = 0;

        let activeCampaigns = 0;
        let successfulCampaigns = 0;
        let failedCampaigns = 0;

        const allDonations = [];
        const categories = {};

        const donationResults = await Promise.allSettled(
          campaigns.map((camp) => getDonations(camp.pId))
        );

        if (!mounted) return;

        campaigns.forEach((camp, index) => {
          const collected = toBigInt(camp.amountCollected);
          const target = toBigInt(camp.target);
          const withdrawn = toBigInt(camp.withdrawnAmount);

          totalRaised += collected;
          totalWithdrawn += withdrawn;

          // Campaign status
          if (Number(camp.status) === 0) activeCampaigns++;
          else if (Number(camp.status) === 1) successfulCampaigns++;
          else if (Number(camp.status) === 2) failedCampaigns++;

          // Categories
          const category = camp.category || "Other";
          categories[category] = (categories[category] || 0) + 1;

          // Top campaigns
          camp._collected = collected;
          camp._target = target;
          camp._withdrawn = withdrawn;

          // Donations
          const result = donationResults[index];

          if (result.status === "fulfilled" && result.value) {
            const donations = result.value;

            totalDonations += donations.length;

            donations.forEach((d) => {
              allDonations.push({
                donor: d.donator,
                amount: formatDonation(d.donation),
                campaign: camp.title,
              });
            });
          }
        });

        const sortedCampaigns = [...campaigns]
          .sort((a, b) =>
            a._collected > b._collected
              ? -1
              : a._collected < b._collected
                ? 1
                : 0
          )
          .slice(0, 5);

        setStats({
          totalCampaigns: campaigns.length,
          totalRaised,
          totalDonations,
          activeCampaigns,
          successfulCampaigns,
          failedCampaigns,
          totalWithdrawn,
        });

        setRecentDonations(allDonations.reverse().slice(0, 10));
        setCategoryStats(categories);
        setTopCampaigns(sortedCampaigns);
      } catch (err) {
        console.error("Error loading statistics:", err);

        if (mounted) {
          setError("Unable to load platform statistics. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, [getCampaigns, getDonations]);

  // Calculations
  const remainingFunds =
    stats.totalRaised > stats.totalWithdrawn
      ? stats.totalRaised - stats.totalWithdrawn
      : 0n;

  const averageDonation =
    stats.totalDonations > 0
      ? stats.totalRaised / BigInt(stats.totalDonations)
      : 0n;

  const completedCampaigns =
    stats.successfulCampaigns + stats.failedCampaigns;

  const successRate =
    completedCampaigns > 0
      ? Math.round(
          (stats.successfulCampaigns / completedCampaigns) * 100
        )
      : 0;

  const popularCategory =
    Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];

  const highestCampaign = topCampaigns[0];

  // Donut chart calculations
  const totalStatus =
    stats.activeCampaigns +
    stats.successfulCampaigns +
    stats.failedCampaigns;

  const getPercentage = (value) =>
    totalStatus > 0 ? (value / totalStatus) * 100 : 0;

  const activePercent = getPercentage(stats.activeCampaigns);
  const successPercent = getPercentage(stats.successfulCampaigns);
  const failedPercent = getPercentage(stats.failedCampaigns);

  const donutStyle = {
    background: `conic-gradient(
      #eab308 0% ${activePercent}%,
      #10b981 ${activePercent}% ${activePercent + successPercent}%,
      #ef4444 ${activePercent + successPercent}% 100%
    )`,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f1a]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Loading platform statistics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f1a]">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-100 dark:from-[#0f0f1a] dark:via-[#111827] dark:to-[#020617]">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
            <FaChartBar size={22} />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Platform Statistics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Overview of crowdfunding platform activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Blockchain Data
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">

        <StatCard
          title="Total Campaigns"
          value={stats.totalCampaigns}
          icon={<FaBullhorn />}
          iconBg="from-blue-500 to-indigo-500"
          description="Campaigns created"
        />

        <StatCard
          title="Total Raised"
          value={formatETH(stats.totalRaised)}
          icon={<FaEthereum />}
          iconBg="from-purple-500 to-pink-500"
          description="Total funds collected"
        />

        <StatCard
          title="Total Donations"
          value={stats.totalDonations}
          icon={<FaHandHoldingUsd />}
          iconBg="from-green-500 to-emerald-500"
          description="Contributions received"
        />

        <StatCard
          title="Active Campaigns"
          value={stats.activeCampaigns}
          icon={<FaPlayCircle />}
          iconBg="from-yellow-500 to-orange-500"
          description="Currently active status"
        />

        <StatCard
          title="Successful Campaigns"
          value={stats.successfulCampaigns}
          icon={<FaCheckCircle />}
          iconBg="from-green-600 to-teal-500"
          description="Successfully completed"
        />

        <StatCard
          title="Failed Campaigns"
          value={stats.failedCampaigns}
          icon={<FaTimesCircle />}
          iconBg="from-red-500 to-rose-600"
          description="Closed or unsuccessful"
        />

      </div>

      {/* Funding Overview */}
      <SectionTitle
        icon={<FaWallet />}
        title="Funding Overview"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

        <MiniCard
          title="Total ETH Raised"
          value={formatETH(stats.totalRaised)}
          icon={<FaEthereum />}
        />

        <MiniCard
          title="Total Withdrawn"
          value={formatETH(stats.totalWithdrawn)}
          icon={<FaWallet />}
        />

        <MiniCard
          title="Remaining Funds"
          value={formatETH(remainingFunds)}
          icon={<FaCoins />}
        />

        <MiniCard
          title="Average Donation"
          value={formatETH(averageDonation)}
          icon={<FaHandHoldingUsd />}
        />

      </div>

      {/* Analytics */}
      <SectionTitle
        icon={<FaChartLine />}
        title="Campaign Analytics"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

        {/* Campaign Status */}
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-800">

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
            Campaign Status Distribution
          </h3>

          {totalStatus === 0 ? (
            <EmptyState text="No campaign data available" />
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-8">

              <div
                className="relative w-48 h-48 rounded-full flex items-center justify-center shrink-0"
                style={donutStyle}
              >
                <div className="w-32 h-32 rounded-full bg-white dark:bg-[#1c1c24] flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800 dark:text-white">
                    {totalStatus}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Campaigns
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-auto space-y-5">

                <Legend
                  color="bg-yellow-500"
                  label="Active"
                  value={stats.activeCampaigns}
                  percentage={activePercent}
                />

                <Legend
                  color="bg-emerald-500"
                  label="Successful"
                  value={stats.successfulCampaigns}
                  percentage={successPercent}
                />

                <Legend
                  color="bg-red-500"
                  label="Failed"
                  value={stats.failedCampaigns}
                  percentage={failedPercent}
                />

              </div>
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-800">

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
            Campaign Categories
          </h3>

          {Object.keys(categoryStats).length === 0 ? (
            <EmptyState text="No campaign categories available" />
          ) : (
            <div className="space-y-5">

              {Object.entries(categoryStats)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => {

                  const percentage =
                    (count / stats.totalCampaigns) * 100;

                  return (
                    <div key={category}>

                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700 dark:text-gray-300">
                          {category}
                        </span>

                        <span className="font-semibold text-gray-800 dark:text-white">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                    </div>
                  );
                })}

            </div>
          )}
        </div>

      </div>

      {/* Top Campaigns */}
      <SectionTitle
        icon={<FaTrophy />}
        title="Top Performing Campaigns"
      />

      <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-800 mb-10">

        {topCampaigns.length === 0 ? (
          <EmptyState text="No campaigns available" />
        ) : (
          <div className="space-y-6">

            {topCampaigns.map((campaign, index) => {

              const target = campaign._target;
              const collected = campaign._collected;

              const percentage =
                target > 0n
                  ? Math.min(
                      Number((collected * 10000n) / target) / 100,
                      100
                    )
                  : 0;

              return (
                <div key={campaign.pId ?? index}>

                  <div className="flex items-start gap-4">

                    <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                      #{index + 1}
                    </div>

                    <div className="flex-1 min-w-0">

                      <div className="flex flex-wrap justify-between gap-2 mb-2">

                        <h4 className="font-semibold text-gray-800 dark:text-white truncate">
                          {campaign.title}
                        </h4>

                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {formatETH(collected)}
                        </span>

                      </div>

                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span>
                          Target: {formatETH(target)}
                        </span>

                        <span>{percentage.toFixed(1)}% funded</span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* Recent Donations */}
      <SectionTitle
        icon={<FaHandHoldingUsd />}
        title="Recent Donations"
      />

      <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 mb-10 overflow-hidden">

        <div className="overflow-x-auto">

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
                  <TableCell colSpan={3} className="text-center py-10">
                    <EmptyState text="No donations received yet" />
                  </TableCell>
                </TableRow>
              ) : (
                recentDonations.map((don, index) => (

                  <TableRow
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                  >

                    <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                      {don.donor
                        ? `${don.donor.slice(0, 6)}...${don.donor.slice(-4)}`
                        : "Unknown"}
                    </TableCell>

                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {don.campaign}
                    </TableCell>

                    <TableCell className="font-semibold text-gray-900 dark:text-white">
                      {formatETH(don.amount)}
                    </TableCell>

                  </TableRow>

                ))
              )}

            </TableBody>

          </Table>

        </div>

        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing latest available donation records.
          </p>
        </div>

      </div>

      {/* Platform Insights */}
      <SectionTitle
        icon={<FaLightbulb />}
        title="Platform Insights"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-8">

        <InsightCard
          icon={<FaChartLine />}
          title="Success Rate"
          value={`${successRate}%`}
          description="Of completed campaigns"
        />

        <InsightCard
          icon={<FaTrophy />}
          title="Highest Funded"
          value={
            highestCampaign
              ? highestCampaign.title
              : "N/A"
          }
          description={
            highestCampaign
              ? formatETH(highestCampaign._collected)
              : "No campaigns available"
          }
        />

        <InsightCard
          icon={<FaBullhorn />}
          title="Popular Category"
          value={popularCategory ? popularCategory[0] : "N/A"}
          description={
            popularCategory
              ? `${popularCategory[1]} campaigns`
              : "No categories available"
          }
        />

        <InsightCard
          icon={<FaUsers />}
          title="Average Donations"
          value={
            stats.totalCampaigns > 0
              ? (
                  stats.totalDonations / stats.totalCampaigns
                ).toFixed(1)
              : "0"
          }
          description="Donations per campaign"
        />

      </div>

    </div>
  );
};

// Statistics Card
const StatCard = ({ title, value, icon, iconBg, description }) => (
  <div className="bg-white dark:bg-[#1c1c24] p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-800">

    <div className="flex justify-between items-start">

      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </p>

        <p className="text-2xl sm:text-3xl font-bold mt-3 text-gray-800 dark:text-white break-all">
          {value}
        </p>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {description}
        </p>
      </div>

      <div className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-xl text-white bg-gradient-to-r ${iconBg} shadow-lg`}>
        {icon}
      </div>

    </div>

  </div>
);

// Mini Funding Card
const MiniCard = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-[#1c1c24] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition">

    <div className="flex items-center justify-between gap-2">

      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </p>

        <p className="text-xl font-bold text-gray-800 dark:text-white mt-2 break-all">
          {value}
        </p>
      </div>

      <div className="text-2xl text-indigo-500 shrink-0">
        {icon}
      </div>

    </div>

  </div>
);

// Insight Card
const InsightCard = ({ icon, title, value, description }) => (
  <div className="bg-white dark:bg-[#1c1c24] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">

    <div className="flex items-center gap-3 mb-4">

      <div className="text-indigo-500 text-xl">
        {icon}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {title}
      </p>

    </div>

    <p className="text-xl font-bold text-gray-800 dark:text-white break-words">
      {value}
    </p>

    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
      {description}
    </p>

  </div>
);

// Section Heading
const SectionTitle = ({ icon, title }) => (
  <h2 className="text-xl font-bold mb-5 flex items-center gap-3 text-gray-800 dark:text-white">
    <span className="text-indigo-500">
      {icon}
    </span>
    {title}
  </h2>
);

// Chart Legend
const Legend = ({ color, label, value, percentage }) => (
  <div className="flex items-center justify-between gap-5">

    <div className="flex items-center gap-3">

      <span className={`w-3 h-3 rounded-full ${color}`} />

      <span className="text-sm text-gray-600 dark:text-gray-300">
        {label}
      </span>

    </div>

    <div className="text-right">
      <p className="font-bold text-gray-800 dark:text-white">
        {value}
      </p>

      <p className="text-xs text-gray-400">
        {percentage.toFixed(1)}%
      </p>
    </div>

  </div>
);

// Empty State
const EmptyState = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
    <FaChartBar size={30} />
    <p className="mt-3 text-sm">{text}</p>
  </div>
);

export default Stats;