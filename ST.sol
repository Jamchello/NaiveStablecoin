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
    uint constant private WAD = 10 ** 18; //10^18, used in pricing arithmetic.
    uint public vault;
    
    constructor(address _oracle) public ERC20Detailed("StableToken", "ST", 18) {
    oracle = Oracle(_oracle); //Update the oracle and load into interface.
    bt = BT(new BT()); //Deploy a new BT contract.
    }
    
    /**
    * @notice  calculate the value in GBP of the transaction, mint this ammount of tokens to the address `_to` using ERC20 Interface.
    * @param _to The address to receive newly minted ST tokens.
    * @return Whether the minting was successful or not
    */
    function mint(address _to) public payable returns(bool success){
        uint value = ETH_TO_ST(msg.value);
        _mint(_to, value);
        vault += msg.value;
        return true;
    }
    /**
    * @notice Redeem `_value` ST tokens for the equivalent £ value in ETH.
    * @param _value The number of ST tokens which are to be redeemed
    * @return Whether the burning was successful or not
    */
    function burn(uint _value) public returns (bool success){
        uint value = ST_TO_ETH(_value);
        //Requires a minimum collateral of 100% to allow burning.
        require(getVaultValue() >= value, "Not enough collateral to cover burn.");
        
        //TODO: Fix the ratio value.
        require((getVaultValue() - value) >= (totalSupply() - _value), 'Min collateral ratio of 100% violated.');
        _burn(msg.sender,_value);
        msg.sender.transfer(value);
        vault -= value;
        return true;
    }
    /**
    * @notice Take in ETH payment, calculate the unit price of BT based on the current buffer and mint the correct ammount of BT tokens for the ETH deposit.
    * @param _to The address to receive newly minted BT tokens.
    * @return Whether the deposit was successful or not
    */
    function deposit(address _to) public payable returns(bool success){
        //Balance of address is increased before code executed...
        bt.mint(_to, ETH_TO_BT(msg.value));
        vault += msg.value;
        return true;
    }
    /**
    * @notice Redeem `_value` BT tokens for the equivalent £ value in ETH.
    * @param _value The number of BT tokens to be redeemed and subsequently burned.
    * @return Whether the deposit was successful or not
    */
    function withdraw(uint _value) public returns (bool success){
        uint value = BT_TO_ETH(_value);
        //TODO: Fix ratio.
        require((getVaultValue() - value) >= totalSupply(), 'Min collateral ratio of 100% violated'); 
        bt.burn(msg.sender, _value);
        msg.sender.transfer(value);
        vault -= value;
        return true;
    }

    /**
    * @notice calculates the combined value of the ETH being stored int he vault, based on current ETH price.
    * @return Current £ value of the vault. (How much collateral is being held).
    */
    function getVaultValue() internal view returns (uint _value){
        uint vaultValue = ETHGBP().div(WAD).mul(vault);
        return(vaultValue);
    }
    /**
    * @notice calculates the value of the buffer, taking into consideration a new deposit of value `_addition`
    * @return The buffer which is used to calculate the value of BT.
    */
    function getBufferValue() public view returns (int _buffer){
        int buffer = int(getVaultValue()) - int(totalSupply());
        return buffer;
    }

    function ETHGBP() public view returns (uint _price){
       return(safeParseInt(oracle.ETHGBP(),18));

    }
    //TODO: Helper functions for converting ETH->ST, ST->ETH, FT-> ETH and ETH -> FT....
    function ETH_TO_ST(uint _eth) public view returns (uint _ST) {
        uint mintValue = ETHGBP().mul(_eth.div(WAD));
        return mintValue;
    }
    function ST_TO_ETH(uint _st) public view returns (uint _ETH) {
        uint burnValue = _st.mul(WAD).div(ETHGBP());
        return burnValue;
    }
    function ETH_TO_BT(uint _eth) public view returns (uint _BT) {
        int buffer = getBufferValue();
        uint depositValue = ETHGBP().mul(_eth.div(WAD));
        uint btUnitPrice = 0;
        if (bt.totalSupply() ==0 ){
            btUnitPrice = WAD;
        } else{
            //TODO: Change the way pricing determined if negative buffer.
            btUnitPrice = buffer > 0 ? uint(buffer).mul(WAD).div(bt.totalSupply()) : WAD;
        }
        return depositValue.mul(WAD).div(btUnitPrice);
    }
    function BT_TO_ETH(uint _bt) public view returns (uint _ETH) {
        int buffer = getBufferValue();
        uint btUnitPrice;
        if (bt.totalSupply() ==0 ){
            btUnitPrice = WAD;
        } else{
            //TODO: Change the way pricing determined if negative buffer.
            btUnitPrice = buffer > 0 ? uint(buffer).mul(WAD).div(bt.totalSupply()) : WAD;
        }
        uint value = ((_bt * btUnitPrice))/ ETHGBP();
        return value;
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