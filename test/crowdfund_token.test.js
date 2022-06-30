const { assert } = require('chai');

const CrowdFunding = artifacts.require("CrowdFund");
const Wish = artifacts.require("Wish");

require('chai')
    .use(require('chai-as-promised'))
    .should()


contract('Crowd Funding', ([deployer, investor]) => {

    let token, tokenAddress, crowdfund, investorBalance,
        startCampaign1, startCampaign2, endsCampaign1, endsCampaign2, campaign, 
        launchTest, cancelTest, pledgeTest, unpledgeTest, claimTest, refundTest;

    beforeEach(done => setTimeout(done, 2000));

    before(async() => {

        token = await Wish.new(10000);
        await token.transfer(investor, 1000);

        tokenAddress = token.address.toString();
        crowdfund = await CrowdFunding.new(tokenAddress);

    })

    describe('Tokens transference', async () => {

        it('Can transfer tokens to investor account', async () => {

            investorBalance = await token.balanceOf(investor);
            assert.equal(investorBalance.toString(), 1000);
            investorBalance = await token.balanceOf(deployer);
            assert.equal(investorBalance, 9000);
    
        })

    })

    describe('Launch Campaign function and event', async () => {

        it("Can launch a campaign with given inputs", async () => {

            startCampaign1 = Math.trunc(new Date().getTime() / 1000) + 1;
            endsCampaign1 = startCampaign1 + 10;
            
            //1st Campaign used for the pledge and claim test
            launchTest = await crowdfund.launchCampaign(

                200,
                startCampaign1,
                endsCampaign1
    
            );

            //2nd Campaign used for refund test
            await crowdfund.launchCampaign(
                
                200,
                startCampaign1,
                endsCampaign1
    
            );

            campaign = await crowdfund.campaigns(1);
            assert.equal(campaign.creator, deployer);
            assert.equal(campaign.starts.toString(), startCampaign1);
            assert.equal(campaign.ends.toString(), endsCampaign1);
            assert.equal(campaign.goal.toString(), 200);
    
        })
    
        it("Can emit the Launch campaign event properly", async () => {
    
            let event = launchTest.logs[0].args;
            assert.equal(event.id, 1);
            assert.equal(event.creator, deployer);
            assert.equal(event.goal.toString(), 200);
            assert.equal(event.startAt.toString(), startCampaign1);
            assert.equal(event.endAt.toString(), endsCampaign1);
    
        })
    
    })

    describe('Pledge and Unpledge functions and events', async () => {

        it("Can pledge to an active campaign", async () => {

            await token.approve(crowdfund.address, 600, {from: investor});

            //1st Transaction used for the pledge and claim test
            pledgeTest = await crowdfund.pledge(1, 500, {from: investor});

            //2nd Transaction used for the refund test 
            await crowdfund.pledge(2, 100, {from: investor});   

            campaign = await crowdfund.campaigns(1);
            assert.equal(campaign.pledged.toString(), 500);
            let pledgedAmount = await crowdfund.pledgedAmounts(1, investor);
            assert.equal(pledgedAmount, 500);

        })

        it("Can emit the Pledge event properly", async () => {
            
            let event = pledgeTest.logs[0].args;
            assert.equal(event.id, 1);
            assert.equal(event.caller, investor);
            assert.equal(event.amount.toString(), 500);

        })

        it("Can unpledge and amount to an active campaign", async () => {

            unpledgeTest = await crowdfund.unpledge(1, 250, {from: investor});

            campaign = await crowdfund.campaigns(1);
            assert.equal(campaign.pledged.toString(), 250);
            let pledgedAmount = await crowdfund.pledgedAmounts(1, investor);
            assert.equal(pledgedAmount, 250);

        })

        it("Can emit the Unpledge event properly", async () => {

            let event = unpledgeTest.logs[0].args;
            assert.equal(event.id, 1);
            assert.equal(event.caller, investor);
            assert.equal(event.amount.toString(), 250);

        })
    })

    describe('Cancel campaign function and event', async () => {

        it("Can cancel a recently launched campaign", async () => {

            startCampaign2 = Math.trunc(new Date().getTime() / 1000) + 59;
            endsCampaign2 = startCampaign2 + 10;

            await crowdfund.launchCampaign(

                1000,
                startCampaign2,
                endsCampaign2
    
            ); 
            cancelTest = await crowdfund.cancelCampaign(3);
            campaign = await crowdfund.campaigns(3);
            assert.equal(campaign.creator, false);

        })
        it("Can emit the Cancel campaign event properly", async () => {
    
            let event = cancelTest.logs[0].args;
            assert.equal(event.id, 3);

        })

    })

    describe('Claim an ended campaign that has been funded and emit its respective events', async () => {

        it("Can claim a campaign", async () => {

            claimTest = await crowdfund.claimCampaign(1, {from: deployer});
            campaign = await crowdfund.campaigns(1);
            assert.equal(campaign.claimed, true);
            let bal = await token.balanceOf(deployer);
            assert.equal(bal, 9250);        

        })

        it("Can emit the claim event properly", async () => {

            let event = claimTest.logs[0].args;
            assert.equal(event.id, 1);
            assert.equal(event.amount, 250);

        })

    })    

    describe('Refund a failed campaign and emit its respective events', async () => {

        it("Can refund a campaign that didnt reached its goal", async () => {
             
            refundTest = await crowdfund.refundCampaign(2, {from: investor});
            let pledgedAmount = await crowdfund.pledgedAmounts(2, investor);
            investorBalance = await token.balanceOf(investor);
            assert.equal(investorBalance.toString(), 750);
            assert.equal(pledgedAmount, 0);

        })

        it("Can emit the refund event properly", async () => {

            let event = refundTest.logs[0].args;
            assert.equal(event.id, 2);
            assert.equal(event.caller, investor);
            assert.equal(event.amount, 100);
            
        })
    })

})

