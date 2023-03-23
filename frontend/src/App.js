import React, { Component } from "react";
import Receiver from "./contracts/receiver.sol/Receiver.json";
import Token from "./contracts/EnergyTokenA.sol/EnergyTokenA.json";
import getWeb3 from "./getWeb3";
import "./App.css";
import './header.css';
var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');




class App extends Component {
  state = { web3: null, accounts: null, account: '', contract: null, apiResponse: '', 
    ETA_Balance: null,

    ETB_Balance: null,

    ETC_Balance: null,

    options: [
          {
            name: 'Please select payment token',
            value: 'none',
          },
          {
            name: 'Energy Token A',
            value: '0x58d04b5Ca43EBEB1d66137c5C02011cf6411886A',
          },
          {
            name: 'Energy Token B',
            value: '0x3C8ED0028587385b74140F502907Fd1030dFd10a',
          },
          {
            name: 'Energy Token C',
            value: '0x0B6600B00e91eE1494257E1597A2ed8defb31dBc',
          },
        ],
        value: '?' };



  componentDidMount = async () => {

    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      this.setState({ account: accounts[0] })

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      
      const instance = new web3.eth.Contract(
        Receiver.abi,
        "0x296Cd92Fda484D62f992153172B5714E6E3A9B3c",
      );

      const ETA_instance = new web3.eth.Contract(
        Token.abi,
        "0x58d04b5Ca43EBEB1d66137c5C02011cf6411886A",
      );

      const balance_ETA = await ETA_instance.methods.balanceOf(this.state.account).call({from: this.state.account});


      const ETB_instance = new web3.eth.Contract(
        Token.abi,
        "0x3C8ED0028587385b74140F502907Fd1030dFd10a",
      );

      const balance_ETB = await ETB_instance.methods.balanceOf(this.state.account).call({from: this.state.account});;

      const ETC_instance = new web3.eth.Contract(
        Token.abi,
        "0x0B6600B00e91eE1494257E1597A2ed8defb31dBc",
      );

      const balance_ETC = await ETC_instance.methods.balanceOf(this.state.account).call({from: this.state.account});;

      
      this.setState({ web3: web3, accounts: accounts, contract: instance, 
        ETA_Balance: balance_ETA, ETB_Balance: balance_ETB, ETC_Balance: balance_ETC});

      console.log("ETA balance is", this.state.ETA_Balance);
      console.log("ETB balance is", this.state.ETB_Balance);
      console.log("ETC balance is", this.state.ETC_Balance);


    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };


  signData = async (token, amount, recipient, relayer) => {
    const { web3, accounts, contract } = this.state;
    var signer = accounts[0];
    
    console.log(Date.now());
    var milsec_deadline = Date.now() / 1000 + 600000;
    console.log(milsec_deadline, "milisec");
    var deadline = parseInt(String(milsec_deadline).slice(0, 10));
    console.log(deadline, "sec");


    web3.currentProvider.sendAsync({
      method: 'net_version',
      params: [],
      jsonrpc: "2.0"
    }, async function (err, result) {
      const netId = result.result;
      console.log("netId", netId);

      var nonce_owner = await contract.methods.getNonce(
          token,
          signer
      )
      .call({from: signer});
      console.log('nonce_owner', nonce_owner);

      const msgParams = JSON.stringify({
        types:
        {
        EIP712Domain:[
          {name:"name",type:"string"},
          {name:"version",type:"string"},
          {name:"chainId",type:"uint256"},
          {name:"verifyingContract",type:"address"}
        ],
        Permit:[
        {name:"owner", type:"address"},
        {name:"spender",type:"address"},
        {name:"value", type: "uint256"},
        {name:"nonce", type: "uint256"},
        {name:"deadline",type:"uint256"}
        ]
      },

      primaryType:"Permit",
      domain:{name:"FYP-A1068",version:"v1",chainId:netId,verifyingContract: token},
      message:{
        owner: signer,
        spender: relayer,
        value: amount,
        nonce: nonce_owner,
        deadline: deadline
      }
      })

      var from = signer;

      console.log('CLICKED, SENDING PERSONAL SIGN REQ', 'from', from, msgParams)
      var params = [from, msgParams]
      console.dir(params)
      var method = 'eth_signTypedData_v4'

      web3.currentProvider.sendAsync({
        method,
        params,
        from,
      }, async function (err, result) {
        if (err) return console.dir(err)
        if (result.error) {
          alert(result.error.message)
        }
        if (result.error) return console.error('ERROR', result)
        console.log('TYPED SIGNED:' + JSON.stringify(result.result))

        const recovered = sigUtil.recoverTypedSignature({ data: JSON.parse(msgParams), sig: result.result })

        console.log(from);
        console.log(recovered)

        const sig = result.result;

        const status = 'default';

        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                TokenAddress: token,
                SignerAddress: signer,
                spender: relayer,
                amount: amount,
                deadline: deadline,
                RecipientAddress: recipient,
                sig: sig,
                msgParams: msgParams,
                ExecutionStatus: status
            })
        };

        if (ethUtil.toChecksumAddress(recovered) === ethUtil.toChecksumAddress(from)) {

          fetch("http://localhost:4001/txes", requestOptions)
          .then(response => response.json())
          .then(result => {
              console.log(result);
          })

          alert('Successfully ecRecovered signer as ' + from)
        } else {
          alert('Failed to verify signer when comparing ' + result + ' to ' + from)
        }

        //getting r s v from a signature
        const signature = result.result.substring(2);
        const r = "0x" + signature.substring(0, 64);
        const s = "0x" + signature.substring(64, 128);
        const v = parseInt(signature.substring(128, 130), 16);
        console.log("r:", r);
        console.log("s:", s);
        console.log("v:", v);

      })
    })       
  }


  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    
    return (
    

      <div className="App">
        <div className="gradient__bg">

          <div className="relayer__header section__padding" id="home">
            <div className="relayer__header-content">

              <h1 className="gradient__text">Blockchain-based P2P Energy Trading Relayer</h1>
              <p >Current energy prosumer account is: {this.state.account}</p>
              <p >Prosumer's Energy Token A balance is: {this.state.ETA_Balance}</p>
              <p >Prosumer's Energy Token B balance is: {this.state.ETB_Balance}</p>
              <p >Prosumer's Energy Token C balance is: {this.state.ETC_Balance}</p>
              <p>Please select the energy token you intend to use for payment, and submit the transaction in the form below, enjoy the smooth gas-free transaction right now!</p>

                <form className="relayer__form" onSubmit={(event) => {
                  event.preventDefault()
                  
                  const amount = this.amount.value
                  const recipient = this.recipient.value
                  this.signData(this.state.value, amount, recipient, "0x296Cd92Fda484D62f992153172B5714E6E3A9B3c")
                }}>


                  <div className="relayer__header-content__input">
                    <select className = 'relayer__header-content__input' 
                    onChange={event => this.setState({ value: event.target.value })}>
                      {this.state.options.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="relayer__header-content__input">
                    <input
                      type='text'
                      className = 'relayer__header-content__input'
                      placeholder='Amount of payment token'
                      ref = {(input) => {this.amount = input }}
                    />
                  </div>
            
                  <div className="relayer__header-content__input">
                    <input
                      type='text'
                      className = 'relayer__header-content__input'
                      placeholder='Recipient wallet address'
                      ref = {(input) => {this.recipient = input }}
                    />
                  </div>
                  
                  <div className="relayer__submit">
                  
                  <button type="submit">Submit</button>
                  </div>
                </form>

            </div>
          </div>

        </div>
      </div>
    );
  }
}

export default App;
