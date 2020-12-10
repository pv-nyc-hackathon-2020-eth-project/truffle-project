import React, { Component } from "react";
import Token from "./contracts/MyToken.json";
import Marketplace from "./contracts/Marketplace.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class Item {
  constructor(name, priceInUSD) {
    this.name = name;
    this.priceInUSD = priceInUSD;
  }
}

class App extends Component {
  state = { 
    web3: null, 
    accounts: null, 
    token: null, 
    marketplace: null,
    myAccount: null,
    myTokens: null,
    items: [], 
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const token = new web3.eth.Contract(
        Token.abi,
        Token.networks[networkId] && Token.networks[networkId].address,
      );

      const marketplace = new web3.eth.Contract(
        Marketplace.abi,
        Marketplace.networks[networkId] && Marketplace.networks[networkId].address,
      )

      const rawItems = await marketplace.methods.getAllItemsAndPrices().call();
      const items = rawItems.map(item => new Item(item[0], parseInt(item[1])))

      // First account is always the current account; Should poll every x ms to update this.
      const balance = await token.methods.balanceOf(accounts[0]).call();
      console.log(`Current account is: ${accounts[0]}`);
      console.log(`balance at app start: ${balance}`);
      await token.methods.purhcaseTokens(1000).send({from: accounts[0]});
      const newBalance = await token.methods.balanceOf(accounts[0]).call();
      console.log(`balance after initial purchase: ${newBalance}`);

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, token, marketplace, items, myAccount: accounts[0], myTokens: newBalance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract, token, marketplace, items } = this.state;
    console.log(items);
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div>My account {this.state.myAccount}</div>
        <div>My tokens {this.state.myTokens}</div>
        {this.state.items.map(item => 
          <div>Item name: {item.name} and item price in USD: {item.priceInUSD}</div>)}
      </div>
    );
  }
}

export default App;
