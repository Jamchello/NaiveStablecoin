pragma solidity ^0.5.0;
//File containing the Source code for mock Oracle providing ETH/GBP value on Ethereum Blockchain.

import "@openzeppelin/contracts/ownership/Ownable.sol";

import './oraclizeAPI_0.5.sol';

contract Oracle is Ownable{
    uint public ETHGBP;
    uint public updated;
    uint[3] private pendingUpdates;
    address private Server2Owner;
    address private Server3Owner;
    bool private updating;
    
    event PriceUpdate(uint _time, uint _value);
    
    constructor(address _owner2, address _owner3) public{
        pendingUpdates = [0,0,0];
        Server2Owner = _owner2;
        Server3Owner = _owner3;
        updating = false;
    }
    
    
    modifier onlyServer(address server){
            require(msg.sender == server);
            _;
        }
    
    function insertion(uint[3] memory data) internal pure returns(uint[3] memory){
        uint length = 3;
        for (uint i = 1; i < length; i++) {
            uint key = data[i];
            uint j = i - 1;
            while ((int(j) >= 0) && (data[j] > key)) {
                data[j + 1] = data[j];
                j--;
            }
            data[j + 1] = key;
        }
        return data;
    }
    
    function updatePriceServer1(string memory _value) public onlyOwner returns(bool) {
        addToPending(0, usingOraclize.safeParseInt(_value,18));
        return true;
    }
    function updatePriceServer2(string memory _value) public onlyServer(Server2Owner) returns(bool) {
        addToPending(1,usingOraclize.safeParseInt(_value,18));
        return true;
    }
    function updatePriceServer3(string memory _value) public onlyServer(Server3Owner) returns(bool) {
        addToPending(2, usingOraclize.safeParseInt(_value,18));
        return true;
    }
    
    function addToPending(uint8  _id, uint  _value) internal {
        pendingUpdates[_id] = _value;
        
        if (updating != true && pendingUpdates[0] != 0 && pendingUpdates[1]!= 0 && pendingUpdates[2]!=0){
            updating = true;
            uint[3] memory sorted = insertion(pendingUpdates);
            ETHGBP = sorted[1];
            updated = now;
            pendingUpdates = [0,0,0];
            updating = false;
            emit PriceUpdate(updated, ETHGBP);
        }
        }
    }
