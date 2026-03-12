import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useStateContext } from "../context";
import { formatEther, createPublicClient, http } from "viem";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { useEthPrice } from "../context/EthPriceContext";
import {
  FaUserCircle,
  FaDonate,
  FaBullhorn,
  FaHistory,
  FaWallet,
} from "react-icons/fa";

const publicClient = createPublicClient({
  transport: http("http://127.0.0.1:8545"),
});



const Profile = () => {
  const account = useActiveAccount();
  const { getCampaigns, getDonations } = useStateContext();
  const { ethPriceUSD, ethPriceINR } = useEthPrice();
  const [walletBalance, setWalletBalance] = useState("0");

  const [myCampaigns, setMyCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [activities, setActivities] = useState([]);
  const usdValue = (Number(walletBalance) * ethPriceUSD).toFixed(2);
  const inrValue = (Number(walletBalance) * ethPriceINR).toFixed(0);

  useEffect(() => {
    const loadProfile = async () => {
      if (!account) return;

      // get wallet balance
      const balance = await publicClient.getBalance({
        address: account.address,
      });

      const ethBalance = formatEther(balance);
      setWalletBalance(ethBalance);


      const campaigns = await getCampaigns();

      const created = [];
      const donationHistory = [];
      const activity = [];

      for (let campaign of campaigns) {
        const targetETH = Number(formatEther(campaign.target));
        const collectedETH = Number(formatEther(campaign.amountCollected));

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
            time: "Recently",
          });
        }

        const campaignDonations = await getDonations(campaign.pId);

        campaignDonations.forEach((donation) => {
          if (
            donation.donator.toLowerCase() ===
            account.address.toLowerCase()
          ) {
            const donatedETH = Number(donation.donation);

            donationHistory.push({
              campaign: campaign.title,
              amount: donatedETH,
              date: "Recently",
            });

            activity.push({
              message: `Donated ${donatedETH} ETH to "${campaign.title}"`,
              icon: <FaDonate />,
              time: "Recently",
            });
          }
        });
      }

      setMyCampaigns(created);
      setDonations(donationHistory);
      setActivities(activity.reverse());
    };

    loadProfile();
  }, [account]);

  const totalDonated = donations.reduce(
    (acc, d) => acc + Number(d.amount || 0),
    0
  );

  return (
    <div className="w-full min-h-screen p-6 bg-gray-50 dark:bg-[#13131a] text-gray-900 dark:text-white">

      {/* PROFILE HEADER */}
      <div className="bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-none rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center md:justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gray-200 dark:bg-[#2a2a33] p-2 rounded-full">
            {account?.address && (
              <Jazzicon
                diameter={50}
                seed={jsNumberForAddress(account.address)}
              />
            )}
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
              <FaWallet /> Wallet
            </p>
            <p className="text-lg font-semibold">
              {account?.address?.slice(0, 6)}...
              {account?.address?.slice(-4)}
            </p>
            <p className="text-sm text-green-500 font-medium mt-1">
              Balance: {Number(walletBalance).toFixed(4)} ETH
            </p>
            <p className="text-sm text-black dark:text-white">
             ≈ ${usdValue} USD | ₹ {inrValue} INR
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-6 md:mt-0">
          <div className="bg-gray-100 dark:bg-[#2a2a33] p-4 rounded-xl text-center w-[130px] hover:scale-105 transition">
            <div className="bg-white dark:bg-[#1c1c24] w-10 h-10 flex items-center justify-center rounded-full mx-auto mb-2">
              <FaBullhorn className="text-green-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created
            </p>
            <p className="text-xl font-semibold">
              {myCampaigns.length}
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-[#2a2a33] p-4 rounded-xl text-center w-[130px] hover:scale-105 transition">
            <div className="bg-white dark:bg-[#1c1c24] w-10 h-10 flex items-center justify-center rounded-full mx-auto mb-2">
              <FaDonate className="text-green-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Donations
            </p>
            <p className="text-xl font-semibold">
              {donations.length}
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-[#2a2a33] p-4 rounded-xl text-center w-[130px] hover:scale-105 transition">
            <div className="bg-white dark:bg-[#1c1c24] w-10 h-10 flex items-center justify-center rounded-full mx-auto mb-2">
              <FaHistory className="text-green-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Donated
            </p>
            <p className="text-xl font-semibold">
              {totalDonated.toFixed(3)} ETH
            </p>
          </div>
        </div>
      </div>

      {/* ACTIVITY FEED */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4">
          Activity Feed
        </h3>
        {activities.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No activity yet
          </p>
        ) : (
          <div className="bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-none rounded-xl p-5 shadow-sm">
            {activities.map((act, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-gray-200 dark:border-[#2c2c34] py-3 last:border-none">
                <div className="bg-gray-200 dark:bg-[#2a2a33] w-9 h-9 flex items-center justify-center rounded-full text-green-400">
                  {act.icon}
                </div>
                <div className="flex-1">
                  <p>{act.message}</p>
                  <span className="text-gray-500 text-sm">
                    {act.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MY CAMPAIGNS */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4">
          My Campaigns
        </h3>
        {myCampaigns.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No campaigns created yet
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {myCampaigns.map((campaign) => {
              const progress =
                (Number(campaign.amountCollected) /
                  Number(campaign.target)) * 100;

              return (
                <div
                  key={campaign.pId}
                  className="bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-none rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition hover:scale-[1.02]">
                  <img
                    src={campaign.image}
                    alt="campaign"
                    className="h-[160px] w-full object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-semibold mb-2">
                      {campaign.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {campaign.amountCollected.toFixed(3)} / {campaign.target} ETH
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-[#2a2a33] rounded-full h-2 mt-2">
                      <div
                        className="bg-green-400 h-2 rounded-full"
                        style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Deadline: {campaign.deadline}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DONATION HISTORY */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          Donation History
        </h3>
        {donations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No donations yet
          </p>
        ) : (
          <div className="bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-none rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-[#2a2a33] text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="p-3 text-left">
                    Campaign
                  </th>
                  <th className="p-3 text-left">
                    Amount
                  </th>
                  <th className="p-3 text-left">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-200 dark:border-[#2c2c34]">
                    <td className="p-3">
                      {d.campaign}
                    </td>
                    <td className="p-3 text-green-500 font-semibold">
                      {Number(d.amount).toFixed(3)} ETH
                    </td>
                    <td className="p-3">
                      {d.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;