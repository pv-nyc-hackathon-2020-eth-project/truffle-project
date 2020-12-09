pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract MyToken is ERC20 {
  address constant public defaultAddress = 0xE0711c14f112EDa3600eCC9e7Ae704a7C7C1732a;
  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) public {
    //_mint(address(this), 1000);
    //transfer(defaultAddress, 100);
    _mint(defaultAddress, 1000);
  }
}
