import { BrowserProvider } from "ethers";
import { useState } from "react";
import "../styles/BuyTokens.css";


const IndianToken = () => {
    const TokenAddress = "0x0072bd0388d3112d4850471b307ab2898c282656"
    const [importAddress, setImportAddress] = useState("");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [amount, setAmount] = useState("");

    const requestTokens = async (amount) => {
        try {
            if (!window.ethereum) {
                alert("MetaMask not found");
                return;
            }

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const receiver = await signer.getAddress();

            setStatus("Requesting tokens...");



            const res = await fetch("http://localhost:4000/send-tokens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: receiver,
                    amount: amount,
                    // change this amount to whatever you want to send
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            setImportAddress(`import token from: ${TokenAddress}`);
        } catch (err) {
            setStatus(`❌ Failed to receive tokens \n ${err}`);
        }
    };

    const handleSend = async () => {
        if (!amount || Number(amount) <= 0) {
            setStatus("error");
            setMessage("Enter a valid token amount");
            return;
        }

        try {
            setStatus("pending");
            setMessage("Transaction pending...");

            await requestTokens(amount); // 👈 wait for tx

            setStatus("success");
            setMessage("✅ Transaction successful!");
            setAmount("");


        } catch (err) {
            console.error(err);
            setStatus("error");

            if (err.code === 4001) {
                setMessage("❌ Transaction rejected by user");
            } else {
                setMessage("❌ Transaction failed");
            }
        }
    };

    return (
        <div className="token-container">
            <div className="token-card">
                <h2 className="token-title">Request Tokens</h2>

                <input
                    type="number"
                    className="token-input"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={status === "pending"}
                />

                <button
                    className="token-button"
                    onClick={handleSend}
                    disabled={status === "pending"}
                >
                    {status === "pending" ? "⏳ Sending..." : "Buy Tokens"}
                </button>

                {status !== "idle" && (
                    <p className={`tx-status ${status}`}>
                        {message}
                    </p>
                )}
                {status === "success" && importAddress && (
                    <p className="tx-from">

                        <span className="tx-address">
                            {importAddress}
                        </span>
                    </p>
                )}
            </div>
        </div>
    );

};

export default IndianToken;