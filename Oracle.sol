pragma solidity ^0.5.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/ownership/Ownable.sol";

contract Oracle is Ownable{

    string public ETHGBP;
    
    function updatePrice(string memory value) public onlyOwner returns(bool) {
        ETHGBP = value;
        return true;
    }
}