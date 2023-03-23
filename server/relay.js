const Web3 = require('web3');
const { Txes } = require("./models");
const Receiver = require("./contracts/receiver.sol/Receiver.json") ;
const Token = require("./contracts/EnergyTokenA.sol/EnergyTokenA.json") ;

const web3 = new Web3('HTTP://127.0.0.1:7545');
const receiverAddress = "0x296Cd92Fda484D62f992153172B5714E6E3A9B3c";
const contractReceiver = new web3.eth.Contract(
      Receiver.abi,
      receiverAddress,
    );
const privatekey = "f661fee5e2775c3a93c498273ba83b30832dfe14069ada8aa9a1b0c6f763ba77";
const botAddress = "0xCc55720Be3675F29c8C2d74229b29DCED6090dE0";

exports.operate = async function operation() {
  const listOfTxes = await Txes.findAll();
  const length = listOfTxes.length;
  console.log('relayer is monitoring');
  
  if (length > 0){
    const LastKey = length - 1;

    if(listOfTxes[LastKey].ExecutionStatus === 'default'){
      console.log('New tx message is found in mysql database')

      //find the smallest key with default status
      for (let i = 0; i < length; i++) {
        if (listOfTxes[i].ExecutionStatus === 'default') {
          var StartKey = i;
          break;
        }
      }
      console.log('The first default item key is', StartKey);

      //create input arrays & append items that owner holds sufficient number of token
      const tokenContracts = [];
      const amounts = [];
      const owners = [];
      const deadlines = [];
      const vArray = [];
      const rArray = [];
      const sArray = [];
      const recipients = [];

      const balanceSigner = []; //for execution status update later
      const balanceRecipient = []; //for execution status update later
      const insufficientKey = []; //for execution status update later

      for (let j = StartKey; j < length; j++) {
        const contractToken = new web3.eth.Contract(
            Token.abi,
            listOfTxes[j].TokenAddress,
          );
        const balance = await contractToken.methods.balanceOf(listOfTxes[j].SignerAddress).call();
        balanceSigner.push(balance);

        const balance_Recipient = await contractToken.methods.balanceOf(listOfTxes[j].RecipientAddress).call();
        balanceRecipient.push(balance_Recipient);

        if (balance >= listOfTxes[j].amount) {
          tokenContracts.push(listOfTxes[j].TokenAddress);
          amounts.push(listOfTxes[j].amount);
          owners.push(listOfTxes[j].SignerAddress);
          deadlines.push(listOfTxes[j].deadline);
          const rawSig = await listOfTxes[j].sig;
          let signature = rawSig.substring(2);

          const r = "0x" + signature.substring(0, 64);
          const s = "0x" + signature.substring(64, 128);
          const v = parseInt(signature.substring(128, 130), 16);

          vArray.push(v);
          rArray.push(r);
          sArray.push(s);
          recipients.push(listOfTxes[j].RecipientAddress);
        } else {
          insufficientKey.push(j);
        }
      }

      //execute activePermit transaction
      const activatePermitQuery = contractReceiver.methods.activatePermit(
        tokenContracts,
        amounts,
        owners,
        deadlines,
        vArray,
        rArray,
        sArray,
        recipients
        );

      const encodedABI = activatePermitQuery.encodeABI();

      const tx = {
        from:botAddress,
        to: receiverAddress,
        gas: 2100000,
        data: encodedABI,
      }; 

      const signed  = await web3.eth.accounts.signTransaction(tx, privatekey);
      const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
      console.log('activatePermit transaction receipt',receipt);

      //update execution status in mysql database
      for (let k = StartKey; k < length; k++) {
        if (insufficientKey.includes(k)) {
          const ID = k+1;
          await Txes.upsert({
          id: ID,
          ExecutionStatus: "failed",
          });
        } else {
          const ID = k+1;
          await Txes.upsert({
          id: ID,
          ExecutionStatus: "successful",
          });

          // const contractToken_2 = new web3.eth.Contract(
          //   Token.abi,
          //   listOfTxes[k].TokenAddress,
          // );
          // const balanceKey = k - StartKey;
          // const balanceSigner_final = await contractToken_2.methods.balanceOf(listOfTxes[k].SignerAddress).call();
          // const balance_Recipient_final = await contractToken_2.methods.balanceOf(listOfTxes[k].RecipientAddress).call();

          // const SignerDifference = balanceSigner[balanceKey] - balanceSigner_final;
          // const RecipientDifference = balance_Recipient_final - balanceRecipient[balanceKey];

          // if(SignerDifference === listOfTxes[k].amount && RecipientDifference === listOfTxes[k].amount){
          //   const ID = k+1;
          //   await Txes.upsert({
          //   id: ID,
          //   ExecutionStatus: "successful",
          //   });
          // } else{
          //   const ID = k+1;
          //   await Txes.upsert({
          //   id: ID,
          //   ExecutionStatus: "failed",
          //   });
          // }
        }
      }
    }
  }
}