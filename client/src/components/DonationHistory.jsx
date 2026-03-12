import React, { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useStateContext } from "../context";

const DonationHistory = ({ campaignId }) => {
  const { getDonations } = useStateContext();
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    const fetchDonations = async () => {
      const data = await getDonations(campaignId);

      const donors = data?.donators || [];
      const amounts = data?.donations || [];

      const formatted = donors.map((donor, i) => ({
        donator: donor,
        donation: amounts[i],
      }));

      setDonations(formatted.reverse());
    };

    fetchDonations();
  }, [campaignId]);

  return (
    <div className="mt-6 bg-white dark:bg-[#1c1c24] p-4 rounded-lg shadow">

      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Donation History
      </h3>

      {donations.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          No donations yet.
        </p>
      )}

      {donations.map((item, index) => (
        <div
          key={index}
          className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-2"
        >
          <p className="text-gray-700 dark:text-gray-300">
            {item.donator.slice(0, 6)}...{item.donator.slice(-4)}
          </p>

          <p className="font-semibold text-purple-500">
            {parseFloat(item.donation).toFixed(4)} ETH
          </p>
        </div>
      ))}
    </div>
  );
};

export default DonationHistory;