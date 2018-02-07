import React, { Component } from'react';
import { browserHistory } from 'react-router';

import Crypto from 'crypto';
import Ecdsa from 'ecdsa';
import BigInteger from 'bigi';
import CoinKey from 'coinkey';

import { getAppState, setAppState } from '../layouts/AppState';
import { 
    convertPublicKeyToAddress, 
    sha256Hash, 
    goToPreviousPage,
    convertPrivateKeyToPublicKey,
    convertPrivateKeyToAddress 
} from './utils';

export default class Transaction extends Component {

    constructor(props) {
        super(props);
        this.state = {
            transaction: null           /* { hex: '', signature: '' } */ 
        };
    }

    render() {
        return (
            <div className="row">
                <div className="col-md-12">
                    <p className="lead">Send Transaction </p>

                    <div style={{ margin: 10 }}>
                        <label className="lead">Recepient's Address:</label>
                        <input className="form-control" ref="address" placeholder="Recepient's Address" />
                    </div>

                    <div style={{ margin: 10}}>
                        <label className="lead">Amount:</label>
                        <input className="form-control" ref="amount" placeholder="Amount" />
                    </div>

                    <div style={{ margin: 10}}>
                        <label className="lead">Your Private Key:</label>
                        <input className="form-control" ref="privateKey" placeholder="Your Private Key" />
                    </div>

                    <div>
                        <button 
                            style={{ margin: 5 }} 
                            onClick={this.sendTransaction.bind(this)}
                            className="btn btn-success btn-lg pull-right">Send</button>
                        <button 
                            onClick={goToPreviousPage}
                            style={{ margin: 5 }} 
                            className="btn btn-danger btn-lg pull-right">Cancel</button>
                    </div>
                    {this.state.transaction ? this._renderTransaction() : null}
                </div>
            </div>
        );
    }

    _renderTransaction() {
        const { hex, signature } = this.state.transaction;

        return (
            <div className="row">
                <div className="col-md-12" style={{ wordWrap: 'break-word' }}>
                    <p className="lead">
                        Transaction Hex:
                        <p className="mark lead">{hex}</p>
                    </p>
                    
                    <p className="lead">
                        Transaction Signature:
                        <p className="mark lead">{signature}</p>
                    </p>
                    
                </div>
            </div>
        );
    }

    // private_key = new CoinKey().createRandom()
    // public_key = new CoinKey(private_key).publicKey
    // public_address = sha256Hash(public_key)
    sendTransaction() {
        const { amount: amountRef, 
                privateKey: privateKeyRef, address: addressRef } = this.refs;

        const transaction = this._createTransaction(
                        privateKeyRef.value, addressRef.value, amountRef.value);

        const rawTransactionString = this._getRawTransactionString(transaction);
        const transactionHex = Buffer.from(rawTransactionString, 'hex');

        const shaDigest = sha256Hash(transactionHex);

        const privateKeyHex = privateKeyRef.value;
        const ck = new CoinKey(Buffer.from(privateKeyHex, 'hex'), true);
        
        const signature = Ecdsa.sign(shaDigest, BigInteger.fromBuffer(ck.privateKey));

        // Verification
        // const isValid = Ecdsa.verify(shaDigest, signature, BigInteger.fromBuffer(ck.publicKey));
        // console.log('Signature Verification:', isValid);

        // TODO: encode the signature by DER encoding appending the SHA_HASH_FLAG
        const transactionSignature = signature.r.toString() + signature.s.toString();

        this.setState({
            transaction: {
                hex: transactionHex,
                signature: transactionSignature
            }
        });
    }

    _getRawTransactionString(tx) {
        let txString = `${tx.version}${tx.locktime}`;
        tx.vin.forEach(vi => txString+= `${vi.txid}${vi.vout}${vi.scriptSig}${vi.sequence}`);
        tx.vout.forEach(vo => txString+= `${vo.value}${vo.scriptPubKey}`);

        return txString;
    }

    // TODO: add script's sizes before their source.
    // P2PKH (Pay to Public Key Hash)
    _createTransaction(senderPrivateKey, recepientAddress, amount) {

        const senderPublicKey = convertPrivateKeyToPublicKey(senderPrivateKey);
        const senderAddress = convertPrivateKeyToAddress(senderPrivateKey);
        const amountToSend = amount / 2;

        // dummy transaction { version, locktime, vin, vout }
        // vin { txid, vout, scriptSig (unlocking script, DER encoded), sequence }
        // vout { value, scriptPubkey (locking script) }
        const transaction = {
            "version": 1,
            "locktime": 0,
            "vin": [
                {
                    "txid": "7957a35fe64f80d234d76d83a2a8f1a0d8149a41d81de548f0a65a8a999f6f18",
                    "vout": 0,
                    "scriptSig" :
                        `3045022100884d142d86652a3f47ba4746ec719bbfbd040a570b1deccbb6498c75c4ae24cb02204
                        b9f039ff08df09cbe9f6addac960298cad530a863ea8f53982c09db8f6e3813[ALL]
                        0484ecc0d46f1918b30928fa0e4ed99f16a0fb4fde0735e7ade8416ab9fe423cc5412336376789d1
                        72787ec3457eee41c04f4938de5cc17b4a10fa336a8d752adf`,
                    "sequence": 4294967295
                }
            ],
            "vout": [
                {
                    "value": amountToSend,
                    "scriptPubKey": `OP_DUP OP_HASH160
                        ${recepientAddress} OP_EQUALVERIFY OP_CHECKSIG`
                },
                // change
                {
                    "value": amountToSend,
                    "scriptPubKey": `OP_DUP OP_HASH160
                        ${senderAddress} OP_EQUALVERIFY OP_CHECKSIG`,
                }
            ]
        };

        return transaction;
    }

}