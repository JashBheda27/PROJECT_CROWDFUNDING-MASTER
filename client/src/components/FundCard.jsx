import React from 'react';
import { formatEther } from "viem";
import { tagType, thirdweb } from '../assets';
import { daysLeft } from '../utils';

const FundCard = ({
  owner,
  title,
  description,
  target,
  deadline,
  amountCollected,
  image,
  category,
  status: statusProp,
  handleClick
}) => {

 const remainingDays = statusProp === 0 ? daysLeft(deadline) : 0;

  const formattedTarget = target ? formatEther(target) : "0";
  const formattedRaised = amountCollected ? formatEther(amountCollected) : "0";

  // Campaign Status Logic
  const now = Math.floor(Date.now() / 1000);
let status = "Active";
let statusColor = "bg-green-500";

if (statusProp === 1) {
  status = "Successful";
  statusColor = "bg-blue-500";
}
else if (statusProp === 2) {
  status = "Closed";
  statusColor = "bg-gray-500";
}

  return (
    <div
      className="sm:w-[288px] w-full rounded-[15px] 
      bg-white dark:bg-[#1c1c24] 
      border border-gray-200 dark:border-[#2c2f32]
      shadow-md hover:shadow-xl 
      transition-all duration-300 
      hover:scale-[1.02] cursor-pointer"
      onClick={handleClick}
    >

      {/* Image + Status */}
      <div className="relative">
        <img
          src={image}
          alt="fund"
          className="w-full h-[158px] object-cover rounded-t-[15px]"
        />

        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 text-[11px] font-semibold text-white rounded-full ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="flex flex-col p-4">

        {/* Category */}
        <div className="flex flex-row items-center mb-[18px]">
          <img src={tagType} alt="tag" className="w-[17px] h-[17px] object-contain" />
          <p className="ml-[12px] mt-[2px] px-2 py-[2px] text-[11px] rounded-full 
          bg-purple-100 text-purple-600 dark:bg-[#2c2f36] dark:text-purple-400 font-medium">
            {category || "General"}
          </p>
        </div>

        {/* Title + Description */}
        <div className="block">
          <h3 className="font-epilogue font-semibold text-[16px] text-black dark:text-white text-left leading-[26px] truncate">
            {title}
          </h3>

          <p className="mt-[5px] font-epilogue font-normal text-gray-500 dark:text-[#808191] text-left leading-[18px] truncate">
            {description}
          </p>
        </div>

        {/* Raised + Days */}
        <div className="flex justify-between flex-wrap mt-[15px] gap-2">

          <div className="flex flex-col">
            <h4 className="font-epilogue font-semibold text-[14px] text-gray-700 dark:text-[#b2b3bd] leading-[22px]">
              {formattedRaised}
            </h4>

            <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-gray-500 dark:text-[#808191] sm:max-w-[120px] truncate">
              Raised of {formattedTarget} ETH
            </p>
          </div>

          <div className="flex flex-col">
            <h4 className="font-epilogue font-semibold text-[14px] text-gray-700 dark:text-[#b2b3bd] leading-[22px]">
              {remainingDays}
            </h4>

            <p className="mt-[3px] font-epilogue font-normal text-[12px] leading-[18px] text-gray-500 dark:text-[#808191] sm:max-w-[120px] truncate">
              Days Left
            </p>
          </div>

        </div>

        {/* Owner */}
        <div className="flex items-center mt-[20px] gap-[12px]">

          <div className="w-[30px] h-[30px] rounded-full flex justify-center items-center bg-gray-200 dark:bg-[#13131a]">
            <img src={thirdweb} alt="user" className="w-1/2 h-1/2 object-contain" />
          </div>

          <p className="flex-1 font-epilogue font-normal text-[12px] text-gray-500 dark:text-[#808191] truncate">
            by <span className="text-gray-700 dark:text-[#b2b3bd]">
              {owner?.slice(0, 6)}...{owner?.slice(-4)}
            </span>
          </p>

        </div>

      </div>
    </div>
  )
}

export default FundCard;