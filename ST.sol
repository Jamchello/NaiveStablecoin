/*
Implements ERC20 Token, ST, which is pegged to the value of £1 using Ether as collateral.
*/
pragma solidity ^0.5.0;
//OpenZeppelin imports which implement the ERC-20 Interface.
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/token/ERC20/ERC20Detailed.sol";
//SafeMath library which prevents overflow when carrying out arithmetic.
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/math/SafeMath.sol";
//Local file import of contracts: Mock Oracle (Oracle) and Backing Token (BT).
import "./Oracle1.sol";
import "./BT.sol";

contract ST is ERC20, ERC20Detailed{
    using SafeMath for uint;
    Oracle private oracle; //The oracle which provides pricing data.
    //TODO: Change to private when deploying on live network.
    BT public bt; //Instance of BT Contract responsible for ERC-20 compliant backing token, owned by this contract.
    uint constant private DECIMALFIX = 1000000000000000000; //10^18, used in pricing arithmetic.
    
    constructor(address _oracle) public ERC20Detailed("StableToken", "ST", 18) {
    oracle = Oracle(_oracle); //Update the oracle and load into interface.
    bt = BT(new BT()); //Deploy a new BT contract.
    }
    
    //TODO: Remove this function when deploying on live network - useful for localVM testing.
    function checkBalance() public view returns(uint){
        return address(this).balance;
    }
    
    /**
    * @notice  calculate the value in GBP of the transaction, mint this ammount of tokens to the address `_to` using ERC20 Interface.
    * @param _to The address to receive newly minted ST tokens.
    * @return Whether the minting was successful or not
    */
    function mint(address _to) public payable returns(bool success){
        //Parse as uint with 18 decimal places because msg.value is expressed in terms of wei which has 18dp
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        uint value = currentPrice.mul(msg.value.div(DECIMALFIX));
        _mint(_to, value);
        return true;
    }
    /**
    * @notice Redeem `_value` ST tokens for the equivalent £ value in ETH.
    * @param _value The number of ST tokens which are to be redeemed
    * @return Whether the burning was successful or not
    */
    function burn(uint _value) public returns (bool success){
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        uint value = _value.mul(DECIMALFIX).div(currentPrice);
        //Requires a minimum collateral of 100% to allow burning.
        require((getVaultValue() - value) >= (totalSupply() - _value), 'Min collateral ratio of 100% violated.');
        _burn(msg.sender,_value);
        msg.sender.transfer(value);
        return true;
    }
    /**
    * @notice Take in ETH payment, calculate the unit price of BT based on the current buffer and mint the correct ammount of BT tokens for the ETH deposit.
    * @param _to The address to receive newly minted BT tokens.
    * @return Whether the deposit was successful or not
    */
    function deposit(address _to) public payable returns(bool success){
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        uint value = currentPrice.mul(msg.value.div(DECIMALFIX));
        //Balance of address is increased before code executed...
        uint buffer = getVaultValue() - msg.value - totalSupply();
        uint btUnitPrice = bt.totalSupply()>0 ? buffer.div(bt.totalSupply()): 1;
        bt.mint(_to,value.div(btUnitPrice));
        return true;
    }
    /**
    * @notice Redeem `_value` BT tokens for the equivalent £ value in ETH.
    * @param _value The number of BT tokens to be redeemed and subsequently burned.
    * @return Whether the deposit was successful or not
    */
    function withdraw(uint _value) public returns (bool success){
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        uint btUnitPrice = unitPriceBT();
        uint value = ((_value * btUnitPrice)*DECIMALFIX)/ currentPrice;
        require((getVaultValue() - value) >= totalSupply(), 'Min collateral ratio of 100% violated'); 
        bt.burn(msg.sender, _value);
        msg.sender.transfer(value);
        return true;
    }
    /**
    * @notice calculates the value of 1 BT token in GBP based on the current buffer value and supply of BT tokens.
    * @return Current £ value of 1 BT token.
    */
    function unitPriceBT() public view returns (uint _unitPrice){
        uint buffer = getVaultValue() - totalSupply();
        uint btUnitPrice = bt.totalSupply()>0 ? buffer / bt.totalSupply() : 1;
        return btUnitPrice;
    }
    /**
    * @notice calculates the combined value of the ETH being stored int he vault, based on current ETH price.
    * @return Current £ value of the vault. (How much collateral is being held).
    */
    function getVaultValue() internal view returns (uint _value){
        uint currentPrice = safeParseInt(oracle.ETHGBP(),18);
        uint vaultValue = currentPrice.div(DECIMALFIX).mul(address(this).balance);
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