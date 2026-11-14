import React, { useEffect, useState } from "react";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { useStateContext } from "../context";
import { formatEther, createPublicClient, http } from "viem";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { useEthPrice } from "../context/EthPriceContext";
import {
  FaDonate,
  FaBullhorn,
  FaHistory,
  FaWallet,
  FaCopy,
  FaCheck,
  FaArrowUp,
  FaCalendarAlt,
  FaEthereum,
  FaChartLine,
  FaClock,
  FaExclamationCircle,
} from "react-icons/fa";
import { sepolia } from "viem/chains";

// --------------------------------------------------
// CLIENT CONFIGURATION
// --------------------------------------------------

const getClient = (chainId) => {
  if (chainId === 31337) {
    return createPublicClient({
      transport: http("http://127.0.0.1:8545"),
    });
  }

  return createPublicClient({
    chain: sepolia,
    transport: http(),
  });
};

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

const formatDeadline = (deadline) => {
  try {
    const timestamp = Number(deadline);

    if (!timestamp || !Number.isFinite(timestamp)) {
      return "Not specified";
    }

    return new Date(timestamp * 1000).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "Not specified";
  }
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return "Date unavailable";

  const date = new Date(Number(timestamp) * 1000);

  if (isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// --------------------------------------------------
// PROFILE COMPONENT
// --------------------------------------------------

const Profile = () => {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();

  const { getCampaigns, getDonations } = useStateContext();
  const { ethPriceUSD, ethPriceINR } = useEthPrice();

  const [walletBalance, setWalletBalance] = useState("0");
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // --------------------------------------------------
  // WALLET VALUES
  // --------------------------------------------------

  const usdValue = (
    Number(walletBalance) * Number(ethPriceUSD || 0)
  ).toFixed(2);

  const inrValue = (
    Number(walletBalance) * Number(ethPriceINR || 0)
  ).toFixed(0);

  const totalDonated = donations.reduce(
    (acc, donation) =>
      acc + Number(donation.amount || 0),
    0
  );

  const totalRaised = myCampaigns.reduce(
    (acc, campaign) =>
      acc + Number(campaign.amountCollected || 0),
    0
  );

  // --------------------------------------------------
  // COPY WALLET ADDRESS
  // --------------------------------------------------

  const copyAddress = async () => {
    if (!account?.address) return;

    try {
      await navigator.clipboard.writeText(account.address);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Unable to copy address:", err);
    }
  };

  // --------------------------------------------------
  // LOAD PROFILE DATA
  // --------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!account || !activeChain) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const client = getClient(activeChain.id);

        // Wallet balance
        const balance = await client.getBalance({
          address: account.address,
        });

        if (!isMounted) return;

        setWalletBalance(formatEther(balance));

        // Campaigns
        const campaigns = await getCampaigns();

        if (!isMounted) return;

        const created = [];
        const donationHistory = [];
        const activity = [];

        for (const campaign of campaigns) {
          const targetETH = Number(
            formatEther(campaign.target)
          );

          const collectedETH = Number(
            formatEther(campaign.amountCollected)
          );

          // Campaigns created by connected wallet
          if (
            campaign.owner.toLowerCase() ===
            account.address.toLowerCase()
          ) {
            created.push({
              ...campaign,
              target: targetETH,
              amountCollected: collectedETH,
            });

            activity.push({
              message: `Created campaign "${campaign.title}"`,
              icon: <FaBullhorn />,
              type: "created",
              time: formatDateTime(campaign.createdAt),
            });
          }

          // Donation history
          const campaignDonations = await getDonations(
            campaign.pId
          );

          campaignDonations.forEach((donation) => {
            if (
              donation.donator.toLowerCase() ===
              account.address.toLowerCase()
            ) {
              const donatedETH = Number(donation.donation);

              donationHistory.push({
                campaign: campaign.title,
                amount: donatedETH,
                date: formatDateTime(donation.timestamp),
              });

              activity.push({
                message: `Donated ${donatedETH} ETH to "${campaign.title}"`,
                icon: <FaDonate />,
                type: "donated",
                time: formatDateTime(donation.timestamp),
              });
            }
          });
        }

        if (!isMounted) return;

        setMyCampaigns(created);
        setDonations(donationHistory);
        setActivities(activity.reverse());

      } catch (err) {
        console.error("Profile loading error:", err);

        if (isMounted) {
          setError(
            "Unable to load profile data. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [account, activeChain]);

  // --------------------------------------------------
  // STATISTICS DATA
  // --------------------------------------------------

  const stats = [
    {
      title: "Campaigns Created",
      value: myCampaigns.length,
      icon: <FaBullhorn />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Donations",
      value: donations.length,
      icon: <FaDonate />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Donated",
      value: `${totalDonated.toFixed(3)} ETH`,
      icon: <FaHistory />,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Total Raised",
      value: `${totalRaised.toFixed(3)} ETH`,
      icon: <FaChartLine />,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#13131a]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-gray-600 dark:text-gray-400">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // NO WALLET CONNECTED
  // --------------------------------------------------

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#13131a] px-4">
        <div className="bg-white dark:bg-[#1c1c24] p-10 rounded-2xl shadow-sm text-center max-w-md">
          <FaWallet className="text-5xl text-green-500 mx-auto mb-5" />

          <h2 className="text-2xl font-bold mb-3 dark:text-white">
            Wallet Not Connected
          </h2>

          <p className="text-gray-500 dark:text-gray-400">
            Please connect your wallet to view your profile.
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN PROFILE PAGE
  // --------------------------------------------------

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-[#13131a] text-gray-900 dark:text-white px-4 sm:px-6 lg:px-10 py-8">

      <div className="max-w-7xl mx-auto">

        {/* PAGE HEADING */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            My Profile
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your wallet, campaigns and donation activity.
          </p>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
            <FaExclamationCircle />
            {error}
          </div>
        )}

        {/* ------------------------------------------ */}
        {/* PROFILE HEADER */}
        {/* ------------------------------------------ */}

        <div className="bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2c2c34] rounded-2xl p-6 lg:p-8 shadow-sm mb-8">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

            {/* WALLET INFORMATION */}

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

              <div className="p-2 rounded-full bg-gray-100 dark:bg-[#2a2a33] shadow-inner">
                <Jazzicon
                  diameter={68}
                  seed={jsNumberForAddress(account.address)}
                />
              </div>

              <div className="text-center sm:text-left">

                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                  <FaWallet />
                  Connected Wallet
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2">

                  <h2 className="text-xl font-bold">
                    {account.address.slice(0, 8)}...
                    {account.address.slice(-6)}
                  </h2>

                  <button
                    onClick={copyAddress}
                    title="Copy wallet address"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a33] text-gray-500 hover:text-green-500 transition"
                  >
                    {copied ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaCopy />
                    )}
                  </button>

                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">

                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

                  <span className="text-sm text-green-500 font-medium">
                    Connected
                  </span>

                  <span className="text-gray-400 text-sm">
                    • {activeChain?.name || "Unknown Network"}
                  </span>

                </div>

                <div className="mt-4">

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Wallet Balance
                  </p>

                  <p className="text-2xl font-bold text-green-500 mt-1">
                    {Number(walletBalance).toFixed(4)} ETH
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ≈ ${usdValue} USD
                    <span className="mx-2">|</span>
                    ₹ {inrValue} INR
                  </p>

                </div>

              </div>

            </div>

            {/* STATISTICS */}

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-3 w-full xl:w-auto">

              {stats.map((stat, index) => (

                <div
                  key={index}
                  className="min-w-0 bg-gray-50 dark:bg-[#25252e] border border-gray-100 dark:border-[#33333d] rounded-xl p-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                >

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} text-lg mb-3`}>
                    {stat.icon}
                  </div>

                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>

                  <h3 className="text-lg font-bold mt-1 break-words">
                    {stat.value}
                  </h3>

                </div>

              ))}

            </div>

          </div>

        </div>

        {/* ------------------------------------------ */}
        {/* ACTIVITY FEED */}
        {/* ------------------------------------------ */}

        <section className="mb-10">

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
              <FaHistory />
            </div>

            <div>
              <h3 className="text-xl font-bold">
                Activity Feed
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your recent blockchain activity
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2c2c34] rounded-2xl p-5 shadow-sm">

            {activities.length === 0 ? (

              <div className="py-8 text-center">

                <FaHistory className="text-3xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />

                <p className="text-gray-500 dark:text-gray-400">
                  No activity yet.
                </p>

              </div>

            ) : (

              <div className="space-y-1">

                {activities.map((activity, index) => (

                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-[#25252e] transition"
                  >

                    <div className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-full ${activity.type === "created"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-green-500/10 text-green-500"
                      }`}>
                      {activity.icon}
                    </div>

                    <div className="flex-1 min-w-0">

                      <p className="font-medium text-sm sm:text-base">
                        {activity.message}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <FaClock />
                        {activity.time}
                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </section>

        {/* ------------------------------------------ */}
        {/* MY CAMPAIGNS */}
        {/* ------------------------------------------ */}

        <section className="mb-10">

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FaBullhorn />
            </div>

            <div>
              <h3 className="text-xl font-bold">
                My Campaigns
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Campaigns you've created
              </p>
            </div>
          </div>

          {myCampaigns.length === 0 ? (

            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-10 text-center border border-gray-200 dark:border-[#2c2c34]">

              <FaBullhorn className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />

              <h4 className="font-semibold text-lg">
                No Campaigns Yet
              </h4>

              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Your created campaigns will appear here.
              </p>

            </div>

          ) : (

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {myCampaigns.map((campaign) => {

                const progress = campaign.target > 0
                  ? Math.min(
                    100,
                    Math.max(
                      0,
                      (campaign.amountCollected / campaign.target) * 100
                    )
                  )
                  : 0;

                return (

                  <div
                    key={campaign.pId}
                    className="group bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2c2c34] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >

                    {/* IMAGE */}

                    <div className="relative overflow-hidden">

                      <img
                        src={campaign.image}
                        alt={campaign.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                        Campaign
                      </div>

                    </div>

                    {/* CONTENT */}

                    <div className="p-5">

                      <h4 className="font-bold text-lg truncate">
                        {campaign.title}
                      </h4>

                      <div className="flex justify-between items-center mt-4 text-sm">

                        <span className="text-gray-500 dark:text-gray-400">
                          Raised
                        </span>

                        <span className="font-semibold text-green-500">
                          {campaign.amountCollected.toFixed(3)} ETH
                        </span>

                      </div>

                      <div className="flex justify-between items-center mt-1 text-sm">

                        <span className="text-gray-500 dark:text-gray-400">
                          Target
                        </span>

                        <span className="font-medium">
                          {campaign.target.toFixed(3)} ETH
                        </span>

                      </div>

                      {/* PROGRESS BAR */}

                      <div className="mt-4">

                        <div className="flex justify-between text-xs mb-2">

                          <span className="text-gray-500 dark:text-gray-400">
                            Funding Progress
                          </span>

                          <span className="font-bold text-green-500">
                            {progress.toFixed(1)}%
                          </span>

                        </div>

                        <div className="w-full h-2.5 bg-gray-100 dark:bg-[#33333d] rounded-full overflow-hidden">

                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                            style={{
                              width: `${progress}%`,
                            }}
                          />

                        </div>

                      </div>

                      {/* DEADLINE */}

                      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-[#33333d] text-xs text-gray-500 dark:text-gray-400">

                        <FaCalendarAlt className="text-green-500" />

                        Deadline: {formatDeadline(campaign.deadline)}

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </section>

        {/* ------------------------------------------ */}
        {/* DONATION HISTORY */}
        {/* ------------------------------------------ */}

        <section>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <FaDonate />
            </div>

            <div>
              <h3 className="text-xl font-bold">
                Donation History
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your contributions to campaigns
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2c2c34] rounded-2xl shadow-sm overflow-hidden">

            {donations.length === 0 ? (

              <div className="py-12 text-center">

                <FaDonate className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />

                <h4 className="font-semibold text-lg">
                  No Donations Yet
                </h4>

                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Your donation transactions will appear here.
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm text-left">

                  <thead className="bg-gray-50 dark:bg-[#25252e] text-gray-500 dark:text-gray-400">

                    <tr>

                      <th className="px-6 py-4 font-semibold">
                        Campaign
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Amount
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Date
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {donations.map((donation, index) => (

                      <tr
                        key={index}
                        className="border-t border-gray-100 dark:border-[#33333d] hover:bg-gray-50 dark:hover:bg-[#25252e] transition"
                      >

                        <td className="px-6 py-5 font-medium">
                          {donation.campaign}
                        </td>

                        <td className="px-6 py-5">

                          <span className="flex items-center gap-2 text-green-500 font-semibold whitespace-nowrap">

                            <FaEthereum />

                            {Number(donation.amount).toFixed(3)} ETH

                          </span>

                        </td>

                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {donation.date}
                        </td>

                        <td className="px-6 py-5">

                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold">

                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />

                            Successful

                          </span>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

            {/* TABLE FOOTER */}

            {donations.length > 0 && (

              <div className="px-6 py-4 border-t border-gray-100 dark:border-[#33333d] flex flex-col sm:flex-row justify-between gap-2">

                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total Transactions: {donations.length}
                </span>

                <span className="font-semibold text-green-500">
                  Total Donated: {totalDonated.toFixed(3)} ETH
                </span>

              </div>

            )}

          </div>

        </section>

      </div>

    </div>
  );
};

export default Profile;