
const hre = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

async function main() {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }

  const Receiver = await hre.ethers.getContractFactory("Receiver");
  const receiver = await Receiver.deploy();
  await receiver.deployed();

  console.log("Receiver contract deployed address is", receiver.address);

  const initialSupply = "1000"; 

  const EnergyTokenA = await hre.ethers.getContractFactory("EnergyTokenA");
  const ETA = await TokenTemplate.connect(accounts[0]).deploy(receiver.address, 
    "0xD6B385c625CAfd2F4C57991f7df849Ede52eeE8f", initialSupply);
  await ETA.deployed();

  console.log("ETA contract deployed address is", ETA.address);

  const EnergyTokenB = await hre.ethers.getContractFactory("EnergyTokenB");
  const ETB = await TokenTemplate.connect(accounts[0]).deploy(receiver.address, 
    "0x0D6DB60A12EA7bC554A41e7E99344F05CaDD7552", initialSupply);
  await ETB.deployed();

  console.log("ETB contract deployed address is", ETB.address);

  const EnergyTokenC = await hre.ethers.getContractFactory("EnergyTokenC");
  const ETC = await TokenTemplate.connect(accounts[0]).deploy(receiver.address, 
    "0x4F536A4d4D0b729fC6ed595383e3Bd5c54c2102F", initialSupply);
  await ETC.deployed();

  console.log("ETC contract deployed address is", ETC.address);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
