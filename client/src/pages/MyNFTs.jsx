import React, { useState } from "react";
import { useBlockchainContext } from "../context/BlockchainContext";
import { Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import CommonSection from "../components/ui/Common-section/CommonSection";
import "../styles/market.css";

const MyNFTCard = ({ nft }) => {
  const { listNFTForSale, createAuction, currentAccount } =
    useBlockchainContext();
  const [mode, setMode] = useState(null);
  const [listPrice, setListPrice] = useState("");
  const [auctionPrice, setAuctionPrice] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("86400");

  return (
    <div className="single__nft__card">
      <div className="nft__img" style={{ position: "relative" }}>
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
            Listed ✅
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
              <h6>Token ID</h6>
              <p>#{nft.tokenId}</p>
            </div>
            <div>
              <h6>{nft.forSale ? "Listed Price" : "Status"}</h6>
              <p style={{ color: nft.forSale ? "#27ae60" : "#aaa" }}>
                {nft.forSale ? `${nft.price} ETH` : "Not Listed"}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {nft.description && (
          <p style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}>
            {nft.description.slice(0, 60)}
            {nft.description.length > 60 ? "..." : ""}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3">
          {!nft.forSale && !mode && (
            <div className="d-flex gap-2">
              <button
                className="bid__btn flex-fill"
                style={{ background: "#27ae60" }}
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
                style={{
                  width: "100%",
                  padding: "6px",
                  marginBottom: "6px",
                  borderRadius: "5px",
                  border: "1px solid #27ae60",
                  background: "#1a1a2e",
                  color: "#fff",
                }}
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
                style={{
                  width: "100%",
                  padding: "6px",
                  marginBottom: "6px",
                  borderRadius: "5px",
                  border: "1px solid #8e44ad",
                  background: "#1a1a2e",
                  color: "#fff",
                }}
              />
              <select
                value={auctionDuration}
                onChange={(e) => setAuctionDuration(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px",
                  marginBottom: "6px",
                  borderRadius: "5px",
                  border: "1px solid #8e44ad",
                  background: "#1a1a2e",
                  color: "#fff",
                }}
              >
                <option value="120">2 min</option>
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
                  Start Auction
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

          {nft.forSale && (
            <p
              style={{
                color: "#27ae60",
                textAlign: "center",
                marginTop: "8px",
                fontSize: "13px",
              }}
            >
              ✅ Listed for {nft.price} ETH — waiting for buyer
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const MyNFTs = () => {
  const { allNFTs, currentAccount } = useBlockchainContext();

  // Filter NFTs owned by current account
  const myNFTs = allNFTs.filter(
    (nft) => nft.owner?.toLowerCase() === currentAccount?.toLowerCase(),
  );

  return (
    <>
      <CommonSection title={"Your NFTs"} />
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
                  Please connect your wallet to view your NFTs.
                </p>
              </Col>
            </Row>
          ) : myNFTs.length === 0 ? (
            <Row>
              <Col
                lg="12"
                className="text-center"
                style={{ padding: "60px", color: "#aaa" }}
              >
                <i className="ri-image-line" style={{ fontSize: "48px" }}></i>
                <p className="mt-3">You don't have any NFTs yet!</p>
                <Link to="/create">
                  <button className="bid__btn mt-3">+ Create NFT</button>
                </Link>
              </Col>
            </Row>
          ) : (
            <Row>
              <Col lg="12" className="mb-4">
                <h5 style={{ color: "#fff" }}>
                  You own{" "}
                  <span style={{ color: "#e74c3c" }}>{myNFTs.length}</span> NFT
                  {myNFTs.length > 1 ? "s" : ""}
                </h5>
              </Col>
              {myNFTs.map((nft) => (
                <Col
                  lg="3"
                  md="4"
                  sm="6"
                  className="mb-4"
                  key={nft.tokenId}
                  style={{ position: "relative" }}
                >
                  <MyNFTCard nft={nft} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>
    </>
  );
};

export default MyNFTs;
