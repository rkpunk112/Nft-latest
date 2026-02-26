// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard {
    address payable public owner;
    uint256 public platformFeePercent = 2; // 2% fee

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    uint256 private _tokenIds;
    uint256 private _auctionIds;

    // ─── NFT Listing ──────────────────────────────────────────────────────────
    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        uint256 price;
        bool forSale;
    }

    // ─── Auction ──────────────────────────────────────────────────────────────
    struct Auction {
        uint256 auctionId;
        uint256 tokenId;
        address payable seller;
        uint256 startingPrice;
        uint256 highestBid;
        address payable highestBidder;
        uint256 endTime;
        bool ended;
    }

    mapping(uint256 => ListedToken) public idToListedToken;
    mapping(uint256 => Auction) public idToAuction;
    mapping(uint256 => uint256) public tokenToAuction;
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;

    // ─── Events ───────────────────────────────────────────────────────────────
    event NFTMinted(uint256 tokenId, address indexed owner);
    event NFTListed(uint256 tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 tokenId, address indexed buyer, uint256 price);
    event AuctionCreated(uint256 auctionId, uint256 tokenId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 auctionId, address indexed winner, uint256 amount);

    // ─── Mint ─────────────────────────────────────────────────────────────────
    function NFTminter(
        string memory tokenUri,
        address payable _receiverAddr
    ) public {
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _safeMint(_receiverAddr, newItemId);
        _setTokenURI(newItemId, tokenUri);
        idToListedToken[newItemId] = ListedToken(newItemId, _receiverAddr, 0, false);
        emit NFTMinted(newItemId, _receiverAddr);
    }

    // ─── List NFT for Fixed Sale ───────────────────────────────────────────────
    function listNFTForSale(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(price > 0, "Price must be > 0");
        require(
            tokenToAuction[tokenId] == 0 || idToAuction[tokenToAuction[tokenId]].ended,
            "NFT is in auction"
        );
        approve(address(this), tokenId);
        idToListedToken[tokenId].price = price;
        idToListedToken[tokenId].forSale = true;
        emit NFTListed(tokenId, msg.sender, price);
    }

    // ─── Buy NFT (Fixed Price) ─────────────────────────────────────────────────
    function buyNFT(uint256 tokenId) external payable nonReentrant {
        ListedToken storage listed = idToListedToken[tokenId];
        require(listed.forSale, "NFT not for sale");
        require(msg.value >= listed.price, "Insufficient payment");
        require(msg.sender != listed.owner, "Cannot buy your own NFT");

        address payable seller = listed.owner;
        uint256 price = listed.price;
        listed.forSale = false;
        listed.owner = payable(msg.sender);
        listed.price = 0;

        _transfer(seller, msg.sender, tokenId);

        uint256 fee = (price * platformFeePercent) / 100;
        seller.transfer(price - fee);
        owner.transfer(fee);
        if (msg.value > price) payable(msg.sender).transfer(msg.value - price);

        emit NFTSold(tokenId, msg.sender, price);
    }

    // ─── Create Auction ───────────────────────────────────────────────────────
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 durationSeconds
    ) external returns (uint256 auctionId) {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(startingPrice > 0, "Starting price must be > 0");
        require(durationSeconds >= 60 && durationSeconds <= 30 days, "Invalid duration");
        require(
            tokenToAuction[tokenId] == 0 || idToAuction[tokenToAuction[tokenId]].ended,
            "Auction already active"
        );
        require(!idToListedToken[tokenId].forSale, "Remove fixed listing first");

        _transfer(msg.sender, address(this), tokenId);
        _auctionIds++;
        auctionId = _auctionIds;

        idToAuction[auctionId] = Auction({
            auctionId: auctionId,
            tokenId: tokenId,
            seller: payable(msg.sender),
            startingPrice: startingPrice,
            highestBid: 0,
            highestBidder: payable(address(0)),
            endTime: block.timestamp + durationSeconds,
            ended: false
        });

        tokenToAuction[tokenId] = auctionId;
        idToListedToken[tokenId].owner = payable(address(this));
        emit AuctionCreated(auctionId, tokenId, startingPrice, block.timestamp + durationSeconds);
    }

    // ─── End Auction Early (Only Seller) ──────────────────────────────────────
    function endAuctionEarly(uint256 auctionId) external nonReentrant {
        Auction storage a = idToAuction[auctionId];
        require(!a.ended, "Already ended");
        require(msg.sender == a.seller, "Only seller can end early");
        require(block.timestamp < a.endTime, "Auction already expired, use endAuction()");

        a.ended = true;
        uint256 tokenId = a.tokenId;
        tokenToAuction[tokenId] = 0;

        if (a.highestBidder != address(0)) {
            _transfer(address(this), a.highestBidder, tokenId);
            idToListedToken[tokenId].owner = a.highestBidder;
            uint256 fee = (a.highestBid * platformFeePercent) / 100;
            a.seller.transfer(a.highestBid - fee);
            owner.transfer(fee);
            emit AuctionEnded(auctionId, a.highestBidder, a.highestBid);
        } else {
            _transfer(address(this), a.seller, tokenId);
            idToListedToken[tokenId].owner = a.seller;
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }

    // ─── Place Bid ────────────────────────────────────────────────────────────
    function placeBid(uint256 auctionId) external payable nonReentrant {
        Auction storage a = idToAuction[auctionId];
        require(!a.ended, "Auction ended");
        require(block.timestamp < a.endTime, "Auction expired");
        require(msg.sender != a.seller, "Seller cannot bid");
        uint256 minBid = a.highestBid == 0 ? a.startingPrice : a.highestBid + 1;
        require(msg.value >= minBid, "Bid too low");

        if (a.highestBidder != address(0)) {
            pendingReturns[auctionId][a.highestBidder] += a.highestBid;
        }
        a.highestBid = msg.value;
        a.highestBidder = payable(msg.sender);

        // Anti-snipe: extend by 5 min if bid placed in last 5 min
        if (a.endTime - block.timestamp < 5 minutes) {
            a.endTime += 5 minutes;
        }

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    // ─── End Auction (After Time Expires) ─────────────────────────────────────
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage a = idToAuction[auctionId];
        require(!a.ended, "Already ended");
        require(block.timestamp >= a.endTime, "Auction still running");

        a.ended = true;
        uint256 tokenId = a.tokenId;
        tokenToAuction[tokenId] = 0;

        if (a.highestBidder != address(0)) {
            // Transfer NFT to winner
            _transfer(address(this), a.highestBidder, tokenId);
            idToListedToken[tokenId].owner = a.highestBidder;

            // Pay seller minus platform fee
            uint256 fee = (a.highestBid * platformFeePercent) / 100;
            a.seller.transfer(a.highestBid - fee);
            owner.transfer(fee);

            emit AuctionEnded(auctionId, a.highestBidder, a.highestBid);
        } else {
            // No bids — return NFT to seller
            _transfer(address(this), a.seller, tokenId);
            idToListedToken[tokenId].owner = a.seller;
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }

    // ─── Withdraw Outbid Funds ────────────────────────────────────────────────
    function withdraw(uint256 auctionId) external nonReentrant {
        uint256 amount = pendingReturns[auctionId][msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingReturns[auctionId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // ─── View: All NFTs ───────────────────────────────────────────────────────
    function getAllNFTs() public view returns (ListedToken[] memory) {
        ListedToken[] memory tokens = new ListedToken[](_tokenIds);
        for (uint256 i = 1; i <= _tokenIds; i++) {
            tokens[i - 1] = idToListedToken[i];
        }
        return tokens;
    }

    // ─── View: My NFTs ────────────────────────────────────────────────────────
    function getMyNFTs(address userAddr) public view returns (ListedToken[] memory) {
        uint256 itemCount = 0;
        for (uint256 i = 1; i <= _tokenIds; i++) {
            if (idToListedToken[i].owner == userAddr) itemCount++;
        }
        ListedToken[] memory items = new ListedToken[](itemCount);
        uint256 idx = 0;
        for (uint256 i = 1; i <= _tokenIds; i++) {
            if (idToListedToken[i].owner == userAddr) items[idx++] = idToListedToken[i];
        }
        return items;
    }

    // ─── View: Active Auctions (includes expired but unsettled) ───────────────
    function getActiveAuctions() public view returns (Auction[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= _auctionIds; i++) {
            if (!idToAuction[i].ended) count++;   // ✅ no time check!
        }
        Auction[] memory active = new Auction[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= _auctionIds; i++) {
            if (!idToAuction[i].ended) {           // ✅ no time check!
                active[idx++] = idToAuction[i];
            }
        }
        return active;
    }

    // ─── View: Single Auction ─────────────────────────────────────────────────
    function getAuction(uint256 auctionId) public view returns (Auction memory) {
        return idToAuction[auctionId];
    }

    // ─── View: Time Left ──────────────────────────────────────────────────────
    function getTimeLeft(uint256 auctionId) public view returns (uint256) {
        Auction storage a = idToAuction[auctionId];
        if (block.timestamp >= a.endTime) return 0;
        return a.endTime - block.timestamp;
    }

    // ─── View: Totals ─────────────────────────────────────────────────────────
    function totalTokens() public view returns (uint256) { return _tokenIds; }
    function totalAuctions() public view returns (uint256) { return _auctionIds; }
}
