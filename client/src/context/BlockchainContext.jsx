import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  BrowserProvider,
  Contract,
  WebSocketProvider,
  parseEther,
  formatEther,
} from "ethers";
import ABI from "../contracts/NFTMarketplace.sol/NFTMarketplace.json";
import toast from "react-hot-toast";

const BlockchainContext = createContext();
export const useBlockchainContext = () => useContext(BlockchainContext);

const CONTRACT_ADDRESS = process.env.REACT_APP_MY_MARKET_PLACE_CONTRACT;
// Use wss:// for WebSocket — get from Alchemy dashboard
// e.g. wss://eth-sepolia.g.alchemy.com/v2/YOUR_KEY  OR  ws://127.0.0.1:8545 for localhost
const WS_RPC_URL = process.env.REACT_APP_WS_RPC_URL || "ws://127.0.0.1:8545";
const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

export const BlockchainProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null); // write contract (MetaMask signer)
  const [wsContract, setWsContract] = useState(null); // read-only contract (WebSocket)
  const [currentAccount, setCurrentAccount] = useState("");
  const [allNFTs, setAllNFTs] = useState([]); // all minted NFTs with metadata
  const [activeAuctions, setActiveAuctions] = useState([]); // live auctions from chain
  // const [loading, setLoading] = useState(false);

  // ─── Helper: Fetch IPFS metadata ────────────────────────────────────────────
  const fetchMetadata = async (tokenURI) => {
    try {
      const url = tokenURI.startsWith("ipfs://")
        ? IPFS_GATEWAY + tokenURI.slice(7)
        : IPFS_GATEWAY + tokenURI;
      const res = await fetch(url);
      const data = await res.json();
      if (data.image && !data.image.startsWith("http")) {
        data.image =
          IPFS_GATEWAY +
          (data.image.startsWith("ipfs://") ? data.image.slice(7) : data.image);
      }
      return data;
    } catch {
      return null;
    }
  };

  // ─── Load all NFTs with metadata ────────────────────────────────────────────
  const loadAllNFTs = useCallback(async (readContract) => {
    try {
      const tokens = await readContract.getAllNFTs();
      const enriched = await Promise.all(
        tokens.map(async (t) => {
          let meta = null;
          try {
            const uri = await readContract.tokenURI(t.tokenId);
            meta = await fetchMetadata(uri);
          } catch {}
          return {
            tokenId: t.tokenId.toString(),
            owner: t.owner,
            price: t.price ? formatEther(t.price) : "0",
            forSale: t.forSale,
            title: meta?.name || `NFT #${t.tokenId}`,
            description: meta?.description || "",
            image: meta?.image || "",
            creator: meta?.createdBy || "Unknown",
            minBid: meta?.minBid || "0",
          };
        }),
      );
      setAllNFTs(enriched);
    } catch (err) {
      console.error("loadAllNFTs:", err);
    }
  }, []);

  // ─── Load active auctions ────────────────────────────────────────────────────
  const loadActiveAuctions = useCallback(async (readContract) => {
    try {
      const auctions = await readContract.getActiveAuctions();
      const enriched = await Promise.all(
        auctions.map(async (a) => {
          let meta = null;
          try {
            const uri = await readContract.tokenURI(a.tokenId);
            meta = await fetchMetadata(uri);
          } catch {}
          const timeLeft = await readContract.getTimeLeft(a.auctionId);
          return {
            auctionId: a.auctionId.toString(),
            tokenId: a.tokenId.toString(),
            seller: a.seller,
            startingPrice: formatEther(a.startingPrice),
            highestBid:
              a.highestBid > 0n
                ? formatEther(a.highestBid)
                : formatEther(a.startingPrice),
            highestBidder: a.highestBidder,
            endTime: Number(a.endTime),
            timeLeft: Number(timeLeft),
            ended: a.ended,
            title: meta?.name || `NFT #${a.tokenId}`,
            image: meta?.image || "",
            creator: meta?.createdBy || "Unknown",
          };
        }),
      );
      setActiveAuctions(enriched);
    } catch (err) {
      console.error("loadActiveAuctions:", err);
    }
  }, []);

  // ─── Setup WebSocket provider for real-time events ──────────────────────────
  const setupWebSocket = useCallback(() => {
    let wsProvider;
    try {
      wsProvider = new WebSocketProvider(WS_RPC_URL);
      const readContract = new Contract(CONTRACT_ADDRESS, ABI.abi, wsProvider);
      setWsContract(readContract);

      // Load initial data
      loadAllNFTs(readContract);
      loadActiveAuctions(readContract);

      // 🔴 Real-time event listeners via WebSocket
      readContract.on("NFTMinted", (tokenId, owner) => {
        console.log(`📦 NFT #${tokenId} minted by ${owner}`);
        toast.success(`NFT #${tokenId} minted!`);
        loadAllNFTs(readContract);
      });

      readContract.on("NFTListed", (tokenId, seller, price) => {
        console.log(`🏷️ NFT #${tokenId} listed for ${formatEther(price)} ETH`);
        toast.success(`NFT #${tokenId} listed for ${formatEther(price)} ETH`);
        loadAllNFTs(readContract);
      });

      readContract.on("NFTSold", (tokenId, buyer, price) => {
        console.log(
          `💸 NFT #${tokenId} sold to ${buyer} for ${formatEther(price)} ETH`,
        );
        toast.success(`NFT #${tokenId} sold for ${formatEther(price)} ETH!`);
        loadAllNFTs(readContract);
      });

      readContract.on(
        "AuctionCreated",
        (auctionId, tokenId, startingPrice, endTime) => {
          console.log(`🔔 Auction #${auctionId} created for NFT #${tokenId}`);
          toast.success(`New auction started for NFT #${tokenId}!`);
          loadActiveAuctions(readContract);
        },
      );

      readContract.on("BidPlaced", (auctionId, bidder, amount) => {
        console.log(
          `💰 Bid on auction #${auctionId}: ${formatEther(
            amount,
          )} ETH by ${bidder}`,
        );
        toast(`New bid: ${formatEther(amount)} ETH on auction #${auctionId}`, {
          icon: "💰",
        });
        loadActiveAuctions(readContract);
      });

      readContract.on("AuctionEnded", (auctionId, winner, amount) => {
        if (winner === "0x0000000000000000000000000000000000000000") {
          toast(`Auction #${auctionId} ended — no bids`, { icon: "🔔" });
        } else {
          toast.success(
            `Auction #${auctionId} won by ${winner.slice(
              0,
              6,
            )}... for ${formatEther(amount)} ETH`,
          );
        }
        loadActiveAuctions(readContract);
        loadAllNFTs(readContract);
      });

      // Auto-reconnect on disconnect
      wsProvider.websocket.addEventListener("close", () => {
        console.warn("⚠️ WebSocket disconnected. Reconnecting...");
        setTimeout(setupWebSocket, 3000);
      });

      return readContract;
    } catch (err) {
      console.error("WebSocket setup failed, falling back to HTTP:", err);
      return null;
    }
  }, [loadAllNFTs, loadActiveAuctions]);

  // ─── Connect MetaMask wallet ─────────────────────────────────────────────────
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Install MetaMask");
        return;
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.error("connectWallet:", err);
    }
  };

  const reloadContract = async () => {
    if (!provider) return;
    const signer = await provider.getSigner();
    setContract(new Contract(CONTRACT_ADDRESS, ABI.abi, signer));
  };

  // ─── Blockchain Actions ──────────────────────────────────────────────────────

  const listNFTForSale = async (tokenId, priceEth) => {
    if (!contract) {
      toast.error("Connect wallet first");
      return;
    }
    const toastId = toast.loading("Listing NFT for sale...");
    try {
      const tx = await contract.listNFTForSale(
        tokenId,
        parseEther(priceEth.toString()),
      );
      await tx.wait();
      toast.success("NFT listed for sale!", { id: toastId });
    } catch (err) {
      toast.error("Failed to list: " + err.message, { id: toastId });
    }
  };

  const buyNFT = async (tokenId, priceEth) => {
    if (!contract) {
      toast.error("Connect wallet first");
      return;
    }
    const toastId = toast.loading("Buying NFT...");
    try {
      const tx = await contract.buyNFT(tokenId, {
        value: parseEther(priceEth.toString()),
      });
      await tx.wait();
      toast.success("NFT purchased!", { id: toastId });
    } catch (err) {
      toast.error("Purchase failed: " + err.message, { id: toastId });
    }
  };

  const createAuction = async (tokenId, startingPriceEth, durationSeconds) => {
    if (!contract) {
      toast.error("Connect wallet first");
      return;
    }
    const toastId = toast.loading("Creating auction...");
    try {
      const tx = await contract.createAuction(
        tokenId,
        parseEther(startingPriceEth.toString()),
        durationSeconds,
      );
      await tx.wait();
      toast.success("Auction created!", { id: toastId });
    } catch (err) {
      toast.error("Failed: " + err.message, { id: toastId });
    }
  };

  const placeBid = async (auctionId, bidAmountEth) => {
    if (!contract) {
      toast.error("Connect wallet first");
      return;
    }
    const toastId = toast.loading("Placing bid...");
    try {
      const tx = await contract.placeBid(auctionId, {
        value: parseEther(bidAmountEth.toString()),
      });
      await tx.wait();
      toast.success("Bid placed!", { id: toastId });
    } catch (err) {
      toast.error("Bid failed: " + err.message, { id: toastId });
    }
  };

  const endAuction = async (auctionId) => {
    if (!contract) {
      toast.error("Connect wallet first");
      return;
    }
    const toastId = toast.loading("Ending auction...");
    try {
      const tx = await contract.endAuction(auctionId);
      await tx.wait();
      toast.success("Auction ended!", { id: toastId });
    } catch (err) {
      toast.error("Failed: " + err.message, { id: toastId });
    }
  };

  const withdrawBid = async (auctionId) => {
    if (!contract) {
      toast.error("Connect wallet first");
      return;
    }
    const toastId = toast.loading("Withdrawing...");
    try {
      const tx = await contract.withdraw(auctionId);
      await tx.wait();
      toast.success("Withdrawn successfully!", { id: toastId });
    } catch (err) {
      toast.error("Withdraw failed: " + err.message, { id: toastId });
    }
  };

  // ─── Init MetaMask ───────────────────────────────────────────────────────────
  useEffect(() => {
    const loadWeb3 = async () => {
      if (!window.ethereum) {
        window.alert("Install MetaMask!");
        return;
      }

      const _provider = new BrowserProvider(window.ethereum);
      setProvider(_provider);

      window.ethereum.on("accountsChanged", async (accounts) => {
        if (!accounts.length) {
          setCurrentAccount("");
          setContract(null);
          return;
        }
        const signer = await _provider.getSigner(accounts[0]);
        setContract(new Contract(CONTRACT_ADDRESS, ABI.abi, signer));
        setCurrentAccount(accounts[0]);
      });
    };
    loadWeb3();
  }, []);

  // ─── Load contract when provider ready ─────────────────────────────────────
  useEffect(() => {
    const loadBlockchainData = async () => {
      if (!provider) return;
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (!accounts.length) return;
        const signer = await provider.getSigner(accounts[0]);
        setContract(new Contract(CONTRACT_ADDRESS, ABI.abi, signer));
        setCurrentAccount(accounts[0]);
      } catch (err) {
        console.error(err);
      }
    };
    loadBlockchainData();
  }, [provider]);

  // ─── Start WebSocket listener ────────────────────────────────────────────────
  useEffect(() => {
    const readContract = setupWebSocket();
    return () => {
      // cleanup listeners on unmount
      if (readContract) readContract.removeAllListeners();
    };
  }, [setupWebSocket]);

  const contextValue = {
    provider,
    contract,
    wsContract,
    currentAccount,
    allNFTs,
    activeAuctions,
    loading,
    connectWallet,
    reloadContract,
    listNFTForSale,
    buyNFT,
    createAuction,
    placeBid,
    endAuction,
    withdrawBid,
    loadAllNFTs: () => wsContract && loadAllNFTs(wsContract),
    loadActiveAuctions: () => wsContract && loadActiveAuctions(wsContract),
  };

  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  );
};
