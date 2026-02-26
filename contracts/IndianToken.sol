// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract IndianToken is ERC20, ERC20Permit {
    constructor(
        uint256 initialSupply
    ) ERC20("IndianToken", "INT") ERC20Permit("IndianToken") {
        _mint(msg.sender, initialSupply);
    }
}
