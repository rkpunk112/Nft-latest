import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";
import * as dotenv from "dotenv";
import tokenABI from "../client/src/contracts/IndianToken.sol/IndianToken.json";

dotenv.config();

const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const senderWallet = new Wallet(
    process.env.PRIVATE_KEY!,
    provider
);

const token = new Contract(
    process.env.TOKEN_ADDRESS!,
    tokenABI.abi,
    senderWallet
);

export async function sendTokens(to: string, amount: string) {
    const tx = await token.transfer(
        to,
        parseUnits(amount, 18)
    );

    await tx.wait();
    return tx.hash;
};
