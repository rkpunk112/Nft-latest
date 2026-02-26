import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home";
import Market from "../pages/Market";
import Create from "../pages/Create";
import MyNFTs from "../pages/MyNFTs";
import NftDetails from "../pages/NftDetails";
import MyBids from "../pages/MyBids"; // ← ADD THIS LINE

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route path="/market" element={<Market />} />
      <Route path="/market/:id" element={<NftDetails />} />
      <Route path="/create" element={<Create />} />
      <Route path="/mynfts" element={<MyNFTs />} />
      <Route path="/mybids" element={<MyBids />} /> {/* ← ADD THIS */}
    </Routes>
  );
};

export default Routers;
