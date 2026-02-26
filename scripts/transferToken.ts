import { network } from "hardhat";
const { ethers } = await network.connect();

async function transferToken(address: string) {
    // Replace with your deployed ERC20 contract address
    const tokenAddress = address;

    // Replace with receiver wallet
    //const to = "0xc65b4d10b75b2f3c906b41689255fb0d0fab0261";

    const to = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

    // Amount to send (example: 10 tokens assuming 18 decimals)
    const amount = ethers.parseUnits("10", 18);

    // Load signer (Hardhat local account OR configured network account)
    const [signer] = await ethers.getSigners();

    console.log("Using signer:", await signer.getAddress());

    // Connect to ERC20 contract using its ABI
    const token = await ethers.getContractAt("IndianToken", tokenAddress, signer);


    // Check balance before transfer
    const balanceBefore = await token.balanceOf(await signer.getAddress());
    console.log("Balance before:", balanceBefore.toString());

    // Execute transfer
    const tx = await token.transfer(to, amount);
    console.log("Tx sent:", tx.hash);

    // Wait for confirmation
    await tx.wait();
    console.log("Transfer complete.");

    const balanceAfter = await token.balanceOf(await signer.getAddress());
    console.log("Balance after:", balanceAfter.toString());
}

export default transferToken;