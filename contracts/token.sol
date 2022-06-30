//SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Wish is ERC20 {
    constructor(uint256 initialSupply) ERC20("Wish Token", "WSH") {
        _mint(msg.sender, initialSupply);
    }
}
