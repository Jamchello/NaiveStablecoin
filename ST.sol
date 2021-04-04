pragma solidity ^0.5.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/token/ERC20/ERC20Detailed.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/math/SafeMath.sol";
import "./Oracle1.sol";
import "./BT.sol";

contract ST is ERC20, ERC20Detailed{
    Oracle private oracle;
    BT public bt;
    // uint private constant minPriceBT = 50000000000000000;
    
    constructor(address _oracle) public ERC20Detailed("StableToken", "ST", 18) {
    oracle = Oracle(_oracle);
    bt = BT(new BT());
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
        uint value = SafeMath.div(SafeMath.mul(_value,1000000000000000000), currentPrice);
        //Requires a minimum collateral of 100% to allow burning.
        require((getVaultValue() - value) >= (totalSupply() - _value), 'Min collateral ratio of 100% violated.');
        _burn(msg.sender,_value);
        msg.sender.transfer(value);
    }
    
    //TODO: Fix deposit maths.
    function deposit(address _to) public payable returns(uint _totalBT){
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        uint value = SafeMath.mul(currentPrice,SafeMath.div(msg.value,1000000000000000000));
        uint buffer = getVaultValue() - totalSupply();
        uint bt_value = bt.totalSupply()>0 ? buffer / bt.totalSupply() : 1;
        bt.mint(_to,value/bt_value);
        return(bt.totalSupply());
    }
    
    function withdraw(uint _value) public {
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        uint buffer = getVaultValue() - totalSupply();
        uint bt_value = bt.totalSupply()>0 ? buffer / bt.totalSupply() : 1;
        uint value = ((_value * bt_value)*1000000000000000000)/ currentPrice;
        require((getVaultValue() - value) >= totalSupply(), 'Min collateral ratio of 100% violated'); 
        bt.burn(msg.sender, _value);
        msg.sender.transfer(value);
    }
    
    function getVaultValue() internal view returns (uint _value){
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        uint vaultValue = SafeMath.mul(SafeMath.div(currentPrice,1000000000000000000),address(this).balance);
        return(vaultValue);
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