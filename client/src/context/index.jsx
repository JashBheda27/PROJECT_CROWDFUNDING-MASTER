import { createContext, useContext } from "react";
import { createThirdwebClient, getContract, prepareContractCall, readContract } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { defineChain, sepolia } from "thirdweb/chains";
import CrowdfundingABI from "../constants/abi.json";
import { parseEther, formatEther } from "viem";

const StateContext = createContext();

// Thirdweb client
const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

// Hardhat chain definition
const hardhat = defineChain({
  id: 31337,
  rpc: "http://127.0.0.1:8545",
});

export const StateContextProvider = ({ children }) => {
  const account = useActiveAccount();
  const { mutateAsync: sendTx } = useSendTransaction();

  // Detect wallet network
  const chainId = account?.chainId;

  const selectedChain =
    chainId === 11155111 ? sepolia : hardhat;

  const selectedAddress =
    chainId === 11155111
      ? import.meta.env.VITE_SEPOLIA_CONTRACT
      : import.meta.env.VITE_LOCAL_CONTRACT;

  // Dynamic contract connection
  const contract = getContract({
    client,
    chain: selectedChain,
    address: selectedAddress,
    abi: CrowdfundingABI,
  });

  // GET USER CAMPAIGNS
  const getUserCampaigns = async () => {
    if (!account?.address) return [];

    const allCampaigns = await getCampaigns();

    return allCampaigns.filter(
      (campaign) =>
        campaign.owner.toLowerCase() === account.address.toLowerCase()
    );
  };

  // CREATE CAMPAIGN
  const createCampaign = async (form) => {
    const transaction = prepareContractCall({
      contract,
      method:
        "function createCampaign(address _owner, string _title, string _description, uint256 _target, uint256 _deadline, string _image, string _category)",
      params: [
        account?.address,
        form.title,
        form.description,
        form.target,
        form.deadline,
        form.image,
        form.category,
      ],
    });

    await sendTx(transaction);
  };

  // GET ALL CAMPAIGNS
  const getCampaigns = async () => {
    const data = await readContract({
      contract,
      method:
        "function getCampaigns() view returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, uint256 withdrawnAmount, string image, string category, uint8 status)[])",
    });

    return data.map((campaign, i) => ({
      ...campaign,
      status: Number(campaign.status),
      pId: i,
    }));
  };

  // DONATE
  const donate = async (pId, amount) => {
    const transaction = prepareContractCall({
      contract,
      method: "function donateToCampaign(uint256 _id)",
      params: [pId],
      value: parseEther(amount),
    });

    await sendTx(transaction);
  };

  // CLOSE CAMPAIGN
  const closeCampaign = async (pId) => {
    const transaction = prepareContractCall({
      contract,
      method: "function closeCampaign(uint256 _id)",
      params: [pId],
    });

    await sendTx(transaction);
  };

  // WITHDRAW FUNDS
  const payout = async (pId) => {
    const transaction = prepareContractCall({
      contract,
      method: "function payout(uint256 _id)",
      params: [pId],
    });

    await sendTx(transaction);
  };

  // REFUND DONATION
  const refund = async (pId) => {
    const transaction = prepareContractCall({
      contract,
      method: "function refund(uint256 _id)",
      params: [pId],
    });

    await sendTx(transaction);
  };

  // GET DONATIONS
  const getDonations = async (pId) => {
    const data = await readContract({
      contract,
      method:
        "function getDonators(uint256 _id) view returns (address[], uint256[])",
      params: [pId],
    });

    const [donators, donations] = data;

    const parsed = [];

    for (let i = 0; i < donators.length; i++) {
      parsed.push({
        donator: donators[i],
        donation: formatEther(donations[i]),
      });
    }

    return parsed;
  };

  // USER DONATION STATS
  const getUserDonationStats = async () => {
    if (!account?.address) return { totalDonated: 0, donationCount: 0 };

    const campaigns = await getCampaigns();

    let totalDonated = 0;
    let donationCount = 0;

    for (let i = 0; i < campaigns.length; i++) {
      const donations = await getDonations(i);

      donations.forEach((d) => {
        if (d.donator.toLowerCase() === account.address.toLowerCase()) {
          totalDonated += Number(d.donation);
          donationCount++;
        }
      });
    }

    return {
      totalDonated,
      donationCount,
    };
  };

  return (
    <StateContext.Provider
      value={{
        account,
        contract,
        createCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations,
        closeCampaign,
        payout,
        refund,
        getUserDonationStats,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);

