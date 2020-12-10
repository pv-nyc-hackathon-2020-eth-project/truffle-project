pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './MyToken.sol';

contract Marketplace {

  struct itemStruct {
    string item;
    uint price;
  }

  address myTokenAddress;
  uint numberOfItems;
  uint earningsInUSD;
  mapping(string => itemStruct) public itemsAndPricesMapping;
  mapping(uint => string) public itemNumberToItemName;
  mapping(string => uint) public itemToMostRecentPriceInMTK;

  constructor() public {

    itemsAndPricesMapping["item1"] = itemStruct({item: "item1", price: 10});
    itemToMostRecentPriceInMTK["item1"] = 10 * 1000;
    itemNumberToItemName[0] = "item1";

    itemsAndPricesMapping["item2"] = itemStruct({item: "item2", price: 20});
    itemToMostRecentPriceInMTK["item2"] = 20 * 1000;
    itemNumberToItemName[1] = "item2";

    itemsAndPricesMapping["item3"] = itemStruct({item: "item3", price: 30});
    itemToMostRecentPriceInMTK["item3"] = 30 * 1000;
    itemNumberToItemName[2] = "item3";

    itemsAndPricesMapping["item4"] = itemStruct({item: "item4", price: 40});
    itemToMostRecentPriceInMTK["item4"] = 40 * 1000;
    itemNumberToItemName[3] = "item4";

    itemsAndPricesMapping["item5"] = itemStruct({item: "item5", price: 50});
    itemToMostRecentPriceInMTK["item5"] = 50 * 1000;
    itemNumberToItemName[4] = "item5";

    numberOfItems = 5;
    earningsInUSD = 0;
  }

  function getNumberOfItems() public view returns (uint) {
    return numberOfItems;
  }

  function getEarningsInUSD() public view returns (uint) {
      return earningsInUSD;
  }

  //get all items and prices as an array of itemStructs
  function getAllItemsAndPrices() public view returns (itemStruct[] memory) {
    itemStruct[] memory allItemsAndPrices = new itemStruct[](numberOfItems);
    for (uint i = 0; i < numberOfItems; i++) {
        string memory itemName = itemNumberToItemName[i];
        allItemsAndPrices[i] = itemsAndPricesMapping[itemName];
    }
    return allItemsAndPrices;
  }

  function getMyTokenAddress() public view returns (address) {
    return myTokenAddress;
  }

  function setMyTokenAddress(address _myTokenAddress) public {
    myTokenAddress = _myTokenAddress;
  }

  function addItem(string memory _item, uint _price) public {
    itemsAndPricesMapping[_item] = itemStruct({item: _item, price: _price});
    itemToMostRecentPriceInMTK[_item] = _price * 1000;
    itemNumberToItemName[numberOfItems] = _item;
    numberOfItems++;
  }

  function getPriceOfItemInMTK(string memory _item) public view returns (uint) {
    uint priceOfItemInUSD = itemsAndPricesMapping[_item].price;
    uint priceOfItemInMTK;
    if(earningsInUSD == 0) {
      priceOfItemInMTK = priceOfItemInUSD * 1000;
    }
    else {
      uint mostRecentPriceInMTK = itemToMostRecentPriceInMTK[_item];
      //this formula ensures that as earnings rise, prices for items in terms of
      //MTK fall, but at a decelerating rate. This produces asymptotic behavior
      //ensuring that the price of an item never falls to 0 (or below 0) 
      priceOfItemInMTK = mostRecentPriceInMTK - ((1 * 1000) / earningsInUSD);
    }
    return priceOfItemInMTK;
  }

  function purchaseItem(string memory _item) public returns (string memory) {
    uint priceOfItemInUSD = itemsAndPricesMapping[_item].price;
    uint priceOfItemInMTK = getPriceOfItemInMTK(_item);
    deductMTKFromPurchaserOfItem(priceOfItemInMTK);
    //update the most recent price of the item in MTK
    itemToMostRecentPriceInMTK[_item] = priceOfItemInMTK;
    //increment marketplace earnings in USD
    earningsInUSD = earningsInUSD + priceOfItemInUSD;
    return _item;
  }

  function deductMTKFromPurchaserOfItem(uint _priceOfItemInMTK) private {
    MyToken myToken = MyToken(myTokenAddress);
    //decrement the purchaser's MTK balance
    myToken.transferFrom(msg.sender, myTokenAddress, _priceOfItemInMTK);
  }
}
