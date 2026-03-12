// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract CrowdFunding {

    enum Status { Active, Successful, Closed }

    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        uint256 withdrawnAmount;
        string image;
        string category;
        Status status;
        bool closed;
        address[] donators;
        uint256[] donations;
    }

    struct CampaignView {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        uint256 withdrawnAmount;
        string image;
        string category;
        Status status;
    }

    mapping(uint256 => Campaign) public campaigns;

    // Track donation per user
    mapping(uint256 => mapping(address => uint256)) public donationsByUser;

    uint256 public numberOfCampaigns = 0;

    // EVENTS (important for frontend & blockchain logs)
    event CampaignCreated(uint256 id, address owner);
    event DonationReceived(uint256 campaignId, address donor, uint256 amount);
    event FundsWithdrawn(uint256 campaignId, uint256 amount);
    event CampaignClosed(uint256 campaignId);
    event RefundIssued(uint256 campaignId, address donor, uint256 amount);

    // CREATE CAMPAIGN
    function createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image,
        string memory _category
    ) public {

        require(_deadline > block.timestamp, "Deadline must be future");
        require(_target > 0, "Target must be > 0");

        Campaign storage campaign = campaigns[numberOfCampaigns];

        campaign.owner = _owner;
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        campaign.withdrawnAmount = 0;
        campaign.image = _image;
        campaign.category = _category;
        campaign.status = Status.Active;

        emit CampaignCreated(numberOfCampaigns, _owner);

        numberOfCampaigns++;
    }

    // DONATE
    function donateToCampaign(uint256 _id) public payable {

        Campaign storage campaign = campaigns[_id];

        require(msg.value > 0, "Donation must be > 0");
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(campaign.status == Status.Active, "Campaign not active");
        require(!campaign.closed, "Campaign closed");

        campaign.donators.push(msg.sender);
        campaign.donations.push(msg.value);

        campaign.amountCollected += msg.value;
        donationsByUser[_id][msg.sender] += msg.value;

        emit DonationReceived(_id, msg.sender, msg.value);

        if (campaign.amountCollected >= campaign.target) {
            campaign.status = Status.Successful;
        }
    }

    // MANUAL CLOSE BY OWNER
    function closeCampaign(uint256 _id) public {

        Campaign storage campaign = campaigns[_id];

        require(msg.sender == campaign.owner, "Not campaign owner");
        require(campaign.status == Status.Active, "Already closed");

        campaign.status = Status.Closed;
        campaign.closed = true;

        emit CampaignClosed(_id);
    }

    // AUTO STATUS UPDATE
    function updateCampaignStatus(uint256 _id) public {

        Campaign storage campaign = campaigns[_id];

        if (
            block.timestamp >= campaign.deadline &&
            campaign.status == Status.Active
        ) {
            if (campaign.amountCollected >= campaign.target) {
                campaign.status = Status.Successful;
            } else {
                campaign.status = Status.Closed;
            }
        }
    }

    // OWNER WITHDRAW
    function payout(uint256 _id) public {

        Campaign storage campaign = campaigns[_id];

        require(msg.sender == campaign.owner, "Not owner");

        updateCampaignStatus(_id);

        require(
            campaign.status == Status.Successful,
            "Campaign not successful"
        );

        uint256 available =
            campaign.amountCollected - campaign.withdrawnAmount;

        require(available > 0, "No funds available");

        campaign.withdrawnAmount += available;

        (bool success, ) = payable(campaign.owner).call{value: available}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(_id, available);
    }

    // REFUND FOR FAILED / CLOSED CAMPAIGN
    function refund(uint256 _id) public {

        Campaign storage campaign = campaigns[_id];

        updateCampaignStatus(_id);

        require(
            campaign.status == Status.Closed,
            "Refunds only for failed campaigns"
        );

        uint256 donatedAmount = donationsByUser[_id][msg.sender];

        require(donatedAmount > 0, "No donation");

        donationsByUser[_id][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: donatedAmount}("");
        require(success, "Refund failed");

        emit RefundIssued(_id, msg.sender, donatedAmount);
    }

    // GET DONATORS
    function getDonators(uint256 _id)
        public
        view
        returns (address[] memory, uint256[] memory)
    {
        return (campaigns[_id].donators, campaigns[_id].donations);
    }

    // GET CAMPAIGNS (FRONTEND SAFE)
    function getCampaigns()
        public
        view
        returns (CampaignView[] memory)
    {

        CampaignView[] memory allCampaigns =
            new CampaignView[](numberOfCampaigns);

        for (uint256 i = 0; i < numberOfCampaigns; i++) {

            Campaign storage c = campaigns[i];

            allCampaigns[i] = CampaignView(
                c.owner,
                c.title,
                c.description,
                c.target,
                c.deadline,
                c.amountCollected,
                c.withdrawnAmount,
                c.image,
                c.category,
                c.status
            );
        }

        return allCampaigns;
    }

    // GET REMAINING BALANCE
    function getRemainingBalance(uint256 _id)
        public
        view
        returns (uint256)
    {
        Campaign storage campaign = campaigns[_id];

        return campaign.amountCollected - campaign.withdrawnAmount;
    }
}