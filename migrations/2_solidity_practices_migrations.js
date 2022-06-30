const CrowdFunding = artifacts.require("CrowdFund");
const Wish = artifacts.require("Wish");

module.exports = async function(deployer) {

    await deployer.deploy(Wish, 10000);
    let wish = await Wish.deployed();
    await deployer.deploy(CrowdFunding, wish.address.toString());

}

