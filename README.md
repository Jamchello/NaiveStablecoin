# NaiveStablecoin
This file explains the structure of the submission folder, and how to execute the sofware for demonstration/testing purposes.

-> Addresses.txt: Contract addresses for the deployed smart contracts on the Ethereum Ropsten testnet.

Pre-requisites for testing both implementations:
    1. Install NodeJS.
    2. Install MetaMask browser extension.
    3. Create a wallet on the MetaMask wallet, switch to the Ropsten network and obtain some free Ether from a faucet.
    4. Add the SIMP, BT, and ST tokens as custom entriew to MetaMask using their contract addresses in Addresses.txt.

*Demo-Base: Houses the code for base implementation demonstration.
    1. Open terminal window in folder and execute:
        npm install
        node server.js
    2. Visit localhost:3000 in web browser with MetaMask wallet installed.
    
*Demo-Final: Code for the final implementation demo (Cryptocurrency backed frontend).
    1. Open terminal in folder and execute:
        npm install
        npm run start
    2. Visit localhost:3000 in web browser with MetaMask wallet installed.

*Oracle-Server: Code for mock server sending pricing updates into the pricing oracle.
    1. Open terminal in folder and execute:
        npm install
        node app.js

*Smart-Contracts: Source code for all of the smart contracts implemented throughout the project.
    *Flattened: Flattened versions of the Solidity source code files- needed when verifying the code on EtherScan.
    *Working-Copies(Work on Remix): The Solidity source code for files without being flattened - working copies used during development. 
