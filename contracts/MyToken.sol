pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract MyToken is ERC20 {
  address constant public defaultAddress = 0xE0711c14f112EDa3600eCC9e7Ae704a7C7C1732a;
  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) public {
    _mint(defaultAddress, 100000000);
  }

  function purchaseTokens(uint256 _amount) public {
    _transfer(defaultAddress, msg.sender, _amount);
  }
}
