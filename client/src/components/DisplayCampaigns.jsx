import React from 'react';
import { useNavigate } from 'react-router-dom';
import FundCard from './FundCard';
import { loader } from '../assets';

const DisplayCampaigns = ({ title, isLoading, campaigns }) => {
  const navigate = useNavigate();

  const handleNavigate = (campaign) => {
    navigate(`/campaign-details/${campaign.title}`, { state: campaign });
  };

  return (
    <div className="mt-6">
      
      {/* Section Title */}
      <h1 className="font-epilogue font-semibold text-[20px] text-gray-800 dark:text-white text-left mb-4">
        {title} ({campaigns.length})
      </h1>

      {/* Campaign Container */}
      <div className="flex flex-wrap gap-[26px]">

        {/* Loader */}
        {isLoading && (
          <div className="flex justify-center items-center w-full py-10">
            <img
              src={loader}
              alt="loader"
              className="w-[80px] h-[80px] object-contain"
            />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && campaigns.length === 0 && (
          <p className="font-epilogue font-medium text-[14px] leading-[28px] text-gray-600 dark:text-gray-400">
            No campaigns available yet.
          </p>
        )}

        {/* Campaign Cards */}
        {!isLoading &&
          campaigns.length > 0 &&
          campaigns.map((campaign, index) => (
            <FundCard
              key={index}
              {...campaign}
              handleClick={() => handleNavigate(campaign)}
            />
          ))}
      </div>
    </div>
  );
};

export default DisplayCampaigns;