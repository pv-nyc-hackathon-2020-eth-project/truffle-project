import React, { Component } from "react";
import Token from "./contracts/CadabraCoin.json";
import Marketplace from "./contracts/Marketplace.json";
import getWeb3 from "./getWeb3";

import { Button, Card, Row, Col, Container, Modal } from "react-bootstrap";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import "./App.css";

class Item {
  constructor(name, author,priceInUSD, priceInCDBRA) {
    this.name = name;
    this.author = author;
    this.priceInUSD = priceInUSD;
    this.priceInCDBRA = priceInCDBRA;
  }
}

class PurchasedItem {
  constructor(name, author, passage) {
    this.name = name;
    this.author = author;
    this.passage = passage;
  }
}

class App extends Component {
  state = { 
    web3: null, 
    currentAccount: null,
    token: null, 
    tokenSymbol: null,
    tokenAddress: null,
    marketplace: null,
    myTokens: null,
    itemsPurchased: [],
    itemsNotPurchased: [], 
    tokensToPurchase: 0,
    tokensToReturn: 0,
    newPassageTitle: "",
    newPassageText: "",
    newPassageAuthor: "",
    newPassagePriceInUSD: 0,
    displayModal: false,
    passageSelected: 0,
  };

  setupEventListenersAndPollers= () => {
    this.pollForAccountSwitch();
    this.setupMarketplaceListeners();
    this.state.token.events.TokensTransferred().on("data", async (event) => {
      console.log(event.returnValues);
    })
  }

  setupMarketplaceListeners = () => {
    this.state.marketplace.events.ItemPurchased().on("data", async (event) => {
      const payload = event.returnValues;
      console.log("ITEM PURHCASEED")

      const { item, addr } = payload;
      console.log(item, addr)
      if (addr === this.state.currentAccount) {
        const newBalance = await this.state.token.methods.balanceOf(this.state.currentAccount).call();
        const [itemsPurchased, itemsNotPurchased] = await this.getItems(this.state.marketplace);
        this.setState({myTokens: newBalance, itemsPurchased, itemsNotPurchased});
      }
    });

    this.state.marketplace.events.PassageAdded().on("data", async event => {
      const [itemsPurchased, itemsNotPurchased] = await this.getItems(this.state.marketplace);
      this.setState({itemsPurchased, itemsNotPurchased});
    })
  }

  pollForAccountSwitch = async () => {
    setInterval(async () => {
      const accounts = await this.state.web3.eth.getAccounts(); 
      const currentAccount = accounts[0];
      if (currentAccount !== this.state.currentAccount) {
        const balance = await this.state.token.methods.balanceOf(this.state.currentAccount).call();
        this.setState({currentAccount, myTokens: balance});
      } 
    }, 300);
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const currentAccount = (await web3.eth.getAccounts())[0];

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const token = new web3.eth.Contract(
        Token.abi, Token.networks[networkId] && Token.networks[networkId].address,
      );
      const tokenSymbol = await token.methods.symbol().call();
      const myTokens = await token.methods.balanceOf(currentAccount).call();


      const marketplaceAddress = Marketplace.networks[networkId].address;
      const marketplace = new web3.eth.Contract(
        Marketplace.abi, Marketplace.networks[networkId] && marketplaceAddress,
      )

      //Mocking purchased / not yet purchased;
      const [itemsPurchased, itemsNotPurchased] = await this.getItems(marketplace);

      this.setState({ 
        web3, 
        currentAccount, 
        token, 
        tokenSymbol,
        marketplaceAddress, 
        marketplace, 
        itemsPurchased, 
        itemsNotPurchased, 
        myTokens,
      }, this.setupEventListenersAndPollers);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  getItems = async marketplace => {
    const rawItems = await marketplace.methods.getAllItemsAndPrices().call();
    const allItems = rawItems.map(([itemId, author, usd, tokenCost]) => new Item(itemId, author, parseInt(usd), parseInt(tokenCost)));
    const itemsPurchased = (await marketplace.methods.getSenderPurchases().call()).map(({item, author, passage}) => new PurchasedItem(item, author, passage));
    console.log("debug")
    console.log(await marketplace.methods.getSenderPurchases().call())
    const itemsNotPurchased = allItems.filter(item => !(itemsPurchased.map(({name, passage}) => name).includes(item.name))); 
    return [itemsPurchased, itemsNotPurchased];
  }

  purchaseItem = async (itemId, costInTokens) => {
    const {token, marketplace, marketplaceAddress} = this.state;
    await token.methods.approve(marketplaceAddress, costInTokens).send({from: this.state.currentAccount}); 
    this.executeContractMethod(marketplace.methods.purchaseItem, itemId);
  }

  executeContractMethod = async (method, ...args) => {
    const estimatedGasLimit = await method(...args).estimateGas({from: this.state.currentAccount, gasPrice: "10"})
    await method(...args).send({from: this.state.currentAccount, gasLimit: estimatedGasLimit * 2})
  }

  purchaseTokens = async (amount) => {
    const {token, accounts} = this.state;
    await token.methods.purchaseTokens(amount).send({from: this.state.currentAccount});
    const newBalance = await token.methods.balanceOf(this.state.currentAccount).call();
    this.setState({myTokens: newBalance});
  }

  returnTokens = async (amount) => {
    const {token, currentAccount} = this.state;
    await token.methods.returnTokens(amount).send({from: currentAccount});
    const newBalance = await token.methods.balanceOf(currentAccount).call();
    this.setState({myTokens: newBalance});
  }

  submitNewItem = async (e) => {
    const {marketplace, newPassageTitle, newPassageAuthor, newPassageText, newPassagePriceInUSD} = this.state;
    this.executeContractMethod(marketplace.methods.addItem, newPassageTitle, newPassageAuthor, newPassageText, newPassagePriceInUSD);
    const [itemsPurchased, itemsNotPurchased] = await this.getItems(marketplace);
    this.setState({newPassageTitle: "", newPassageText: "", newPassagePriceInUSD: 0, itemsPurchased, itemsNotPurchased})
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <Container className="my-4 bg-info text-white">
        <Row style={{textAlign: "left"}}>
          <Col xs={12}>My account: <span className="bg-warning text-dark">{this.state.currentAccount}</span></Col>
        </Row>
        <Row>
          <Col xs={12}>
            <div className="d-flex">My {this.state.tokenSymbol}: {this.state.myTokens}</div>
            <div className="d-flex">
              <input className="m-2" value={this.state.tokensToPurchase} onChange={(e) => {this.setState({tokensToPurchase: e.target.value})}}></input>
              <Button variant="secondary" className="h-50" onClick={() => this.purchaseTokens(this.state.tokensToPurchase)}>Purchase</Button>

              <input className="m-2" value={this.state.tokensToReturn} onChange={(e) => {this.setState({tokensToReturn: e.target.value})}}></input>
              <Button variant="secondary" className="h-50" onClick={() => this.returnTokens(this.state.tokensToReturn)}>Return</Button>
            </div>
          </Col>
        </Row>
        </Container>
        <Container className="m-auto">

          {this.state.itemsPurchased[this.state.passageSelected] ? <Modal show={this.state.displayModal} onHide={() => this.setState({displayModal: false})}>
            <Modal.Header closeButton>
              <Modal.Title>{this.state.itemsPurchased[this.state.passageSelected].name}</Modal.Title>
              <div>{this.state.itemsPurchased[this.state.passageSelected].author}</div>
            </Modal.Header>
            <Modal.Body>
              {this.state.itemsPurchased[this.state.passageSelected].passage}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => this.setState({displayModal: false})}>Close</Button>
            </Modal.Footer>
          </Modal> : <div></div>}

          <div style={{textAlign: "left"}}>View your passages.</div>
          <ItemsPurchasedCarousel 
            readButtonClickHandler={(i) => this.setState({displayModal: true, passageSelected: i})}
            itemsPurchased={this.state.itemsPurchased}>
          </ItemsPurchasedCarousel> 

          <div style={{textAlign: "left"}}>Passages available for purchase.</div>
          <ItemsNotPurchasedCarousel 
            tokenSymbol={this.state.tokenSymbol} 
            itemsNotPurchased={this.state.itemsNotPurchased} 
            onClickHandler={this.purchaseItem}>
          </ItemsNotPurchasedCarousel>

          <div className="mt-3" style={{textAlign: "left"}}>Add your own passage!</div>
          <div className="d-flex my-2">
            <label className="mx-2">Title</label>
            <input value={this.state.newPassageTitle} onChange={(e) => this.setState({newPassageTitle: e.target.value})}></input>
            <label className="mx-2">Author</label>
            <input value={this.state.newPassageAuthor} onChange={e => this.setState({newPassageAuthor: e.target.value})}></input>
            <label className="mx-2">Price</label>
            <input value={this.state.newPassagePriceInUSD} onChange={e => this.setState({newPassagePriceInUSD: parseInt(e.target.value)})}></input>
          </div>
          <div className="d-flex my-2"><textarea cols="100" rows="10" style={{height: "15em", width: "80vw"}} value={this.state.newPassageText} onChange={(e) => this.setState({newPassageText: e.target.value})} placeholder="Add your own passage here:"></textarea></div>
          <button onClick={this.submitNewItem}>Author it!</button>
        </Container>
      </div>
    );
  }
}

const ItemsPurchasedCarousel = ({itemsPurchased, readButtonClickHandler}) => (
    <Carousel 
      responsive={{all: {breakpoint: {max: 3000, min: 1}, items: 3}}}
      className="mb-4"
      itemClass="mx-2"
    >
      {itemsPurchased.map((item, i) => 
        <Card className="border border-dark" style={{width: "15em"}}>
          <Card.Body>
            <Card.Title>{item.name}</Card.Title>
            <Card.Subtitle>{item.author}</Card.Subtitle>
            <Button variant="outline-success" onClick={() => readButtonClickHandler(i)}>Read</Button>
          </Card.Body>
        </Card>)}
    </Carousel>
  )

  const ItemsNotPurchasedCarousel = ({itemsNotPurchased, onClickHandler, tokenSymbol}) => (
    <Carousel 
      responsive={{all: {breakpoint: {max: 3000, min: 1}, items: 3}}}
      className="mb-4"
      itemClass="mx-2"
    >
    {itemsNotPurchased.map(item => 
      <Card className="border border-dark" style={{width: "15em"}}>
        <Card.Body>
          <Card.Title>{item.name}</Card.Title>
          <Card.Subtitle>{item.author}</Card.Subtitle> 
          <Card.Text>${item.priceInUSD} | {item.priceInCDBRA} {tokenSymbol}</Card.Text> 
          <Button variant="outline-success" onClick={() => onClickHandler(item.name, item.priceInCDBRA)}>Purchase</Button>
        </Card.Body>
      </Card>)}
  </Carousel> 
  )

export default App;
