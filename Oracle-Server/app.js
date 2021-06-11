let Web3 = require('web3');
let tx = require('ethereumjs-tx').Transaction;
let lightwallet = require('eth-lightwallet');
let txutils = lightwallet.txutils;
const axios = require('axios');

let price = "0.00"
//Public key (address) for owner account:
let serverOwner1Address = "0x6969675Bdf697f64B13f3bCeB9a82bDe0E7BbbD9";
//Private key for owner account:
let serverOwner1Privatekey = "72f5e16416f74b0179c331a5a06da0f79597798445c4bbe363653a32a329c66e"; 

let serverOwner2Address ='0x79C700A0c38855d8881a88f6D59EC1d13d9c32B7';
let serverOwner2Privatekey ='090da411ce886e11b8576ab0b2e1175d1cf2f2373a5c34bc7540bfdd9b587acf';

let serverOwner3Address ='0xaa01547AeDFd2d1D33A6456A9D9cd6fd23733Fb9';
let serverOwner3Privatekey ='376520656ea6c709b3a01037c87fbbb1b039298c7be58c6c185a2efd91ae7a8f';

let ContractInterface = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_time","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_value","type":"uint256"}],"name":"PriceUpdate","type":"event"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"string","name":"_value","type":"string"}],"name":"updatePriceServer1","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"string","name":"_value","type":"string"}],"name":"updatePriceServer2","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"string","name":"_value","type":"string"}],"name":"updatePriceServer3","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner2","type":"address"},{"internalType":"address","name":"_owner3","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[],"name":"ETHGBP","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"updated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
let ContractAddress = "0xE8DB3272f9424e72714c06Feb180A2b9157399c2";
let InfuraEndPointKey = "d0f7b76ae5724e82ab871bba3643dfd3"; 

function toWAD(str){
  return parseInt(parseFloat(str)*Math.pow(10,18))
}


function getPriceCoinbase() {
  let url = 'https://api.coinbase.com/v2/prices/ETH-GBP/spot';
    return axios.get(url).then(response => response.data.data)
    .catch(error => {
      console.log(error.response.data.error)
   })
}


function getPriceCoinGecko() {
  let url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=gbp&ids=ethereum';
    return axios.get(url).then(response => response.data)
    .catch(error => {
      console.log(error.response.data.error)
   })
}

function getPriceCoinAPI(){
  let url = "https://rest.coinapi.io/v1/exchangerate/ETH/GBP"
  let apiKey = '236C3A52-EA59-477C-A6FB-C4AB6EA261C7';
  let headers = {'X-CoinAPI-Key' : apiKey}
  return axios.get(url,{
    headers:headers
  }).then(response => response.data)
    .catch(error => {
      console.log(error.response.data.error)
   })
}

function priceServer1() {
    getPriceCoinGecko().then(data => {
        price = data[0].current_price.toString();
        console.log(`[Server 1] Proposes: ${price}`)
        
        var web3 = new Web3(
            new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/' + InfuraEndPointKey)
        );	
        //Building Ethereum transaction
        //Obtaining nonce value from the address
        web3.eth.getTransactionCount(serverOwner1Address).then(txCount => {
            //build transactions options object
          var txOptions = {
            nonce: txCount,
            //Gas Price - Cost of executing each unit of gas. GasPrice is in Wei
            gasPrice: 32000000000,			
            //Gas Limit - a limit on the total gas units transaction can perform. 
            gasLimit: 7900000,	
            to: ContractAddress
          }
          var rawTx = txutils.functionTx(ContractInterface, "updatePriceServer1" , [price], txOptions);
          //Sign transaction		
          var privateKey = new Buffer.from(serverOwner1Privatekey, 'hex');
          var transaction = new tx(rawTx, {'chain':'ropsten'});
          transaction.sign(privateKey);
          //before sending the transaction it needs to be serialised into hex format
          var serializedTx = transaction.serialize().toString('hex');
          web3.eth.sendSignedTransaction('0x' + serializedTx)
          .once('sent', function(payload){console.log('[Server 1]: Sent transaction')})
          .once('transactionHash', function(hash){`Transaction Hash: ${hash}`})
          .once('receipt', function(receipt){`Receipt: ${receipt}`})
          .on('error', function(error){
            console.log(`[Server 1]: Error whern sending transaction: ${error}`);
            setTimeout(priceServer1, 0);           
          })
          .then(function(receipt){
              console.log('[Server 1]: Transaction complete')
              setTimeout(priceServer1, 0);
          });
        });

    });
    
  }

  function priceServer2() {
    getPriceCoinbase().then(data => {
        price = data.amount.toString();
        console.log(`[Server 2] Proposes: ${price}`)
        
        var web3 = new Web3(
            new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/' + InfuraEndPointKey)
        );	
        //Building Ethereum transaction
        //Obtaining nonce value from the address
        web3.eth.getTransactionCount(serverOwner2Address).then(txCount => {
            //build transactions options object
          var txOptions = {
            nonce: txCount,
            //Gas Price - Cost of executing each unit of gas. GasPrice is in Wei
            gasPrice: 32000000000,			
            //Gas Limit - a limit on the total gas units transaction can perform. 
            gasLimit: 7900000,	
            to: ContractAddress
          }
          var rawTx = txutils.functionTx(ContractInterface, "updatePriceServer2" , [price], txOptions);
          //Sign transaction		
          var privateKey = new Buffer.from(serverOwner2Privatekey, 'hex');
          var transaction = new tx(rawTx, {'chain':'ropsten'});
          transaction.sign(privateKey);
          //before sending the transaction it needs to be serialised into hex format
          var serializedTx = transaction.serialize().toString('hex');
          web3.eth.sendSignedTransaction('0x' + serializedTx)
          .once('sent', function(payload){console.log('[Server 2]: Sent transaction')})
          .once('transactionHash', function(hash){`Transaction Hash: ${hash}`})
          .once('receipt', function(receipt){`Receipt: ${receipt}`})
          .on('error', function(error){
            console.log(`[Server 2]: Error whern sending transaction: ${error}`);
            setTimeout(priceServer2, 0);           
          })
          .then(function(receipt){
              console.log('[Server 2]: Transaction complete')
              setTimeout(priceServer2, 0);
          });
        });

    });
    
  }
  function priceServer3() {
    getPriceCoinAPI().then(data => {
        price = data.rate.toString();
        console.log(`[Server 3] Proposes: ${price}`)
        
        var web3 = new Web3(
            new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/' + InfuraEndPointKey)
        );	
        //Building Ethereum transaction
        //Obtaining nonce value from the address
        web3.eth.getTransactionCount(serverOwner3Address).then(txCount => {
            //build transactions options object
          var txOptions = {
            nonce: txCount,
            //Gas Price - Cost of executing each unit of gas. GasPrice is in Wei
            gasPrice: 32000000000,			
            //Gas Limit - a limit on the total gas units transaction can perform. 
            gasLimit: 7900000,	
            to: ContractAddress
          }
          var rawTx = txutils.functionTx(ContractInterface, "updatePriceServer3" , [price], txOptions);
          //Sign transaction		
          var privateKey = new Buffer.from(serverOwner3Privatekey, 'hex');
          var transaction = new tx(rawTx, {'chain':'ropsten'});
          transaction.sign(privateKey);
          //before sending the transaction it needs to be serialised into hex format
          var serializedTx = transaction.serialize().toString('hex');
          web3.eth.sendSignedTransaction('0x' + serializedTx)
          .once('sent', function(payload){console.log('[Server 3]: Sent transaction')})
          .once('transactionHash', function(hash){`Transaction Hash: ${hash}`})
          .once('receipt', function(receipt){`Receipt: ${receipt}`})
          .on('error', function(error){
            console.log(`[Server 3]: Error whern sending transaction: ${error}`);
            setTimeout(priceServer3, 0);           
          })
          .then(function(receipt){
              console.log('[Server 3]: Transaction complete')
              setTimeout(priceServer3, 0);
          });
        });

    });
    
  }

  
setTimeout(priceServer1, 0);
setTimeout(priceServer2, 0);
setTimeout(priceServer3, 0);