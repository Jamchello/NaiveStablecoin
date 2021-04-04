pragma solidity ^0.5.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/token/ERC20/ERC20Detailed.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/math/SafeMath.sol";


import "./Oracle1.sol";

//Allows interaction with other ERC20 tokens; will be useful for handing FT.
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/token/ERC20/IERC20.sol";

contract ST is ERC20, ERC20Detailed{
    Oracle private oracle;
    uint public value;
    
    constructor(address _oracle) public ERC20Detailed("StableToken", "ST", 18) {
    oracle = Oracle(_oracle);
    }
    
    //TODO: Remove this function when testing on live network - useful for localVM testing.
    function checkBalance() public view returns(uint){
        return address(this).balance;
    }
    
    
    function mint(address _to) public payable{
        //Parse as uint with 18 decimal places because msg.value is expressed in terms of wei which has 18dp
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        uint _value = SafeMath.mul(currentPrice,SafeMath.div(msg.value,1000000000000000000));
        _mint(_to, _value);
    }
    
    function burn(uint _value) public{
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        value = SafeMath.div(SafeMath.mul(_value,1000000000000000000), currentPrice);
        _burn(msg.sender,_value);
        msg.sender.transfer(value);
    }
    
    
    //Functions responsible for handling changes to supply of FT:
    function deposit(address _to) public payable{
        
    }
    
    function withdraw(uint _value) public {
        
    }
    

    //Oracilize safeParseInt function to parse string into uint
    function safeParseInt(string memory _a, uint _b) internal pure returns (uint _parsedInt) {
        bytes memory bresult = bytes(_a);
        uint mintt = 0;
        bool decimals = false;
        for (uint i = 0; i < bresult.length; i++) {
            if ((uint(uint8(bresult[i])) >= 48) && (uint(uint8(bresult[i])) <= 57)) {
                if (decimals) {
                   if (_b == 0) break;
                    else _b--;
                }
                mintt *= 10;
                mintt += uint(uint8(bresult[i])) - 48;
            } else if (uint(uint8(bresult[i])) == 46) {
                require(!decimals, 'More than one decimal encountered in string!');
                decimals = true;
            } else {
                revert("Non-numeral character encountered in string!");
            }
        }
        if (_b > 0) {
            mintt *= 10 ** _b;
        }
        return mintt;
    }

}