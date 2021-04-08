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
import './oraclizeAPI_0.5.sol';

contract ST is ERC20, ERC20Detailed{
    using SafeMath for uint;
    Oracle private oracle; //The oracle which provides pricing data.

    BT public bt; //Instance of BT Contract responsible for ERC-20 compliant backing token, owned by this contract.
    uint constant private WAD = 10 ** 18; //10^18, used in pricing arithmetic.
    uint private vault; //Stores the ammount of collateral held by the contract... used instead of this(address).balance because the vault value needs to be used in calculations without inclusion of payments included with deposit calls.
    uint minCollatRatio = 12 * (10**17); //120% Minimum collateral %
    uint mintFee = 2*(10**16); //2% Minting fee
    uint burnFee = 5*(10**16); //5% Burning fee
        
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
        //TODO: Fix the collateralisation calculations to meet new req of up-front deposit.
        require(vault != 0, 'Requires Initial deposit to build up collateral.');
        //Taking the mint fee into consideration by: (100%-fee%) * £ value of the funds sent into function. Essentially rewarding the fee% of deposit into the buffer immediately. 
        uint value = ((WAD.sub(mintFee)).mul(ETH_TO_ST(msg.value))).div(WAD);
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
        //Taking the burn fee into consideration by: (100%-fee%) * (£ value of the tokens being burned) Essentially rewarding the fee% of tokens into buffer immediately.
        uint value = ((WAD.sub(burnFee)).mul(ST_TO_ETH(_value))).div(WAD);
        require(getVaultValue() >= _value, "Not enough collateral to cover burn.");
        //TODO: Fix the ratio value.
        require(newCollateralRatio(_value) >= minCollatRatio, 'Min collateral ratio of 120% violated.');
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
        require(getBufferValue() >0, 'No collateral to cover withdrawal');
        require(newCollateralRatio(ETH_TO_ST(value)) >= minCollatRatio, 'Min collateral ratio of 120% violated'); 
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
    * @notice calculates the value of the buffer.
    * @return The buffer which is used to calculate the value of BT.
    */
    function getBufferValue() internal view returns (int _buffer){
        int buffer = int(getVaultValue()) - int(totalSupply());
        return buffer;
    }
    /**
    * @notice Makes a call to the Oracle to fetch the latest GBP pricing of 1 ETH
    * @return Current price of 1 ETH in GBP.
    */
    function ETHGBP() internal view returns (uint _price){
       return(usingOraclize.safeParseInt(oracle.ETHGBP(),18));
    }
    /**
    * @notice Calculates the £ value of an Ethereum transaction of value `_eth`.. used to mint the correct number of ST.
    * @param _eth The ammount of ETH being converted to ST value.
    * @return The number of ST tokens to mint based on an ETH transactions value.
    */
    function ETH_TO_ST(uint _eth) internal view returns (uint _ST) {
        uint mintValue = ETHGBP().mul(_eth.div(WAD));
        return mintValue;
    }
    /**
    * @notice calculates the ETH value of `_st` number of ST tokens.
    * @param _st The ammount of ST tokens being converted to ETH value.
    * @return The ETH value of `_st` ST Tokens.
    */
    function ST_TO_ETH(uint _st) internal view returns (uint _ETH) {
        uint burnValue = _st.mul(WAD).div(ETHGBP());
        return burnValue;
    }
    /**
    * @notice Calculates the BT tokens value of an Ethereum transaction of value `_eth`.. used to mint the correct number of BT.
    * @param _eth The ammount of ETH being converted to BT value.
    * @return The number of BT tokens to mint based on an ETH transactions value.
    */
    function ETH_TO_BT(uint _eth) internal view returns (uint _BT) {
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
    /**
    * @notice calculates the ETH value of `_bt` number of BT tokens.
    * @param _bt The ammount of BT being converted to ETH value.
    * @return The ETH value of `_bt` BT Tokens.
    */
    function BT_TO_ETH(uint _bt) internal view returns (uint _ETH) {
        uint btUnitPrice;
        if (bt.totalSupply() ==0 ){
            btUnitPrice = WAD;
        } else{
            //TODO: Change the way pricing determined if negative buffer.
            btUnitPrice = unitPriceBT();
        }
        uint value = ((_bt * btUnitPrice))/ ETHGBP();
        return value;
    }
    /**
    * @notice calculates the updated collateral ratio if _burning worth of value is burned from the vault..
    * @return The theoretical collateral ratio
    */
    function newCollateralRatio(uint _burning) internal view returns(uint _ratio){
        require(_burning <= totalSupply(), 'Burn value exceeds total supply');
        uint ratio = totalSupply()  != _burning && totalSupply() != 0 ? (getVaultValue().sub(_burning)).mul(WAD).div(totalSupply() - _burning) : WAD*10;
        return (ratio);
    }  
    /**
    * @notice calculates the current collateral ratio 
    * @return The current collateral ratio
    */
    function collateralRatio() internal view returns (uint _ratio){
        uint ratio = totalSupply() != 0 ? (getVaultValue().mul(WAD)).div(totalSupply()) : WAD*10;
        return(ratio);
    }
    /**
    * @notice calculates the unit price of a single BT token.
    * @return the pricing of 1 BT token.
    */
    function unitPriceBT() public view returns (uint _price){
        uint btUnitPrice = 0;
        int buffer = getBufferValue();
        uint minimumPrice = minPriceBT();
        if(buffer == 0 || bt.totalSupply() == 0){
            btUnitPrice = WAD;             
        } else if (buffer > 0){
            btUnitPrice = uint(buffer).mul(WAD).div(bt.totalSupply());
        } 
        btUnitPrice = btUnitPrice > minimumPrice ? btUnitPrice : minimumPrice;
        return btUnitPrice;
    }
    /**
    * @notice calculates the lowest possible value of a BT token using the price of ETH when the collateral ratio was initially violated.
    * @return The lowest possible pricing of a single BT token.
    */
    function minPriceBT() public view returns (uint _price){
        //Min Price is calculated using the price that ETH would be when the collateral ratio is at minCollatRatio.
        uint minPrice = bt.totalSupply() != 0 ? ((minCollatRatio.sub(WAD)).mul(totalSupply())).div(bt.totalSupply()): WAD;
        return minPrice;
    }
}