import React, { Component } from "react";
import Token from "./contracts/CadabraCoin.json";
import Marketplace from "./contracts/Marketplace.json";
import getWeb3 from "./getWeb3";

import { Button, Card, Row, Col, Container, Title } from "react-bootstrap";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import "./App.css";

class Item {
  constructor(name, priceInUSD, priceInCDBRA) {
    this.name = name;
    this.priceInUSD = priceInUSD;
    this.priceInCDBRA = priceInCDBRA;
  }
}

class App extends Component {
  state = { 
    web3: null, 
    accounts: null, 
    token: null, 
    tokenAddress: null,
    marketplace: null,
    myAccount: null,
    myTokens: null,
    itemsPurchased: [],
    itemsNotPurchased: [], 
    tokensToPurchase: 0,
    tokensToReturn: 0,
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

      const marketplaceAddress = Marketplace.networks[networkId].address;
      const marketplace = new web3.eth.Contract(
        Marketplace.abi,
        Marketplace.networks[networkId] && marketplaceAddress,
      )

      const rawItems = await marketplace.methods.getAllItemsAndPrices().call();
      const allItems = rawItems.map(item => new Item(item[0], parseInt(item[1]), parseInt(item[2])))

      // First account is always the current account; Should poll every x ms to update this.
      const balance = await token.methods.balanceOf(accounts[0]).call();

      //Mocking purchased / not yet purchased;
      const itemsPurchased = await marketplace.methods.getSenderPurchases().call();
      console.log(itemsPurchased);
      const itemsNotPurchased = allItems.filter(item => !(itemsPurchased.map(itemPurchased => itemPurchased.item).includes(item.name)))

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, token, marketplaceAddress, marketplace, itemsPurchased, itemsNotPurchased, myAccount: accounts[0], myTokens: balance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  purchaseItem = async (itemId, costInTokens) => {
    const {token, marketplace, accounts, marketplaceAddress} = this.state;
    await token.methods.approve(marketplaceAddress, costInTokens).send({from: accounts[0]}); 
    await marketplace.methods.purchaseItem(itemId).send({from: accounts[0]})
    const newBalance = await token.methods.balanceOf(accounts[0]).call();
    this.setState({myTokens: newBalance});
  }

  purchaseTokens = async (amount) => {
    const {token, accounts} = this.state;
    await token.methods.purchaseTokens(amount).send({from: accounts[0]});
    const newBalance = await token.methods.balanceOf(accounts[0]).call();
    this.setState({myTokens: newBalance});
  }

  returnTokens = async (amount) => {
    const {token, accounts} = this.state;
    await token.methods.returnTokens(amount).send({from: accounts[0]});
    const newBalance = await token.methods.balanceOf(accounts[0]).call();
    this.setState({myTokens: newBalance});
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <Container className="my-4 bg-info text-white">
        <Row style={{textAlign: "left"}}>
          <Col xs={12}>My account: <span className="bg-warning text-dark">{this.state.myAccount}</span></Col>
        </Row>
        <Row>
          <Col xs={12}>
            <div>My tokens: {this.state.myTokens}</div>
            <input value={this.state.tokensToPurchase} onChange={(e) => {
              this.setState({tokensToPurchase: e.target.value})
            }}></input>
            <Button onClick={() => this.purchaseTokens(this.state.tokensToPurchase)}>Purchase</Button>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <input value={this.state.tokensToReturn} onChange={(e) => {
              this.setState({tokensToReturn: e.target.value})
            }}></input>
            <Button onClick={() => this.returnTokens(this.state.tokensToReturn)}>Return</Button>
          </Col>
        </Row>
        </Container>
        <Container className="m-auto">
          <div style={{textAlign: "left"}}>Books already purchased</div>
          <ItemsPurchasedCarousel itemsPurchased={this.state.itemsPurchased}></ItemsPurchasedCarousel> 

          <div style={{textAlign: "left"}}>Books available for purchase</div>
          <ItemsNotPurchasedCarousel itemsNotPurchased={this.state.itemsNotPurchased} onClickHandler={this.purchaseItem}></ItemsNotPurchasedCarousel>
        </Container>
      </div>
    );
  }
}

const ItemsPurchasedCarousel = ({itemsPurchased}) => (
    <Carousel 
      responsive={{all: {breakpoint: {max: 3000, min: 1}, items: 3}}}
      className="mb-4"
      itemClass="mx-2"
    >
      {itemsPurchased.map(item => 
        <Card className="border border-dark" style={{width: "15em"}}>
          <Card.Body>
            <Card.Title>{item.item}</Card.Title>
            <Button variant="outline-success">View</Button>
          </Card.Body>
        </Card>)}
    </Carousel>
  )

  const ItemsNotPurchasedCarousel = ({itemsNotPurchased, onClickHandler}) => (
    <Carousel 
      responsive={{all: {breakpoint: {max: 3000, min: 1}, items: 3}}}
      itemClass="mx-2"
    >
    {itemsNotPurchased.map(item => 
      <Card className="border border-dark" style={{width: "15em"}}>
        <Card.Body>
          <Card.Title>{item.name}</Card.Title>
          <Card.Text>${item.priceInUSD}</Card.Text> 
          <Card.Text>T{item.priceInCDBRA}</Card.Text> 
          <Button variant="outline-success" onClick={() => onClickHandler(item.name, item.priceInCDBRA)}>Purchase</Button>
        </Card.Body>
      </Card>)}
  </Carousel> 
  )

export default App;
