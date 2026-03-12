const hre = require("hardhat");

async function main() {
  const CrowdFunding = await hre.ethers.getContractFactory("CrowdFunding");
  const crowdFunding = await CrowdFunding.deploy();

  await crowdFunding.deployed();   // ✅ v5 syntax

  console.log("Contract deployed to:", crowdFunding.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});