import { ethers } from "ethers";
import Web3 from "web3";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import Eth from "@ledgerhq/hw-app-eth";

//Infuria provider for Ropsten network
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://moonbeam.api.onfinality.io/public-ws'));


const chainId = 1284;
let gasPrice;
let addressWallet;
let recipient = "0x49E46fc304a448A2132d2DBEd6df47D0084cE92f";
let value = 0.1;
let gasLimit = 21000;
let nonce;
let _eth;

document.getElementById("connect-ledger").onclick = async function () {

    //Connecting to the Ledger Nano with HID protocol
    const transport = await TransportWebHID.create();
    
    //Getting an Ethereum instance and get the Ledger Nano ethereum account public key
    _eth = new Eth(transport);
    const { address } = await _eth.getAddress("44'/60'/0'/0/0", false);

    //Get some properties from provider
    addressWallet = address;
    gasPrice = (await web3.eth.getGasPrice());

    //Fill the inputs with the default value
    document.getElementById("wallet").value = address;
    document.getElementById("gasPrice").value = parseInt(gasPrice) + " wei";
    document.getElementById("chainId").value = chainId;
    document.getElementById("value").value = value;
    document.getElementById("recipient").value = recipient;
    document.getElementById("gasLimit").value = gasLimit;
}


document.getElementById("tx-transfer").onclick = async function () {
    //Getting information from the inputs
    addressWallet = document.getElementById("wallet").value;
    recipient =  document.getElementById("recipient").value;
    value =  document.getElementById("value").value;
    gasLimit =  parseInt(document.getElementById("gasLimit").value);
    nonce =  await web3.eth.getTransactionCount(addressWallet);

    //Building transaction with the information gathered
    const transaction = {
        to: recipient,
        gasPrice: "0x" + parseInt(gasPrice).toString(16),
        gasLimit: ethers.utils.hexlify(gasLimit),
        nonce: nonce,
        chainId: chainId,
        data: "0x00",
        value: ethers.utils.parseUnits(value, "ether")._hex,
    }

    //Serializing the transaction to pass it to Ledger Nano for signing
    let unsignedTx = ethers.utils.serializeTransaction(transaction).substring(2);

    //Sign with the Ledger Nano (Sign what you see)
    const signature = await _eth.signTransaction("44'/60'/0'/0/0",unsignedTx);

    //Parse the signature
    signature.r = "0x"+signature.r;
    signature.s = "0x"+signature.s;
    signature.v = parseInt(signature.v);
    signature.from = addressWallet;

    //Serialize the same transaction as before, but adding the signature on it
    let signedTx = ethers.utils.serializeTransaction(transaction, signature);

    //Sending the transaction to the blockchain
    const hash = (await web3.eth.sendSignedTransaction(signedTx)).blockHash;

    //Display the Ropsten etherscan on the screen
    const url = "https://moonbeam.moonscan.io/tx/" + hash;
    document.getElementById("url").innerHTML = url;
}
