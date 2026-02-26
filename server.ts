import express from "express";
import cors from "cors";
import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

const abi = [
    "function transfer(address to, uint256 amount) returns (bool)"
];

const token = new Contract(
    process.env.TOKEN_ADDRESS!,
    abi,
    wallet
);

app.post("/send-tokens", async (req, res) => {
    try {
        const { to, amount } = req.body;

        const tx = await token.transfer(to, parseUnits(amount, 18));
        await tx.wait();

        res.json({ txHash: tx.hash });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(4000, () => {
    console.log("Backend running on http://localhost:4000");
});
