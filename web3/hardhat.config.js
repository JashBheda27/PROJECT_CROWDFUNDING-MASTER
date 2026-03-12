require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  defaultNetwork: "localhost",

  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    sepolia: {
      url: "https://sepolia.rpc.thirdweb.com",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};