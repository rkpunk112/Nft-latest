import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import { useBlockchainContext } from "../context/BlockchainContext";
import CommonSection from "../components/ui/Common-section/CommonSection";

const formatTimeLeft = (seconds) => {
  if (!seconds || seconds <= 0) return "Ended";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const summaryBox = (borderColor, color = "#fff") => ({
  border: `2px solid ${borderColor}`,
  borderRadius: "10px",
  padding: "12px 20px",
  color,
  background: "#1a1a2e",
  textAlign: "center",
  minWidth: "120px",
  fontSize: "13px",
});

const BidCard = ({ auction, currentAccount, withdrawBid, endAuction }) => {
  const [timeLeft, setTimeLeft] = useState(auction.timeLeft);

  const isExpired = timeLeft <= 0;
  const isWinning =
    auction.highestBidder?.toLowerCase() === currentAccount?.toLowerCase();
  const pendingAmount = auction.pendingReturn || "0";
  const hasPending = parseFloat(pendingAmount) > 0;

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

  let statusLabel, statusColor;
  if (!isExpired) {
    statusLabel = isWinning ? "Winning 🏆" : "Outbid ❌";
    statusColor = isWinning ? "#27ae60" : "#e74c3c";
  } else {
    statusLabel = isWinning ? "You Won! 🎉" : "Lost";
    statusColor = isWinning ? "#f1c40f" : "#aaa";
  }

  return (
    <div
      className="single__nft__card"
      style={{ border: `2px solid ${statusColor}`, borderRadius: "12px" }}
    >
      <div className="nft__img" style={{ position: "relative" }}>
        {auction.image ? (
          <img src={auction.image} alt={auction.title} className="w-100" />
        ) : (
          <div
            className="w-100 d-flex align-items-center justify-content-center"
            style={{ height: "180px", background: "#1a1a2e", color: "#aaa" }}
          >
            No Image
          </div>
        )}
        <span
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: statusColor,
            color: statusColor === "#f1c40f" ? "#000" : "#fff",
            padding: "3px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="nft__content">
        <h5 className="nft__title">
          <Link to={`/market/${auction.tokenId}`}>
            {auction.title || `NFT #${auction.tokenId}`}
          </Link>
        </h5>

        <div
          className="d-flex justify-content-between mt-2"
          style={{ fontSize: "13px", color: "#aaa" }}
        >
          <div>
            <small>Current Bid</small>
            <p style={{ color: "#e74c3c", fontWeight: "bold", margin: 0 }}>
              {auction.highestBid} ETH
            </p>
          </div>
          <div>
            <small>Time Left</small>
            <p
              style={{
                color: isExpired ? "#e74c3c" : "#27ae60",
                fontWeight: "bold",
                margin: 0,
              }}
            >
              ⏱ {formatTimeLeft(timeLeft)}
            </p>
          </div>
          <div>
            <small>Auction ID</small>
            <p style={{ margin: 0 }}>#{auction.auctionId}</p>
          </div>
        </div>

        {hasPending && (
          <div
            className="mt-2 p-2"
            style={{
              background: "#1a1a2e",
              borderRadius: "8px",
              border: "1px solid #f39c12",
            }}
          >
            <small style={{ color: "#f39c12" }}>
              💰 {pendingAmount} ETH refund available to withdraw
            </small>
          </div>
        )}

        <div className="mt-3">
          {isExpired && isWinning && (
            <button
              className="bid__btn w-100"
              style={{ background: "#f1c40f", color: "#000" }}
              onClick={() => endAuction(auction.auctionId)}
            >
              🏁 Claim Your NFT!
            </button>
          )}

          {isExpired && !isWinning && hasPending && (
            <button
              className="bid__btn w-100"
              style={{ background: "#27ae60" }}
              onClick={() => withdrawBid(auction.auctionId)}
            >
              💰 Withdraw {pendingAmount} ETH
            </button>
          )}

          {!isExpired && !isWinning && hasPending && (
            <div className="d-flex gap-2">
              <button
                className="bid__btn flex-fill"
                style={{ background: "#27ae60" }}
                onClick={() => withdrawBid(auction.auctionId)}
              >
                💰 Withdraw
              </button>
              <Link to="/" className="flex-fill">
                <button
                  className="bid__btn w-100"
                  style={{ background: "#e74c3c" }}
                >
                  🔄 Bid Again
                </button>
              </Link>
            </div>
          )}

          {!isExpired && isWinning && (
            <p
              style={{
                color: "#27ae60",
                textAlign: "center",
                fontSize: "13px",
                margin: 0,
              }}
            >
              ✅ You are currently winning!
            </p>
          )}

          {isExpired && !isWinning && !hasPending && (
            <p
              style={{
                color: "#aaa",
                textAlign: "center",
                fontSize: "13px",
                margin: 0,
              }}
            >
              😔 You lost this auction.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const MyBids = () => {
  const {
    activeAuctions,
    currentAccount,
    withdrawBid,
    endAuction,
    contract,
    loadActiveAuctions,
  } = useBlockchainContext();
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findMyBids = async () => {
      if (!currentAccount || !activeAuctions.length) {
        setLoading(false);
        return;
      }
      const bids = [];
      for (const auction of activeAuctions) {
        const isHighestBidder =
          auction.highestBidder?.toLowerCase() === currentAccount.toLowerCase();
        let pendingReturn = "0";
        if (contract) {
          try {
            const pending = await contract.pendingReturns(
              auction.auctionId,
              currentAccount,
            );
            pendingReturn =
              Number(pending) > 0 ? (Number(pending) / 1e18).toFixed(4) : "0";
          } catch (e) {}
        }
        if (isHighestBidder || parseFloat(pendingReturn) > 0) {
          bids.push({ ...auction, pendingReturn });
        }
      }
      setMyBids(bids);
      setLoading(false);
    };
    findMyBids();
  }, [activeAuctions, currentAccount, contract]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (loadActiveAuctions) loadActiveAuctions();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadActiveAuctions]);

  const winning = myBids.filter(
    (a) =>
      a.timeLeft > 0 &&
      a.highestBidder?.toLowerCase() === currentAccount?.toLowerCase(),
  ).length;
  const outbid = myBids.filter(
    (a) =>
      a.timeLeft > 0 &&
      a.highestBidder?.toLowerCase() !== currentAccount?.toLowerCase(),
  ).length;
  const won = myBids.filter(
    (a) =>
      a.timeLeft <= 0 &&
      a.highestBidder?.toLowerCase() === currentAccount?.toLowerCase(),
  ).length;
  const pendingRefunds = myBids.filter(
    (a) => parseFloat(a.pendingReturn) > 0,
  ).length;

  return (
    <>
      <CommonSection title={"My Bids"} />
      <section>
        <Container>
          {!currentAccount ? (
            <Row>
              <Col
                lg="12"
                className="text-center"
                style={{ padding: "60px", color: "#aaa" }}
              >
                <i className="ri-wallet-line" style={{ fontSize: "48px" }}></i>
                <p className="mt-3">
                  Please connect your wallet to see your bids.
                </p>
              </Col>
            </Row>
          ) : loading ? (
            <Row>
              <Col
                lg="12"
                className="text-center"
                style={{ padding: "60px", color: "#aaa" }}
              >
                <p>Loading your bids...</p>
              </Col>
            </Row>
          ) : (
            <>
              {myBids.length > 0 && (
                <Row className="mb-4">
                  <Col lg="12">
                    <div className="d-flex gap-3 flex-wrap">
                      <div style={summaryBox("#27ae60")}>
                        🏆 Winning
                        <br />
                        <strong>{winning}</strong>
                      </div>
                      <div style={summaryBox("#e74c3c")}>
                        ❌ Outbid
                        <br />
                        <strong>{outbid}</strong>
                      </div>
                      <div style={summaryBox("#f1c40f", "#000")}>
                        🎉 Won
                        <br />
                        <strong>{won}</strong>
                      </div>
                      <div style={summaryBox("#f39c12")}>
                        💰 Refunds
                        <br />
                        <strong>{pendingRefunds}</strong>
                      </div>
                    </div>
                  </Col>
                </Row>
              )}

              {myBids.length === 0 ? (
                <Row>
                  <Col
                    lg="12"
                    className="text-center"
                    style={{ padding: "60px", color: "#aaa" }}
                  >
                    <i
                      className="ri-auction-line"
                      style={{ fontSize: "48px" }}
                    ></i>
                    <p className="mt-3">You haven't placed any bids yet!</p>
                    <Link to="/">
                      <button className="bid__btn mt-3">
                        🔨 View Live Auctions
                      </button>
                    </Link>
                  </Col>
                </Row>
              ) : (
                <Row>
                  {myBids.map((auction) => (
                    <Col
                      lg="3"
                      md="4"
                      sm="6"
                      className="mb-4"
                      key={auction.auctionId}
                    >
                      <BidCard
                        auction={auction}
                        currentAccount={currentAccount}
                        withdrawBid={withdrawBid}
                        endAuction={endAuction}
                      />
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}
        </Container>
      </section>
    </>
  );
};

export default MyBids;
