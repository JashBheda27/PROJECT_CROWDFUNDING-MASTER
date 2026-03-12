import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import abiFile from "../constants/abi.json";   

const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});
const CrowdfundingABI = abiFile.abi;

// Hardhat local chain
const localhost = defineChain({
  id: 31337,
  rpc: "http://127.0.0.1:8545",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
});

export const contract = getContract({
  client,
  chain: localhost,
  address: import.meta.env.VITE_CONTRACT_ADDRESS,
  abi: CrowdfundingABI,   // 👈 REQUIRED
});

