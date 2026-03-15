import React, { useEffect, useState } from "react";
import { useStateContext } from "../context";
import { useNavigate } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { formatEther } from "viem";

import { FaEthereum, FaBullhorn, FaCheckCircle, FaDonate } from "react-icons/fa";

import FundCard from "../components/FundCard";

const Home = () => {

  const { getCampaigns, getDonations } = useStateContext();
  const account = useActiveAccount();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {

    const fetchData = async () => {

      const campaignData = await getCampaigns();
      setCampaigns(campaignData || []);

      let allDonations = [];

      if (campaignData?.length > 0) {

        for (const campaign of campaignData) {

          const donationData = await getDonations(campaign.pId);

          donationData.forEach((d) => {

            allDonations.push({
              donator: d.donator,
              amount: d.donation,
            });

          });

        }

      }

      setDonations(allDonations.reverse());

    };

    fetchData();

  }, [getCampaigns, getDonations]);

  /* ---------- STATUS LOGIC ---------- */

  const getStatus = (campaign) => {

    if (campaign.status === 1) return "successful";
    if (campaign.status === 2) return "closed";

    return "active";

  };

  /* ---------- STATS ---------- */

  const totalRaised = campaigns.reduce((acc, c) => {

    const amount = c.amountCollected
      ? Number(formatEther(c.amountCollected))
      : 0;

    return acc + amount;

  }, 0);

  const activeCampaigns = campaigns.filter(
    (c) => getStatus(c) === "active"
  );

  const successfulCampaigns = campaigns.filter(
    (c) => getStatus(c) === "successful"
  );

  /* ---------- FILTER ---------- */

  const filteredCampaigns = campaigns.filter((c) => {

    if (filter === "active") return getStatus(c) === "active";
    if (filter === "successful") return getStatus(c) === "successful";
    if (filter === "closed") return getStatus(c) === "closed";
    if (filter === "mine") return account?.address === c.owner;

    return true;

  });

  return (

    <div className="relative p-6 space-y-10">

      {/* background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full"></div>

      {/* ---------- STATS ---------- */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <StatCard
          title="Total Raised"
          value={`${totalRaised.toFixed(2)} ETH`}
          icon={<FaEthereum />}
        />

        <StatCard
          title="Active Campaigns"
          value={activeCampaigns.length}
          icon={<FaBullhorn />}
        />

        <StatCard
          title="Successful"
          value={successfulCampaigns.length}
          icon={<FaCheckCircle />}
        />

        <StatCard
          title="Total Donations"
          value={donations.length}
          icon={<FaDonate />}
        />

      </div>

      {/* ---------- MAIN GRID ---------- */}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* CAMPAIGNS */}

        <div className="lg:col-span-3 space-y-6">

          {/* FILTER */}

          <div className="flex flex-wrap gap-3">

            {["all","active","successful","closed","mine"].map((f) => (

              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm capitalize
                transition-all duration-300
                hover:scale-105 hover:shadow-md
                ${
                  filter === f
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-[#1c1c24] dark:text-white hover:bg-emerald-500/20"
                }`}
              >
                {f}
              </button>

            ))}

          </div>

          {/* CAMPAIGNS GRID */}

          {campaigns.length === 0 && (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

              {[...Array(3)].map((_, i) => (

                <div
                  key={i}
                  className="h-60 rounded-xl bg-gray-200 dark:bg-[#1c1c24] animate-pulse"
                />

              ))}

            </div>

          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

            {filteredCampaigns.map((campaign, index) => (

              <div
                key={index}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >

                <FundCard
                  {...campaign}
                  handleClick={() =>
                    navigate(`/campaign-details/${campaign.pId}`, {
                      state: campaign,
                    })
                  }
                />

              </div>

            ))}

          </div>

        </div>

        {/* ---------- DONATIONS ---------- */}

        <div className="bg-gray-100 dark:bg-[#1c1c24] p-6 rounded-xl shadow">

          <h3 className="font-semibold mb-4 text-black dark:text-white">
            Recent Donations
          </h3>

          <div className="space-y-3">

            {donations.slice(0, 6).map((donation, i) => (

              <div
                key={i}
                className="flex justify-between text-sm border-b pb-2
                text-black dark:text-white
                hover:bg-emerald-500/10 rounded-md px-2 transition"
              >

                <span>
                  {donation.donator?.slice(0, 6)}...
                </span>

                <span className="text-green-500 font-semibold">
                  Donated {parseFloat(donation.amount).toFixed(4)} ETH
                </span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

};

export default Home;


/* ---------- STAT CARD ---------- */

const StatCard = ({ title, value, icon }) => {

  return (

    <div className="
      group
      bg-white dark:bg-[#1c1c24]
      p-6 rounded-xl
      shadow-md
      flex items-center gap-4
      transition-all duration-300
      hover:shadow-2xl
      hover:-translate-y-2
      hover:scale-[1.02]
      cursor-pointer
      border border-transparent
      hover:border-emerald-500/40
    ">

      <div className="
        p-3 rounded-xl
        bg-emerald-500/10
        text-emerald-500
        text-xl
        transition-all duration-300
        group-hover:scale-110
        group-hover:bg-emerald-500
        group-hover:text-white
      ">
        {icon}
      </div>

      <div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </p>

        <p className="text-xl font-bold dark:text-white group-hover:text-emerald-400">
          {value}
        </p>

      </div>

    </div>

  );

};