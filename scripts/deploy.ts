import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  console.log("Deploying NFTMarketplace...");

  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const nftmarketplace = await NFTMarketplace.deploy();

  await nftmarketplace.waitForDeployment();

  const address = await nftmarketplace.getAddress();
  console.log("NFTMarketplace deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
