pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './CadabraCoin.sol';

contract Marketplace {

  struct itemStruct {
    string item;
    uint priceInUSD;
    uint priceInCDBRA;
  }

  address public cadabraCoinAddress;
  uint numberOfItems;
  uint earningsInUSD;
  uint totalCDBRADiscount;
  uint currentCDBRADiscount;
  mapping(string => itemStruct) private itemsAndPricesMapping;
  mapping(uint => string) private itemNumberToItemName;

  constructor(address _cadabraCoinAddress) public {
    cadabraCoinAddress = _cadabraCoinAddress;

    itemsAndPricesMapping["item1"] = itemStruct({item: "item1", priceInUSD: 10, priceInCDBRA: 10 * 1000});
    itemNumberToItemName[0] = "item1";

    itemsAndPricesMapping["item2"] = itemStruct({item: "item2", priceInUSD: 20, priceInCDBRA: 20 * 1000});
    itemNumberToItemName[1] = "item2";

    itemsAndPricesMapping["item3"] = itemStruct({item: "item3", priceInUSD: 30, priceInCDBRA: 30 * 1000});
    itemNumberToItemName[2] = "item3";

    itemsAndPricesMapping["item4"] = itemStruct({item: "item4", priceInUSD: 40, priceInCDBRA: 40 * 1000});
    itemNumberToItemName[3] = "item4";

    itemsAndPricesMapping["item5"] = itemStruct({item: "item5", priceInUSD: 50, priceInCDBRA: 50 * 1000});
    itemNumberToItemName[4] = "item5";

    numberOfItems = 5;
    earningsInUSD = 0;
    totalCDBRADiscount = 0;
    currentCDBRADiscount = 0;
  }

  function getNumberOfItems() public view returns (uint) {
    return numberOfItems;
  }

  function getEarningsInUSD() public view returns (uint) {
      return earningsInUSD;
  }

  //Get all items and their respective prices in USD and CDBRA
  function getAllItemsAndPrices() public view returns (itemStruct[] memory) {
    itemStruct[] memory allItemsAndPrices = new itemStruct[](numberOfItems);
    for (uint i = 0; i < numberOfItems; i++) {
        string memory itemName = itemNumberToItemName[i];
        allItemsAndPrices[i] = itemsAndPricesMapping[itemName];
    }
    return allItemsAndPrices;
  }

  function addItem(string memory _item, uint _priceInUSD) public {
    uint priceOfItemInCDBRA = (_priceInUSD * 1000) - totalCDBRADiscount;
    itemsAndPricesMapping[_item] = itemStruct({item: _item, priceInUSD: _priceInUSD, priceInCDBRA: priceOfItemInCDBRA});
    itemNumberToItemName[numberOfItems] = _item;
    numberOfItems++;
  }

  function getUpdatedPriceOfItemInCDBRA(string memory _item) private view returns (uint) {
    uint updatedPriceOfItemInCDBRA;
    if(earningsInUSD == 0) {
      uint priceOfItemInUSD = itemsAndPricesMapping[_item].priceInUSD;
      updatedPriceOfItemInCDBRA = priceOfItemInUSD * 1000;
    }
    else {
      uint mostRecentPriceOfItemInCDBRA = itemsAndPricesMapping[_item].priceInCDBRA;
      //This formula ensures that as earnings rise, prices for items in terms of
      //CDBRA fall, but at a decelerating rate. This produces asymptotic behavior
      //ensuring that the price of an item never falls to 0 (or below 0)
      updatedPriceOfItemInCDBRA = mostRecentPriceOfItemInCDBRA - currentCDBRADiscount;
    }
    return updatedPriceOfItemInCDBRA;
  }

  function updateCDBRADiscount() private {
    currentCDBRADiscount = ((1 * 1000) / earningsInUSD);
    //We keep track of totalCDBRADiscount to discount the CDBRA price of newly added items
    //which did not have the opportunity to incrementally decrease their price as previous
    //earnings increased
    totalCDBRADiscount = totalCDBRADiscount + currentCDBRADiscount;
  }

  function purchaseItem(string memory _item) public returns (string memory) {
    uint priceOfItemInUSD = itemsAndPricesMapping[_item].priceInUSD;
    uint priceOfItemInCDBRA = itemsAndPricesMapping[_item].priceInCDBRA;
    deductCDBRAFromPurchaserOfItem(priceOfItemInCDBRA);
    //Increment marketplace earnings in USD
    earningsInUSD = earningsInUSD + priceOfItemInUSD;
    //Update all of the item prices in CDBRA now that earnings have been incremented
    updateCDBRADiscount();
    updateItemPricesInCDBRA();
    return _item;
  }

  function updateItemPricesInCDBRA() private {
    for (uint i = 0; i < numberOfItems; i++) {
        string memory itemName = itemNumberToItemName[i];
        itemsAndPricesMapping[itemName].priceInCDBRA = getUpdatedPriceOfItemInCDBRA(itemName);
    }
  }

  function deductCDBRAFromPurchaserOfItem(uint _priceOfItemInCDBRA) private {
    CadabraCoin cadabraCoin = CadabraCoin(cadabraCoinAddress);
    //TO DO: add check to require that the purchaser has enough CDBRA
    //Decrement the purchaser's CDBRA balance
    cadabraCoin.transferFrom(msg.sender, cadabraCoinAddress, _priceOfItemInCDBRA);
  }
}
