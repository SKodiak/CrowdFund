//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrowdFund {

    event Launch(
        uint id,
        address indexed creator,
        uint goal,
        uint32 startAt,
        uint32 endAt
    );
    
    event Cancelled(
        uint id
    );
    
    event Pledged(
        uint indexed id,
        address indexed caller,
        uint amount
    );

    event Unpledged(
        uint indexed id,
        address indexed caller,
        uint amount
    );

    event Claimed(
        uint indexed id,
        uint amount
    );

    event Refunded(
        uint id,
        address indexed caller,
        uint amount
    );

    struct Campaign {
        address creator;
        uint32 starts;
        uint32 ends;
        uint goal;
        uint pledged;
        bool claimed;
    }

    IERC20 public immutable TOKEN;

    uint public count;
    mapping(uint => Campaign) public campaigns;
    mapping(uint => mapping(address => uint)) public pledgedAmounts;

    constructor(IERC20 _token) {
        TOKEN = _token;
    }

    function launchCampaign(uint _goal, uint32 _starts, uint32 _ends) external {
        require(_starts >= block.timestamp, "Start date needs to be in the future");
        require(_ends >= _starts, "End date needs to be greater than start date");
        require(_ends <= block.timestamp + 90 days, "End date greater than max allowed");

        count += 1;

        campaigns[count] = Campaign({
            creator: msg.sender,
            starts: _starts,
            ends: _ends,
            goal: _goal,
            pledged: 0,
            claimed: false
        });

        emit Launch(
            count,
            msg.sender,
            _goal,
            _starts,
            _ends
        );
    }

    function cancelCampaign(uint _id) external {
        Campaign memory campaign = campaigns[_id];

        require(campaign.creator == msg.sender, "Not authorized");
        require(block.timestamp < campaign.starts, "Campaign already started");

        delete campaigns[_id];

        emit Cancelled(
            _id
        );
    }

    function pledge(uint _id, uint _amount) external payable {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp >= campaign.starts, "Campaign havent started yet");
        require(block.timestamp < campaign.ends, "Campaign has already ended");
        require(_amount != 0, "Amount pledged cannot be 0");

        campaign.pledged += _amount;
        pledgedAmounts[_id][msg.sender] += _amount;
        TOKEN.transferFrom(msg.sender, address(this), _amount);

        emit Pledged(
            _id,
            msg.sender,
            _amount
        );
    }

    function unpledge(uint _id, uint _amount) external payable {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp < campaign.ends, "Campaign has already ended");
        require(pledgedAmounts[_id][msg.sender] >= _amount, "Cant unpledge an amount bigger than what you have already pledged");

        campaign.pledged -= _amount;
        pledgedAmounts[_id][msg.sender] -= _amount;
        TOKEN.transfer(msg.sender, _amount);

        emit Unpledged(
            _id,
            msg.sender,
            _amount
        );
    }

    function claimCampaign(uint _id) external payable {
        Campaign storage campaign = campaigns[_id];

        require(campaign.creator == msg.sender, "Not authorized");
        require(block.timestamp >= campaign.ends, "Campaign is still ongoing");
        require(campaign.pledged >= campaign.goal, "Goal not reached");
        require(!campaign.claimed, "Campaign already claimed");

        campaign.claimed = true;
        TOKEN.transfer(msg.sender, campaign.pledged);

        emit Claimed(
            _id,
            campaign.pledged
        );
    }

    function refundCampaign(uint _id) external payable {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp > campaign.ends, "Campaign is still ongoing");
        require(campaign.pledged < campaign.goal, "Campaign was successful");

        uint bal = pledgedAmounts[_id][msg.sender];
        pledgedAmounts[_id][msg.sender] = 0;
        TOKEN.transfer(msg.sender, bal);

        emit Refunded(
            _id,
            msg.sender,
            bal
        );
    }

}