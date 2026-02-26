import { network } from "hardhat";
const { ethers } = await network.connect();
import transferToken from "./transferToken.js"

async function main() {
    const initial = 1_000_000n * 10n ** 18n; // 1,000,000 MTK with 18 decimals
    const Token = await ethers.getContractFactory("IndianToken");
    const token = await Token.deploy(initial);
    await token.waitForDeployment();


    //should store this address
    console.log("IndianToken deployed to:", await token.getAddress());

    // the last address to which deployed
    // 0x0072bd0388d3112d4850471b307ab2898c282656
    // transferToken(await token.getAddress());
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});



