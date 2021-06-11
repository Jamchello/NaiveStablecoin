/*
Implements ERC20 Token, ST, which is pegged to the value of £1 using Ether as collateral.
*/
pragma solidity ^0.5.0;
//OpenZeppelin imports which implement the ERC-20 Interface.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
//SafeMath library which prevents overflow when carrying out arithmetic.
import "@openzeppelin/contracts/math/SafeMath.sol";
//Local file import of contracts: Mock Oracle (Oracle) and Backing Token (BT).
import "./Oracle.sol";
import "./BT.sol";

contract ST is ERC20, ERC20Detailed{
    using SafeMath for uint;
    Oracle private oracle; //The oracle which provides pricing data.

    BT public bt; //Instance of BT Contract responsible for ERC-20 compliant backing token, owned by this contract.
    uint constant private WAD = 10 ** 18; //10^18, used in pricing arithmetic.
    uint public vault; //Stores the ammount of collateral held by the contract... used instead of this(address).balance because the vault value needs to be used in calculations without inclusion of payments included with deposit calls.
    uint private constant minCollatRatio = 12 * (10**17); //120% Minimum collateral percentage
    uint private constant mintFee = 2*(10**15); //0.2% base Minting fee
    uint private constant burnFee = 5*(10**15); //0.5% base Burning fee
    uint private constant floorPriceBT = 5 * (10**17); //Absolute minimum unit price for BT token: 0.50 GBP.
        
    constructor(address _oracle) public ERC20Detailed("StableToken", "ST", 18) {
    oracle = Oracle(_oracle); //Update the oracle and load into interface.
    bt = BT(new BT()); //Deploy a new BT contract.
    }
    //Core functions for enacting the stabilisation mechanisms:
    
    /**
    * @notice  Handles Ether deposits into the contract, mint ST tokens to the tune of the GBP equivalent of value minus fees.
    * @param _to The address to receive newly minted ST tokens.
    * @return Whether the minting was successful or not
    */
    function mint(address _to) public payable returns(bool success){
        require(bt.totalSupply() != 0, 'Requires deposit into BT tokens to initiate system.');
        uint feeMultiplier = collateralRatio() < minCollatRatio ? 3 : 1;
        uint transactionValue = calcMinusFees(ETH_TO_GBP(msg.value), mintFee.mul(feeMultiplier));
        _mint(_to, transactionValue);
        vault += msg.value;
        return true;
    }
    /**
    * @notice Redeems `_value` quantity of ST tokens for the equivalent GBP value in ETH minus fees.
    * @param _value The number of ST tokens which are to be redeemed
    * @return Whether the burning was successful or not
    */
    function burn(uint _value) public returns(bool success){
        uint feeMultiplier = collateralRatio() < minCollatRatio ? 1 : 3;
        uint burnValue = calcMinusFees(GBP_TO_ETH(_value), burnFee*feeMultiplier);
        require(vaultValue() >= burnValue, 'Not enough collateral to cover burn');
        require(adjustedCollateralRatioBurn(_value)>=WAD, 'Minimum collateral ratio of 100% violated.' );
        _burn(msg.sender, _value);
        msg.sender.transfer(burnValue);
        vault -= burnValue;
        return true;
    }
    /**
    * @notice Accepts Ether payment and mints BT tokens based on the current unit price of BT.
    * @param _to The address to receive newly minted BT tokens.
    * @return Whether the deposit was successful or not
    */
    function deposit(address _to) public payable returns(bool success){
        uint transactionValue = ETH_TO_BT(msg.value);
        bt.mint(_to, transactionValue);
        vault += msg.value;
        return true;
    }
    /**
    * @notice Redeem `_bt` BT tokens for the equivalent £ value in ETH.
    * @param _bt The number of BT tokens to be redeemed and subsequently burned.
    * @return Whether the deposit was successful or not
    */
    function withdraw(uint _bt) public returns(bool success){
        uint withdrawEth = BT_TO_ETH(_bt);
        require(buffer() > 0, 'No Collateral to cover withdrawal');
        require(adjustedCollateralRatioWithdraw(ETH_TO_GBP(withdrawEth)) > minCollatRatio || totalSupply() == 0, 'Minimum collateral ratio of 120% violated');
        bt.burn(msg.sender, _bt);
        msg.sender.transfer(withdrawEth);
        vault -= withdrawEth;
        return true;
    }
    
    /**
    * @notice Exchange `_st` ST tokens for the equivalent value in BT tokens. Applies fees when collateral ratio is above 120% 
    * @param _st The number of ST tokens to be exchanged.
    * @return Whether the deposit was successful or not
    */
    function exchange(uint _st) public returns (bool success){
        uint btValue = (_st.mul(WAD)).div(unitPriceBT());
        uint afterFees = collateralRatio() < minCollatRatio ? btValue : calcMinusFees(btValue, burnFee*3);
        _burn(msg.sender,_st); //Burn the ST tokens
        bt.mint(msg.sender, afterFees);
        return true;
    }
    //Helper functions:
    
    /**
    * @notice calculates the GBP value of the ETH being stored int he vault according to current market price.
    * @return Current £ value of the vault. (How much collateral is being held).
    */
    function vaultValue() public view returns(uint value){
        return (vault.mul(oracle.ETHGBP())).div(WAD);
    }
    
    /**
    * @notice Calculates the GBP value of the buffer.
    * @return The current buffer value.
    */
    function buffer() public view returns(int bufferValue){
        return int(vaultValue()) - int(totalSupply());
    }
    /**
    * @notice Calculates the current collateral ratio (vaultVaule / ST total supply)
    * @return The current collateral ratio.
    */
    function collateralRatio() public view returns(uint ratio){
        if(vaultValue() == 0 || totalSupply() == 0) {
            return WAD;
        }else{
        return (vaultValue().mul(WAD)).div(totalSupply());
        }
    }
    /**
    * @notice Calculates the collateral ratio that would be produced as a result of burning `_burning` ST tokens
    * @param _burning The number of ST tokens being burnt
    * @return The future collateral ratio acheived as a result of burning the ST tokens.
    */
    function adjustedCollateralRatioBurn(uint _burning) internal view returns(uint ratio){
        if(vaultValue() == 0 || vaultValue() == _burning || totalSupply() == 0 || totalSupply() == _burning){
            return WAD;
        }else{
            return((vaultValue().sub(_burning)).mul(WAD)).div(totalSupply().sub(_burning));
        }
    }
    
    /**
    * @notice Calculates the collateral ratio that would be produced as a result of withdrawing `_withdrawingValue` worth of BT tokens
    * @param _withdrawingValue The GBP value of BT tokens being withdrawn
    * @return The future collateral ratio acheived as a result of withdrawing this value of BT tokens.
    */
    function adjustedCollateralRatioWithdraw(uint _withdrawingValue) internal view returns(uint ratio){
        if(vaultValue() == 0 || vaultValue() == _withdrawingValue || totalSupply() == 0 ){
            return minCollatRatio;
        }else{
            return((vaultValue().sub(_withdrawingValue)).mul(WAD)).div(totalSupply());
        }
    }
    /**
    * @notice Returns the `_value` minus the `_feePercentage`. Used to apply fees to operations.
    * @param _value The number that is going to have a percentage of fees subtracted from it.
    * @param _feePercentage The percentage of fees that are to be charged on the operation
    * @return The ammount of tokens to mint, taking into consideration the fees.
    */
    function calcMinusFees(uint _value, uint _feePercentage) internal pure returns(uint _lessFees){
        uint multiplier = WAD - _feePercentage;
        uint value = (multiplier.mul(_value)).div(WAD);
        return value;
    }
    /**
    * @notice Calculates the GBP value of an Ethereum transaction of value `_eth`.. used to mint the correct number of ST.
    * @param _eth The ammount of ETH being converted to ST value.
    * @return The number of ST tokens to mint based on an ETH transactions value.
    */
    function ETH_TO_GBP(uint _eth) private  view returns (uint _GBP){
        return (oracle.ETHGBP().mul(_eth)).div(WAD);
    }
    /**
    * @notice calculates the ETH value of `_gbp` GBP worth of ST tokens.
    * @param _gbp The ammount of ST tokens being converted to ETH value.
    * @return The ETH value of `_gbp` ST Tokens.
    */
    function GBP_TO_ETH(uint _gbp) private view returns (uint _ETH){
        return (_gbp.mul(WAD)).div(oracle.ETHGBP());
    }
    /**
    * @notice calculates the ETH value of `_bt` number of BT tokens.
    * @param _bt The ammount of BT being converted to ETH value.
    * @return The ETH value of `_bt` BT Tokens.
    */
    function BT_TO_ETH(uint _bt) private view returns(uint _ETH){
        uint gbpValue = (_bt.mul(unitPriceBT())).div(WAD);
        return GBP_TO_ETH(gbpValue);
    }
    /**
    * @notice Calculates the  quantity of BT tokens `_eth` amount of ETH is worth. Used to mint the correct number of BT.
    * @param _eth The ammount of ETH being converted to BT value.
    * @return The number of BT tokens to mint based on an ETH transactions value.
    */
    function ETH_TO_BT(uint _eth) private view returns(uint _BT){
        uint gbpValue = ETH_TO_GBP(_eth);
        return (gbpValue.mul(WAD)).div(unitPriceBT());
    }
    /**
    * @notice calculates the GBP unit price of a single BT token.
    * @return The current GBP value of 1 BT token.
    */
    function unitPriceBT() public view returns(uint price){
        uint unitPrice = 0;
        if(bt.totalSupply() == 0 || buffer() ==0 ){
            unitPrice = WAD;
        } else if(buffer() > 0){
            unitPrice = (uint(buffer()).mul(WAD)).div(bt.totalSupply());
        } else {
            //Buffer must be negative if execution ends up here....
            unitPrice = collateralRatio();
        }
        return unitPrice >= floorPriceBT ? unitPrice : floorPriceBT;
    }
}
