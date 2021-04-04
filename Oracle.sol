pragma solidity ^0.5.0;
//File containing the Source code for mock Oracle providing ETH/GBP value on Ethereum Blockchain.

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/ownership/Ownable.sol";

contract Oracle is Ownable{

    string public ETHGBP;
    
    function updatePrice(string memory value) public onlyOwner returns(bool) {
        ETHGBP = value;
        return true;
    }
}