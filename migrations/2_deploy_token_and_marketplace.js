const CadabraCoin = artifacts.require("CadabraCoin");
const Marketplace = artifacts.require("Marketplace");

module.exports = async function(deployer) {
  const _name = 'CadabraCoin';
  const _symbol = 'CDBRA';
  await deployer.deploy(CadabraCoin, _name, _symbol);
  await deployer.deploy(Marketplace, CadabraCoin.address);
};
