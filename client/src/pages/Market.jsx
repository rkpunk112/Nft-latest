import React, { useState } from "react";
import CommonSection from "../components/ui/Common-section/CommonSection";
import { Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import { useBlockchainContext } from "../context/BlockchainContext";
import "../styles/market.css";

const MarketNFTCard = ({ nft }) => {
  const {
    buyNFT,
    createAuction,
    listNFTForSale,
    endAuctionEarly,
    currentAccount,
  } = useBlockchainContext();
  // eslint-disable-next-line no-unused-vars
  const [showActions, setShowActions] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [auctionPrice, setAuctionPrice] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("300");
  const [mode, setMode] = useState(null); // "sell" | "auction"

  const isOwner = nft.owner?.toLowerCase() === currentAccount?.toLowerCase();
  const isAuctionActive = nft.auction && nft.auction.isActive;

  return (
    <div className="single__nft__card">
      <div className="nft__img">
        {nft.image ? (
          <img src={nft.image} alt={nft.title} className="w-100" />
        ) : (
          <div
            className="w-100 d-flex align-items-center justify-content-center"
            style={{ height: "200px", background: "#1a1a2e", color: "#aaa" }}
          >
            No Image
          </div>
        )}
        {nft.forSale && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "#27ae60",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: "20px",
              fontSize: "11px",
            }}
          >
            For Sale
          </span>
        )}
        {isAuctionActive && (
          <span
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "#8e44ad",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: "20px",
              fontSize: "11px",
            }}
          >
            🔨 Live Auction
          </span>
        )}
      </div>

      <div className="nft__content">
        <h5 className="nft__title">
          <Link to={`/market/${nft.tokenId}`}>{nft.title}</Link>
        </h5>

        <div className="creator__info-wrapper d-flex gap-3">
          <div className="creator__info w-100 d-flex align-items-center justify-content-between">
            <div>
              <h6>Creator</h6>
              <p>{nft.creator}</p>
            </div>
            <div>
              <h6>{nft.forSale ? "Price" : "Token ID"}</h6>
              <p style={{ color: nft.forSale ? "#e74c3c" : "#aaa" }}>
                {nft.forSale ? `${nft.price} ETH` : `#${nft.tokenId}`}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          {/* ── Buyer: Buy Now ─────────────────────────── */}
          {!isOwner && nft.forSale && (
            <button
              className="bid__btn w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={() => buyNFT(nft.tokenId, nft.price)}
            >
              <i className="ri-shopping-bag-line"></i> Buy for {nft.price} ETH
            </button>
          )}

          {/* ── Active Auction Display ─────────────────── */}
          {isAuctionActive && (
            <div
              style={{
                background: "#8e44ad20",
                padding: "10px",
                borderRadius: "5px",
                marginBottom: "10px",
                border: "1px solid #8e44ad40",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <p
                  style={{
                    color: "#8e44ad",
                    fontSize: "12px",
                    margin: "0 0 5px 0",
                    fontWeight: "600",
                  }}
                >
                  🔨 Auction in Progress
                </p>
                <p style={{ color: "#fff", fontSize: "14px", margin: "0" }}>
                  Current Bid:{" "}
                  <span style={{ color: "#8e44ad", fontWeight: "bold" }}>
                    {nft.auction.highestBid || nft.auction.startingPrice} ETH
                  </span>
                </p>
              </div>

              {isOwner && (
                <button
                  className="bid__btn w-100"
                  style={{
                    background: "#e74c3c",
                    fontSize: "0.85rem",
                    padding: "8px",
                  }}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to end this auction early? The NFT will go to the highest bidder.",
                      )
                    ) {
                      endAuctionEarly(nft.tokenId);
                    }
                  }}
                >
                  ⏹️ End Auction Now
                </button>
              )}
            </div>
          )}

          {/* ── Owner actions ──────────────────────────── */}
          {isOwner && !nft.forSale && !isAuctionActive && (
            <>
              {!mode && (
                <div className="d-flex gap-2">
                  <button
                    className="bid__btn flex-fill"
                    onClick={() => setMode("sell")}
                  >
                    🏷️ List
                  </button>
                  <button
                    className="bid__btn flex-fill"
                    style={{ background: "#8e44ad" }}
                    onClick={() => setMode("auction")}
                  >
                    🔨 Auction
                  </button>
                </div>
              )}

              {mode === "sell" && (
                <div>
                  <input
                    type="number"
                    placeholder="Price in ETH"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    className="auction__input"
                  />
                  <div className="d-flex gap-2">
                    <button
                      className="bid__btn flex-fill"
                      style={{ background: "#27ae60" }}
                      onClick={() => {
                        listNFTForSale(nft.tokenId, listPrice);
                        setMode(null);
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="bid__btn flex-fill"
                      style={{ background: "#666" }}
                      onClick={() => setMode(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {mode === "auction" && (
                <div>
                  <input
                    type="number"
                    placeholder="Starting bid (ETH)"
                    value={auctionPrice}
                    onChange={(e) => setAuctionPrice(e.target.value)}
                    className="auction__input"
                  />
                  <select
                    className="auction__duration__select"
                    value={auctionDuration}
                    onChange={(e) => setAuctionDuration(e.target.value)}
                  >
                    <option value="60">⚡ 1 Minute (Test)</option>
                    <option value="120">⚡ 2 Minutes (Test)</option>
                    <option value="300">⚡ 5 Minutes (Test)</option>
                    <option value="3600">1 Hour</option>
                    <option value="86400">24 Hours</option>
                    <option value="259200">3 Days</option>
                    <option value="604800">7 Days</option>
                  </select>
                  <div className="d-flex gap-2">
                    <button
                      className="bid__btn flex-fill"
                      style={{ background: "#8e44ad" }}
                      onClick={() => {
                        createAuction(
                          nft.tokenId,
                          auctionPrice,
                          parseInt(auctionDuration),
                        );
                        setMode(null);
                      }}
                    >
                      Start
                    </button>
                    <button
                      className="bid__btn flex-fill"
                      style={{ background: "#666" }}
                      onClick={() => setMode(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {isOwner && nft.forSale && (
            <p
              style={{
                color: "#27ae60",
                textAlign: "center",
                marginTop: "8px",
              }}
            >
              ✅ Listed — waiting for buyer
            </p>
          )}

          {!isOwner && !nft.forSale && !isAuctionActive && (
            <p
              style={{
                color: "#666",
                textAlign: "center",
                marginTop: "8px",
                fontSize: "13px",
              }}
            >
              Not for sale
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Market = () => {
  const { allNFTs } = useBlockchainContext();
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  let displayNFTs = [...allNFTs];

  if (filter === "sale") displayNFTs = displayNFTs.filter((n) => n.forSale);
  if (filter === "nosale") displayNFTs = displayNFTs.filter((n) => !n.forSale);
  if (filter === "auction")
    displayNFTs = displayNFTs.filter((n) => n.auction?.isActive);

  if (sortBy === "high")
    displayNFTs.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  if (sortBy === "low")
    displayNFTs.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

  return (
    <>
      <CommonSection title={"MarketPlace"} />
      <section>
        <Container>
          <Row>
            <Col lg="12" className="mb-5">
              <div className="market__product__filter d-flex align-items-center justify-content-between">
                <div className="filter__left d-flex align-items-center gap-5">
                  <div className="all__category__filter">
                    <select onChange={(e) => setFilter(e.target.value)}>
                      <option value="all">All NFTs</option>
                      <option value="sale">For Sale</option>
                      <option value="auction">Live Auctions</option>
                      <option value="nosale">Not Listed</option>
                    </select>
                  </div>
                </div>
                <div className="filter__right">
                  <select onChange={(e) => setSortBy(e.target.value)}>
                    <option value="default">Sort By</option>
                    <option value="high">High Price</option>
                    <option value="low">Low Price</option>
                  </select>
                </div>
              </div>
            </Col>

            {displayNFTs.length === 0 ? (
              <Col
                lg="12"
                className="text-center"
                style={{ color: "#aaa", padding: "60px" }}
              >
                <i className="ri-store-2-line" style={{ fontSize: "48px" }}></i>
                <p className="mt-3">
                  No NFTs found. Mint some from the Create page!
                </p>
              </Col>
            ) : (
              displayNFTs.map((nft) => (
                <Col
                  lg="3"
                  md="4"
                  sm="6"
                  className="mb-4"
                  key={nft.tokenId}
                  style={{ position: "relative" }}
                >
                  <MarketNFTCard nft={nft} />
                </Col>
              ))
            )}
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Market;
