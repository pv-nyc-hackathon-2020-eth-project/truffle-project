pragma solidity ^0.6.0;

import './MyToken.sol';

contract Marketplace {
  string[] public items;
  uint256[] public prices;
  address myTokenAddress;

  constructor() public {
    items.push("item_1");
    prices.push(10);
    items.push("item_2");
    prices.push(20);
  }

  function getItem1() public view returns (string memory) {
    return items[0];
  }

  function getPriceForItem1() public view returns (uint256) {
    return prices[0];
  }

  function getItem2() public view returns (string memory) {
    return items[1];
  }

  function getPriceForItem2() public view returns (uint256) {
    return prices[1];
  }

  function getMyTokenAddress() public view returns (address) {
    return myTokenAddress;
  }

  function setMyTokenAddress(address _myTokenAddress) public {
    myTokenAddress = _myTokenAddress;
  }

  //This method does not seem to properly return the number of MyTokens associated
  //with the marketplace's address, but given the revised implementation plan, it is
  //likely not necessary
  function getMarketplaceBalanceOfMyToken() public view returns (uint256) {
    MyToken myToken = MyToken(myTokenAddress);
    myToken.balanceOf(address(this));
  }

  //have a get method to return bytes32[] array of item names
  //have a method to return array of associated prices

  //delegate permission for marketplace to transfer Tokens
  //then transfer tokens from msg.sender to address(myToken)
  //this will decrement the msg.sender balance
  //In addition make sure to increment the marketplace earnings in USD
}
