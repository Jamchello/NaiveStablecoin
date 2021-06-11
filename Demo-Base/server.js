//generic imports for the nodejs server:
const express = require('express');
const bodyParser = require('body-parser');
const app = express()
//Ethereum specific imports:
let Web3 = require('web3');
let tx = require('ethereumjs-tx').Transaction;
let lightwallet = require('eth-lightwallet');
let txutils = lightwallet.txutils;

//Public key (address) for owner account:
let ownerAddress = "0x6969675Bdf697f64B13f3bCeB9a82bDe0E7BbbD9";
//Private key for owner account:
let ownerPrivateKey = "72f5e16416f74b0179c331a5a06da0f79597798445c4bbe363653a32a329c66e"; //Test account used for security reasons.
//Address of the SimpleStable smart contract:
let ContractAddress = "0x3af9Ff085Ca4b33C6b2046Cc79Ca2F308c88Db10";   // - making sure the contract is deployed on the Ropsten testnet:
let InfuraEndPointKey = "d0f7b76ae5724e82ab871bba3643dfd3"; 
//Importing the contracts ABI interface
let ContractInterface = require("./ABI.json");

//the following code sets up the server:
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

//the following code sets the server to listen at http://localhost:3000/
app.listen(3000, function () {

	console.log('Server is alive!')

})

//when the user loads http://localhost:3000/ in the browser, the following code is run that returns the webpage generated by ./views/index.ejs:
app.get('/', function (req, res) {

	console.log('Loading Index Page');
	res.render('index', {balanceIs: null, info: null});  //passes params into the ejs template, initialised as null.
 
})

//When the user clicks on the 'get balance of address' button of the webpage, the following code is run that returns a new view displaying the balance of address.
app.post('/balance', function (req, res) {

	console.log('Getting balance to display on webpage for address: ' + req.body.address);
	if (typeof req.body.address != 'undefined'){
		//Setting Web Provider	
		const web3 = new Web3(
			//Selecting Infura as provider on the ropsten testnet
	    		new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/' + InfuraEndPointKey)
		);

		//Load contracts interface
		const contract = new web3.eth.Contract(ContractInterface, ContractAddress);
		contract.methods.balanceOf(req.body.address).call(function(err, result) {
			if(err) {
				//if there was an error when calling the function do the following:
				console.log("error when calling the smart contract function: " + err);
				//display error to the user
				res.render('index', {balanceIs: null, info: err});
		    	} else {
				//if the contract call succeeds
				console.log("the contract function returned: " + result);
				//display information to user  	
				res.render('index', {balanceIs: 'The balance of address ' + req.body.address + ' is: ' + result, info: null});
		    	}
		});
	} else {
		res.render('index', {balanceIs: null, info: 'toAddress or value is not undefined'});
	}
})

//When the user clicks on the 'Mint tokens' button of the webpage, the following code is run that returns a new view displaying the transaction hash. 
app.post('/mint', async function (req, res) {
		
	console.log('Post occurred with (toAddress): ' + req.body.address);
	console.log('Post occurred with (value): ' + req.body.value);
	
	if ((typeof req.body.address != 'undefined')||(typeof req.body.value != 'undefined')){
		var web3 = new Web3(
  			new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/' + InfuraEndPointKey)
		);	
		//Building Ethereum transaction
		//Obtaining nonce value from the address
		let txCount = await web3.eth.getTransactionCount(ownerAddress);
		console.log("txCount: " + txCount);
			//build transactions options object
		var txOptions = {
			nonce: txCount,
			//Gas Price - Cost of executing each unit of gas. GasPrice is in Wei
			gasPrice: 25000000000,			
			//Gas Limit - a limit on the total gas units transaction can perform. 
			gasLimit: 8000000,	
			to: ContractAddress
		}
		console.log("transaction options: " + JSON.stringify(txOptions));
		var rawTx = txutils.functionTx(ContractInterface, "mint" , [req.body.address,req.body.value], txOptions);
		//Sign transaction		
		console.log('signing transaction');
		var privateKey = new Buffer(ownerPrivateKey, 'hex');
		var transaction = new tx(rawTx, {'chain':'ropsten'});
		transaction.sign(privateKey);
		
		//Sending transaction
		console.log('sending transaction');
		//before sending the transaction it needs to be serialised into hex format
		var serializedTx = transaction.serialize().toString('hex');
		web3.eth.sendSignedTransaction('0x' + serializedTx, function(err, result) {
			if(err) {
				//if there was an error when calling the function do the following:
				console.log("error when sending the transaction: " + err);
				//display error to the user
				res.render('index', {balanceIs: null, info: err});
			} else {
				//if the contract call succeeds	
				console.log("transaction hash: " + result);
				//render transaction hash to user, will need to wait for transaction to be confirmed.
				res.render('index', {balanceIs: null, info: "transaction hash: " + result});	
			}
		});
        
	} else {
		console.log('toAddress or value is not defined');
		res.render('index', {balanceIs: null, info: 'toAddress or values is not undefined'});	
	}
})


//When the user clicks on the 'Burn tokens' button of the webpage, the following code is run that returns a new version of the webpage, which includes the transaction hash that has been sent to the blockchain to perform the desired request. 
app.post('/burn', async function (req, res) {
		
	console.log('Post occurred with (fromAddress): ' + req.body.address);
	console.log('Post occurred with (value): ' + req.body.value);
	
	if ((typeof req.body.address != 'undefined')||(typeof req.body.value != 'undefined')){
		var web3 = new Web3(
  			new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/' + InfuraEndPointKey)
		);	
		//now we build the Ethereum transaction, starting with the options.
			//Obtaining nonce value from the address
		let txCount = await web3.eth.getTransactionCount(ownerAddress);
		console.log("txCount: " + txCount);
			//build transactions options object
		var txOptions = {
			nonce: txCount,
			//Gas Price - Cost of executing each unit of gas. GasPrice is in Wei
			gasPrice: 25000000000,			
			//Gas Limit - a limit on the total gas units transaction can perform. 
			gasLimit: 8000000,	
			to: ContractAddress
		}
		console.log("transaction options: " + JSON.stringify(txOptions));
		var rawTx = txutils.functionTx(ContractInterface, "burnFrom" , [req.body.address, req.body.value], txOptions);
		//Sign transaction		
		console.log('signing transaction');
		var privateKey = new Buffer(ownerPrivateKey, 'hex');
		var transaction = new tx(rawTx, {'chain':'ropsten'});
		transaction.sign(privateKey);
		
		//Sending transaction
		console.log('signing transaction');
			//before sending the transaction it needs to be serialised into hex format
		var serializedTx = transaction.serialize().toString('hex');
		web3.eth.sendSignedTransaction('0x' + serializedTx, function(err, result) {
			if(err) {
				//if there was an error when calling the function do the following:
				console.log("error when sending the transaction: " + err);
				//display error to the user
				res.render('index', {balanceIs: null, info: err});
			} else {
				//if the contract call succeeds	
				console.log("transaction hash: " + result);
				//render transaction hash to user, will need to wait for transaction to be confirmed.
				res.render('index', {balanceIs: null, info: "transaction hash: " + result});	
			}
		});
        
	} else {
		console.log('toAddress or value is not defined');
		res.render('index', {balanceIs: null, info: 'toAddress or value is not undefined'});	
	}
})

//When the user clicks on the 'Send tokens' button of the webpage, the following code is run that returns a new version of the webpage, which includes the transaction hash that has been sent to the blockchain to perform the desired request. 
app.post('/send', async function (req, res) {
		
	console.log('Post occurred with (toAddress): ' + req.body.address);
	console.log('Post occurred with (value): ' + req.body.value);
	
	if ((typeof req.body.address != 'undefined')||(typeof req.body.value != 'undefined')){
		var web3 = new Web3(
  			new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/' + InfuraEndPointKey)
		);	
		//now we build the Ethereum transaction, starting with the options.
		//Obtaining nonce value from the address
		let txCount = await web3.eth.getTransactionCount(ownerAddress);
		console.log("txCount: " + txCount);
			//build transactions options object
		var txOptions = {
			nonce: txCount,
			//Gas Price - Cost of executing each unit of gas. GasPrice is in Wei
			gasPrice: 25000000000,			
			//Gas Limit - a limit on the total gas units transaction can perform. 
			gasLimit: 8000000,	
			to: ContractAddress
		}
		console.log("transaction options: " + JSON.stringify(txOptions));
		var rawTx = txutils.functionTx(ContractInterface, "transfer" , [req.body.address,req.body.value], txOptions);
		//Sign transaction		
		console.log('signing transaction');
		var privateKey = new Buffer(ownerPrivateKey, 'hex');
		var transaction = new tx(rawTx, {'chain':'ropsten'});
		transaction.sign(privateKey);
		
		//Sending transaction
		console.log('signing transaction');
			//before sending the transaction it needs to be serialised into hex format
		var serializedTx = transaction.serialize().toString('hex');
		web3.eth.sendSignedTransaction('0x' + serializedTx, function(err, result) {
			if(err) {
				//if there was an error when calling the function do the following:
				console.log("error when sending the transaction: " + err);
				//display error to the user
				res.render('index', {balanceIs: null, info: err});
			} else {
				//if the contract call succeeds	
				console.log("transaction hash: " + result);
				//render transaction hash to user, will need to wait for transaction to be confirmed.
				res.render('index', {balanceIs: null, info: "transaction hash: " + result});	
			}
		});
        
	} else {
		console.log('toAddress or value is not defined');
		res.render('index', {balanceIs: null, info: 'toAddress or value is not undefined'});	
	}
})