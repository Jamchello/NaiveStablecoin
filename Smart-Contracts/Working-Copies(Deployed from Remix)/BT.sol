pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
//Allows token to be owned by another address.
import "@openzeppelin/contracts/ownership/Ownable.sol";

contract BT is ERC20, ERC20Detailed, Ownable{
    
    constructor() public ERC20Detailed("BackingToken", "BT", 18){}
    
    function mint(address _to, uint _quantity) public onlyOwner returns(bool success){
        _mint(_to, _quantity);
        return true;
    }
    
    function burn(address _from, uint _quantity) public onlyOwner returns(bool success){
        _burn(_from, _quantity);
        return true;
    }
    
}


