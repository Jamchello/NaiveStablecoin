import React, { Component } from 'react'
import Web3 from 'web3'
import './App.css'
import getWeb3 from './utils/getWeb3.js';


const InfuraEndPointKey = "d0f7b76ae5724e82ab871bba3643dfd3"; 

const OracleABI = [{"inputs":[{"internalType":"address","name":"_owner2","type":"address"},{"internalType":"address","name":"_owner3","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_time","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_value","type":"uint256"}],"name":"PriceUpdate","type":"event"},{"constant":true,"inputs":[],"name":"ETHGBP","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"string","name":"_value","type":"string"}],"name":"updatePriceServer1","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"string","name":"_value","type":"string"}],"name":"updatePriceServer2","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"string","name":"_value","type":"string"}],"name":"updatePriceServer3","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"updated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const OracleAddress = "0xE8DB3272f9424e72714c06Feb180A2b9157399c2";

const ST_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"burn","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_to","type":"address"}],"name":"deposit","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_st","type":"uint256"}],"name":"exchange","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_to","type":"address"}],"name":"mint","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_bt","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_oracle","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"bt","outputs":[{"internalType":"contract BT","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"buffer","outputs":[{"internalType":"int256","name":"bufferValue","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"collateralRatio","outputs":[{"internalType":"uint256","name":"ratio","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"unitPriceBT","outputs":[{"internalType":"uint256","name":"price","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"vault","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"vaultValue","outputs":[{"internalType":"uint256","name":"value","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const ST_Address = '0x17FC262010f34501bc6Ae4Bd48815D5709040e62';

const BT_ABI = [{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"uint256","name":"_quantity","type":"uint256"}],"name":"burn","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_quantity","type":"uint256"}],"name":"mint","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];
const BT_Address = "0x94Ed4002Ac0134737a954d17b6dEAa2d4A7eAD13";

const mint_desc = "Use current MetaMask account to send Ether to the Mint function on the ST contract. ST will be rewarded equivalent to GBP value of Ether sent.";
const burn_desc = "Burn ST tokens from current MetaMask account. The pound value of these tokens will be returned in Ether (minus burning fee)";
const deposit_desc = "Desposit Ether to the Deposit function (from current MetaMask account). Will add BT tokens to current accounts balance at the BT unit price.";
const withdraw_desc ="Withdraw BT tokens from current MetaMask accounts balance,  will reward the amount of Ether based on BT unit price.";

const WAD = 1000000000000000000;

class MyForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value:''};
  }

  myChangeHandler = (event) => {
    const value = event.target.value;
    this.setState({[event.target.name]: value});
  }
  render() {
    return (
      <fieldset class="col-sm-6">
      <h2>{this.props.name}</h2>
      <div> 
        {this.props.desc}
      </div>
      <form onSubmit={(e) => {
        e.preventDefault();
        this.props.callback(this.state.value);
      }}>
        <input
        type='text'
        placeholder = {'Enter the ammount in '+ this.props.currency+' to send to ' + this.props.name+ ' function.'}
        value = {this.state.value}
        name= "value"
        onChange={this.myChangeHandler}
        class="ghost-input"
      />
      <br/>
      <input
        type='submit'
        value= {this.props.name.toUpperCase()}
        class="ghost-button" 
      />
      </form>
      </fieldset>
    );
  }
}

class App extends Component {
  componentWillMount() {
    const web3Events = new Web3('wss://ropsten.infura.io/ws/v3/' + InfuraEndPointKey);
    const oracleContract = new web3Events.eth.Contract(OracleABI, OracleAddress);
    const ST_Contract = new web3Events.eth.Contract(ST_ABI, ST_Address);
    const BT_Contract = new web3Events.eth.Contract(BT_ABI, BT_Address);
    this.loadBlockchainData(oracleContract,ST_Contract,BT_Contract)
    this.subscribeEvents(oracleContract,ST_Contract,BT_Contract);

    getWeb3()
    .then((result) => {
      this.setState({web3:result});// we instantiate our contract next
    })
    .then(() =>{

      this.state.web3.eth.getAccounts()
      .then((accounts) => {
        let ST_Instance = new this.state.web3.eth.Contract(ST_ABI,ST_Address);
        this.setState({account:accounts[0],ST_Instance});
      })

    }
    )


  }



  constructor(props) {
    super(props)
    this.state = { price: '', time: '', totalSupplyBT:'',totalSupplyST:'', unitPriceBT:'', collateralRatio:'',bufferValue:'',vaultEth:'',vaultValue:'',web3:null, pending:[]};
    this.loadBlockchainData = this.loadBlockchainData.bind(this);
    this.subscribeEvents =  this.subscribeEvents.bind(this);
    this.handleMint = this.handleMint.bind(this);
  }

  handleMint = (value) => {
    this.state.ST_Instance.methods.mint(this.state.account).send({from: this.state.account, value: this.state.web3.utils.toWei(value, 'ether')})
    .on("error", (error) => {
      console.log("Error, ", error);
    })
    .on("transactionHash", (transactionHash) => {
      console.log('Transaction Sent: ', transactionHash);
      this.setState(prevState => ({
        pending: [...prevState.pending, transactionHash]
      }));
    })
    .once('confirmation', (confirmationNumber, receipt)=> {
      console.log('Transaction Approved:', receipt.transactionHash);
      this.setState(prevState => ({
        pending: prevState.pending.filter(transaction => transaction !== receipt.transactionHash)
      }));
    })
  }

  handleBurn = (ST_Quant) => {
    this.state.ST_Instance.methods.burn(this.state.web3.utils.toWei(ST_Quant, 'ether')).send({from: this.state.account})
    .on("error", (error) => {
      console.log("Error, ", error);
    })
    .on("transactionHash", (transactionHash) => {
      console.log('Transaction Sent: ', transactionHash);
      this.setState(prevState => ({
        pending: [...prevState.pending, transactionHash]
      }));
    })
    .once('confirmation', (confirmationNumber, receipt)=> {
      console.log('Transaction Approved:', receipt.transactionHash);
      this.setState(prevState => ({
        pending: prevState.pending.filter(transaction => transaction !== receipt.transactionHash)
      }));
    })
  }

  handleDeposit = (value) => {
    this.state.ST_Instance.methods.deposit(this.state.account).send({from: this.state.account, value: this.state.web3.utils.toWei(value, 'ether')})
    .on("error", (error) => {
      console.log("Error, ", error);
    })
    .on("transactionHash", (transactionHash) => {
      console.log('Transaction Sent: ', transactionHash);
      this.setState(prevState => ({
        pending: [...prevState.pending, transactionHash]
      }));
    })
    .once('confirmation', (confirmationNumber, receipt)=> {
      console.log('Transaction Approved:', receipt.transactionHash);
      this.setState(prevState => ({
        pending: prevState.pending.filter(transaction => transaction !== receipt.transactionHash)
      }));
    })
  }
  
  handleWithdraw = (BT_Quant) => {
    this.state.ST_Instance.methods.withdraw(this.state.web3.utils.toWei(BT_Quant, 'ether')).send({from: this.state.account})
    .on("error", (error) => {
      console.log("Error, ", error);
    })
    .on("transactionHash", (transactionHash) => {
      console.log('Transaction Sent: ', transactionHash);
      this.setState(prevState => ({
        pending: [...prevState.pending, transactionHash]
      }));
    })
    .once('confirmation', (confirmationNumber, receipt)=> {
      console.log('Transaction Approved:', receipt.transactionHash);
      this.setState(prevState => ({
        pending: prevState.pending.filter(transaction => transaction !== receipt.transactionHash)
      }));
    })
  }


  async loadBlockchainData(oracleContract,ST_Contract,BT_Contract) {
    // this.setState({ account: accounts[0] }
    const price = await oracleContract.methods.ETHGBP().call();
    const totalSupplyST = await ST_Contract.methods.totalSupply().call();
    const totalSupplyBT = await BT_Contract.methods.totalSupply().call();
    let time = await oracleContract.methods.updated().call();
    time = new Date(time*1000).toLocaleString('en-GB');
    const unitPriceBT = await ST_Contract.methods.unitPriceBT().call();
    //TODO: Get the rest of the data from the blockchain on mount.
    const collateralRatio = await ST_Contract.methods.collateralRatio().call();
    const bufferValue = await ST_Contract.methods.buffer().call();
    const vaultValue = await ST_Contract.methods.vaultValue().call();
    const vaultEth = await ST_Contract.methods.vault().call();
    const bufferEth = bufferValue/(parseInt(price))

    this.setState({price:price/WAD, time, totalSupplyST:totalSupplyST/WAD, totalSupplyBT:totalSupplyBT/WAD, unitPriceBT:unitPriceBT/WAD, collateralRatio:collateralRatio*100/WAD, bufferValue:bufferValue/WAD, vaultEth:vaultEth/WAD, vaultValue:vaultValue/WAD, bufferEth});

    // this.setState({price:price, time, totalSupplyST:totalSupplyST/WAD, totalSupplyBT:totalSupplyBT/WAD, unitPriceBT:unitPriceBT/WAD});

  }

  async subscribeEvents(oracleContract, ST_Contract,BT_Contract){
    oracleContract.events.PriceUpdate()
    .on("error", (error) => {
      console.log("Error, ", error);
    })
    .on("connected",(subscriptionId) => {
        console.log(subscriptionId);
    })
    .on('data', async (event) => {
        console.log(event); // same results as the optional callback above
        this.loadBlockchainData(oracleContract,ST_Contract,BT_Contract);
    })

    ST_Contract.events.allEvents()
    .on("error", (error) => {
      console.log("Error, ", error);
    })
    .on("connected",(subscriptionId) => {
        console.log(subscriptionId);
    })
    .on('data', async (event) => {
        console.log(event); // same results as the optional callback above
        this.loadBlockchainData(oracleContract,ST_Contract,BT_Contract);
    })
    BT_Contract.events.allEvents()
    .on("error", (error) => {
      console.log("Error, ", error);
    })
    .on("connected",(subscriptionId) => {
        console.log(subscriptionId);
    })
    .on('data', async (event) => {
        console.log(event); // same results as the optional callback above
        this.loadBlockchainData(oracleContract,ST_Contract,BT_Contract);
    })
  }

  render() {
    return (
      <>
      <div class="row">
      <div class="col-sm-4">
        <div class="table-responsive">
          <table class="table table-bordered">
            <th colspan="2" class="text-center">Pricing Information and system features</th>
            <tr>
              <td><b>Current Price</b></td>
              <td>£{this.state.price}</td>
            </tr>
            <tr>
              <td><b>
              Updated
              </b>
              </td>
              <td>
              {this.state.time}
              </td>
            </tr>
            <tr>
              <td>
              <b>ST redemption</b>
              </td>
              <td>
              {this.state.collateralRatio < 100 ? 'Disabled' : 'Enabled'}
              </td>
            </tr>
            <tr>
              <td>
              <b>BT redemption</b>
              </td>
              <td>
              {this.state.collateralRatio < 120 ? 'Disabled' : 'Enabled'}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <div class="col-sm-4">
        <div class="table-responsive">
          <table class="table table-bordered">
            <th colspan="4" class="text-center">STABILITY OF TOKEN</th>
            <tr>
              <td><b>Vault Value</b></td>
              <td><b>Buffer</b></td>
              <td><b>Collateral Ratio</b></td>
            </tr>
            <tr>
              <td>£{this.state.vaultValue}</td>
              <td>£{this.state.bufferValue}</td>
              <td>{this.state.collateralRatio}%</td>
            </tr>
            <tr>
              <td>{this.state.vaultEth} ETH</td>
              <td>{this.state.bufferEth} ETH</td>
              <td>-</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="col-sm-4">
        <div class="table-responsive">
          <table class="table table-bordered">
            <th colspan="3" class="text-center">TOKEN INFO</th>
            <tr>
              <td><b>ST Total Supply</b></td>
              <td><b>BT Total Supply</b></td>
              <td><b>BT Unit Price</b></td>
            </tr>
            <tr>
              <td>{this.state.totalSupplyST}</td>
              <td>{this.state.totalSupplyBT}</td>
              <td>£{this.state.unitPriceBT}</td>
            </tr>
          </table>
        </div>
      </div>
      </div>
      {this.state.pending.map((transaction) => {
        return(
      <div key={transaction} class="row" style={{backgroundColor: '#00000090',paddingTop:'15px',paddingBottom:'15px', border: '2px solid black'}}>
        <div  class = "col-sm-12" style={{textAlign: 'center'}}> {"Transaction being processed on blockchain:"} <a style = {{color:'#e95e01'}}href={"https://ropsten.etherscan.io/tx/"+transaction}>{"https://ropsten.etherscan.io/tx/"+transaction}</a></div>
      </div>
        );
      })}
      <h2>Test the mint, burn, deposit and withdraw functions of the StableCoin system:</h2>
      <div class="row">
      <MyForm name="Mint ST" callback={this.handleMint} desc={mint_desc} currency="ETH"/>
      <MyForm name="Burn ST"  callback={this.handleBurn} desc={burn_desc} currency="ST"/>
      </div>
      <div class="row">
      <MyForm name="Deposit" callback={this.handleDeposit} desc={deposit_desc} currency="ETH"/>
      <MyForm name="Withdraw" callback={this.handleWithdraw} desc={withdraw_desc} currency="BT"/>
      </div>
      </>
    );
  }
}

export default App;