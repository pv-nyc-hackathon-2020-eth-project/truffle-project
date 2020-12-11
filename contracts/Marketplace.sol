pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './CadabraCoin.sol';

contract Marketplace {

  struct itemStruct {
    string item;
    string author;
    uint priceInUSD;
    uint priceInCDBRA;
  }

  struct purchasedItemStruct {
    string item;
    string author;
    string passage;
  }

  address public cadabraCoinAddress;
  uint numberOfItems;
  uint earningsInUSD;
  uint totalCDBRADiscount;
  uint currentCDBRADiscount;
  mapping(string => itemStruct) private itemsAndPricesMapping;
  mapping(uint => string) private itemNumberToItemName;
  mapping(string => string) private itemToPassage;
  mapping(address => purchasedItemStruct[]) private addressToPurchases;

  constructor(address _cadabraCoinAddress) public {
    cadabraCoinAddress = _cadabraCoinAddress;

    itemsAndPricesMapping["The Swimmer"] = itemStruct({item: "The Swimmer", author: "John Cheever", priceInUSD: 10, priceInCDBRA: 10 * 1000});
    itemNumberToItemName[0] = "The Swimmer";
    itemToPassage["The Swimmer"] = "Then there was a fine noise of rushing water from the crown of an oak at his back, as if a spigot there had been turned. Then the noise of fountains came from the crowns of all the tall trees. Why did he love storms, what was the meaning of his excitement when the door sprang open and the rain wind fled rudely up the stair, why had the simple task of shutting the windows of an old house seem fitting and urgent, why did the first watery notes of a storm wind have for him the unmistakable sound of good news, cheer, glad tidings?";

    itemsAndPricesMapping["The Great Gatsby"] = itemStruct({item: "The Great Gatsby", author: "F. Scott Fitzgerald", priceInUSD: 20, priceInCDBRA: 20 * 1000});
    itemNumberToItemName[1] = "The Great Gatsby";
    itemToPassage["The Great Gatsby"] = "And as I sat there brooding on the old, unknown world, I thought of Gatsby’s wonder when he first picked out the green light at the end of Daisy’s dock. He had come a long way to this blue lawn, and his dream must have seemed so close that he could hardly fail to grasp it. He did not know that it was already behind him, somewhere back in that vast obscurity beyond the city, where the dark fields of the republic rolled on under the night.";

    itemsAndPricesMapping["Fahrenheit 451"] = itemStruct({item: "Fahrenheit 451", author: "Ray Bradbury", priceInUSD: 30, priceInCDBRA: 30 * 1000});
    itemNumberToItemName[2] = "Fahrenheit 451";
    itemToPassage["Fahrenheit 451"] = "Books were only one type of receptacle where we stored a lot of things we were afraid we might forget. There is nothing magical in them, at all. The magic is only in what books say, how they stitched the patches of the universe together into one garment for us.";

    itemsAndPricesMapping["To Kill a Mockingbird"] = itemStruct({item: "To Kill a Mockingbird", author: "Harper Lee", priceInUSD: 40, priceInCDBRA: 40 * 1000});
    itemNumberToItemName[3] = "To Kill a Mockingbird";
    itemToPassage["To Kill a Mockingbird"] = "Atticus said to Jem one day, “I’d rather you shot at tin cans in the back yard, but I know you’ll go after birds. Shoot all the bluejays you want, if you can hit ‘em, but remember it’s a sin to kill a mockingbird.” That was the only time I ever heard Atticus say it was a sin to do something, and I asked Miss Maudie about it. “Your father’s right,” she said. “Mockingbirds don’t do one thing but make music for us to enjoy. They don’t eat up people’s gardens, don’t nest in corncribs, they don’t do one thing but sing their hearts out for us. That’s why it’s a sin to kill a mockingbird.”";

    itemsAndPricesMapping["Of Mice and Men"] = itemStruct({item: "Of Mice and Men", author: "John Steinbeck", priceInUSD: 50, priceInCDBRA: 50 * 1000});
    itemNumberToItemName[4] = "Of Mice and Men";
    itemToPassage["Of Mice and Men"] = "As happens sometimes, a moment settled and hovered and remained for much more than a moment. And sound stopped and movement stopped for much, much more than a moment.";

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

  function addItem(string memory _item, string memory _author, string memory _passage, uint _priceInUSD) public {
    uint priceOfItemInCDBRA = (_priceInUSD * 1000) - totalCDBRADiscount;
    itemsAndPricesMapping[_item] = itemStruct({item: _item, author: _author, priceInUSD: _priceInUSD, priceInCDBRA: priceOfItemInCDBRA});
    itemToPassage[_item] = _passage;
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
    string memory itemAuthor = itemsAndPricesMapping[_item].author;
    deductCDBRAFromPurchaserOfItem(priceOfItemInCDBRA);
    addCustomerPurchase(msg.sender, _item, itemAuthor, itemToPassage[_item]);
    //Increment marketplace earnings in USD
    earningsInUSD = earningsInUSD + priceOfItemInUSD;
    //Update all of the item prices in CDBRA now that earnings have been incremented
    updateCDBRADiscount();
    updateItemPricesInCDBRA();
    return _item;
  }

  function addCustomerPurchase(address _address, string memory _item, string memory _author, string memory _passage) private {
    addressToPurchases[_address].push(purchasedItemStruct({item: _item, author: _author, passage: _passage}));
  }

  function getSenderPurchases() public view returns (purchasedItemStruct[] memory) {
    return addressToPurchases[msg.sender];
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
