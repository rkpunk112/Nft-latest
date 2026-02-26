import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import { useBlockchainContext } from "../../../context/BlockchainContext";
import "./live-auction.css";

// Format countdown timer
const formatTimeLeft = (seconds) => {
  if (!seconds || seconds <= 0) return "Ended";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const AuctionCard = ({ auction }) => {
  // const { placeBid, endAuction, currentAccount, loadActiveAuctions } =
  //   useBlockchainContext();
  const [bidAmount, setBidAmount] = useState("");
  const [showBidInput, setShowBidInput] = useState(false);
  const [timeLeft, setTimeLeft] = useState(auction.timeLeft);
  const [isEnding, setIsEnding] = useState(false);

  const isExpired = timeLeft <= 0;
  const isSeller =
    auction.seller?.toLowerCase() === currentAccount?.toLowerCase();
  const isWinner =
    auction.highestBidder?.toLowerCase() === currentAccount?.toLowerCase();
  // const canEnd = isExpired && (isSeller || isWinner || true); // anyone can end

  // ── Live countdown timer ─────────────────────────────────────────
  useEffect(() => {
    setTimeLeft(auction.timeLeft);
  }, [auction.timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleEndAuction = async () => {
    setIsEnding(true);
    await endAuction(auction.auctionId);
    setIsEnding(false);
  };

  const handleBid = async () => {
    if (!bidAmount || isNaN(bidAmount)) return;
    await placeBid(auction.auctionId, bidAmount);
    setShowBidInput(false);
    setBidAmount("");
  };

  return (
    <div
      className="single__nft__card"
      style={{
        border: isExpired ? "2px solid #e74c3c" : "none",
        opacity: isExpired ? 0.9 : 1,
      }}
    >
      <div className="nft__img" style={{ position: "relative" }}>
        {auction.image ? (
          <img src={auction.image} alt={auction.title} className="w-100" />
        ) : (
          <div
            className="w-100 d-flex align-items-center justify-content-center"
            style={{
              height: "200px",
              background: "#1a1a2e",
              color: "#fff",
              fontSize: "14px",
            }}
          >
            No Image
          </div>
        )}

        {/* Live / Ended badge */}
        <span
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: isExpired ? "#e74c3c" : "#27ae60",
            color: "#fff",
            padding: "2px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {isExpired ? "⏰ ENDED" : "🔴 LIVE"}
        </span>
      </div>

      <div className="nft__content">
        <h5 className="nft__title">
          <Link to={`/market/${auction.tokenId}`}>{auction.title}</Link>
        </h5>

        <div className="creator__info-wrapper d-flex gap-3">
          <div className="creator__info w-100 d-flex align-items-center justify-content-between">
            <div>
              <h6>Current Bid</h6>
              <p style={{ color: "#e74c3c", fontWeight: "bold" }}>
                {auction.highestBid} ETH
              </p>
            </div>
            <div>
              <h6>Time Left</h6>
              <p
                style={{
                  color: isExpired
                    ? "#e74c3c"
                    : timeLeft < 300
                    ? "#f39c12"
                    : "#27ae60",
                  fontWeight: "bold",
                }}
              >
                ⏱ {formatTimeLeft(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* Highest bidder info */}
        {auction.highestBidder &&
          auction.highestBidder !==
            "0x0000000000000000000000000000000000000000" && (
            <div className="mt-1">
              <small style={{ color: "#aaa", fontSize: "11px" }}>
                🏆 Highest: {auction.highestBidder?.slice(0, 6)}...
                {auction.highestBidder?.slice(-4)}
                {isWinner && <span style={{ color: "#f1c40f" }}> (You!)</span>}
              </small>
            </div>
          )}

        <div className="creator__info-wrapper mt-1">
          <small style={{ color: "#aaa", fontSize: "11px" }}>
            Seller: {auction.seller?.slice(0, 6)}...{auction.seller?.slice(-4)}
            {isSeller && <span style={{ color: "#3498db" }}> (You)</span>}
          </small>
        </div>

        {/* Action Buttons */}
        <div className="mt-3">
          {/* ── Auction Ended ─────────────────────────────── */}
          {isExpired && (
            <div>
              <p
                style={{
                  color: "#e74c3c",
                  textAlign: "center",
                  fontSize: "13px",
                  marginBottom: "8px",
                }}
              >
                ⏰ Auction has ended!
              </p>
              <button
                className="bid__btn w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ background: isEnding ? "#666" : "#e74c3c" }}
                onClick={handleEndAuction}
                disabled={isEnding}
              >
                {isEnding ? "⏳ Processing..." : "🏁 Settle Auction"}
              </button>
              <small
                style={{
                  color: "#aaa",
                  fontSize: "11px",
                  textAlign: "center",
                  display: "block",
                  marginTop: "4px",
                }}
              >
                {auction.highestBidder !==
                "0x0000000000000000000000000000000000000000"
                  ? "NFT will transfer to winner"
                  : "No bids — NFT returns to seller"}
              </small>
            </div>
          )}

          {/* ── Auction Live ──────────────────────────────── */}
          {!isExpired &&
            (showBidInput ? (
              <div className="d-flex gap-2">
                <input
                  type="number"
                  placeholder={`Min: ${auction.highestBid} ETH`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    borderRadius: "5px",
                    border: "1px solid #e74c3c",
                    background: "#1a1a2e",
                    color: "#fff",
                  }}
                />
                <button className="bid__btn" onClick={handleBid}>
                  ✓
                </button>
                <button
                  className="bid__btn"
                  onClick={() => setShowBidInput(false)}
                  style={{ background: "#666" }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center justify-content-between">
                <button
                  className="bid__btn d-flex align-items-center gap-1"
                  onClick={() => {
                    if (!currentAccount) {
                      alert("Connect wallet first!");
                      return;
                    }
                    setShowBidInput(true);
                  }}
                  disabled={isSeller}
                  title={isSeller ? "You cannot bid on your own auction" : ""}
                >
                  <i className="ri-auction-line"></i>
                  {isSeller ? "Your Auction" : "Place Bid"}
                </button>
                <span className="history__link">
                  <small>Auction #{auction.auctionId}</small>
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const LiveAuction = () => {
  const { activeAuctions, loadActiveAuctions } = useBlockchainContext();

  // Auto-refresh every 30 seconds to check for newly ended auctions
  useEffect(() => {
    const interval = setInterval(() => {
      if (loadActiveAuctions) loadActiveAuctions();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [loadActiveAuctions]);

  // Split into live and ended
  const liveAuctions = activeAuctions.filter((a) => a.timeLeft > 0);
  const endedAuctions = activeAuctions.filter((a) => a.timeLeft <= 0);

  return (
    <section>
      <Container>
        <Row>
          <Col lg="12" className="mb-5">
            <div className="live__auction__top d-flex align-items-center justify-content-between">
              <h3>
                Live Auction
                {liveAuctions.length > 0 && (
                  <span
                    style={{
                      marginLeft: "10px",
                      background: "#27ae60",
                      color: "#fff",
                      padding: "2px 10px",
                      borderRadius: "20px",
                      fontSize: "14px",
                    }}
                  >
                    {liveAuctions.length} Live
                  </span>
                )}
                {endedAuctions.length > 0 && (
                  <span
                    style={{
                      marginLeft: "10px",
                      background: "#e74c3c",
                      color: "#fff",
                      padding: "2px 10px",
                      borderRadius: "20px",
                      fontSize: "14px",
                    }}
                  >
                    {endedAuctions.length} Needs Settling
                  </span>
                )}
              </h3>
              <span>
                <Link to="/market">Explore more</Link>
              </span>
            </div>
          </Col>

          {/* ── No Auctions ──────────────────────────────── */}
          {activeAuctions.length === 0 && (
            <Col
              lg="12"
              className="text-center"
              style={{ color: "#aaa", padding: "40px" }}
            >
              <i className="ri-auction-line" style={{ fontSize: "48px" }}></i>
              <p className="mt-3">
                No auctions right now. Create one from your NFTs!
              </p>
            </Col>
          )}

          {/* ── Live Auctions ─────────────────────────────── */}
          {liveAuctions.map((auction) => (
            <Col
              lg="3"
              md="4"
              sm="6"
              className="mb-4"
              key={auction.auctionId}
              style={{ position: "relative" }}
            >
              <AuctionCard auction={auction} />
            </Col>
          ))}

          {/* ── Ended Auctions (needs settling) ──────────── */}
          {endedAuctions.length > 0 && (
            <>
              <Col lg="12" className="mt-3 mb-3">
                <h5 style={{ color: "#e74c3c" }}>
                  ⏰ Ended — Click "Settle Auction" to finalize
                </h5>
              </Col>
              {endedAuctions.map((auction) => (
                <Col
                  lg="3"
                  md="4"
                  sm="6"
                  className="mb-4"
                  key={auction.auctionId}
                  style={{ position: "relative" }}
                >
                  <AuctionCard auction={auction} />
                </Col>
              ))}
            </>
          )}
        </Row>
      </Container>
    </section>
  );
};

export default LiveAuction;
