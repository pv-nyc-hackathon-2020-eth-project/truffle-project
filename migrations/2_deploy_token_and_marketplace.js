const MyToken = artifacts.require("MyToken");
const Marketplace = artifacts.require("Marketplace");

module.exports = async function(deployer) {
  const _name = 'MyToken';
  const _symbol = 'MTK';
  await deployer.deploy(MyToken, _name, _symbol);
  await deployer.deploy(Marketplace, MyToken.address);
};
