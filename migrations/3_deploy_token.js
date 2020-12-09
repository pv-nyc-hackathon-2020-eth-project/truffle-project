const MyToken = artifacts.require("MyToken");

module.exports = function(deployer) {
  const _name = 'MyToken';
  const _symbol = 'MTK';
  deployer.deploy(MyToken, _name, _symbol);
};
