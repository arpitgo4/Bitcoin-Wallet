import React, { Component } from'react';

import Crypto from 'crypto';
import SecureRandom from 'secure-random';
import Ecdsa from 'ecdsa';
import BigInteger from 'bigi';
import CoinKey from 'coinkey';

import { convertPublicKeyToAddress, sha256Hash } from './utils';

export default class Transaction extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <div className="row">
                <div className="col-md-12">
                    <p className="lead">Send Transaction </p>

                    <div style={{ margin: 10 }}>
                        <input className="form-control" ref="address" placeholder="Recepient's Address" />
                    </div>

                    <div style={{ margin: 10}}>
                        <input className="form-control" ref="amount" placeholder="Amount" />
                    </div>

                    <div style={{ margin: 10}}>
                        <input className="form-control" ref="privateKey" placeholder="Your Private Key" />
                    </div>

                    <div>
                        <button 
                            style={{ margin: 5 }} 
                            onClick={this.sendTransaction.bind(this)}
                            className="btn btn-success btn-lg pull-right">Send</button>
                        <button style={{ margin: 5 }} className="btn btn-danger btn-lg pull-right">Cancel</button>
                    </div>
                    {this.state.transaction ? this._renderTransaction() : null}
                </div>
            </div>
        );
    }

    // private_key = CoinKey().createRandom()
    // public_key = CoinKey(private_key).publicKey
    // public_address = sha256Hash(public_key)
    sendTransaction() {
        const { amount: amountRef, privateKey: privateKeyRef, address: addressRef } = this.refs;

        const transaction = this._createTransaction();
        const rawTransactionString = this._getRawTransactionString(transaction);
        const transactionHex = new Buffer(rawTransactionString).toString('hex');

        const shaDigest = sha256Hash(transactionHex);

        const privateKeyHex = privateKeyRef.value;
        const ck = new CoinKey(new Buffer(privateKeyHex, 'hex'), true);
        
        const signature = Ecdsa.sign(shaDigest, BigInteger.fromBuffer(ck.privateKey));

        // Verification
        // const isValid = Ecdsa.verify(shaDigest, signature, BigInteger.fromBuffer(ck.publicKey));
        // console.log('Signature Verification:', isValid);

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

    _createTransaction() {
        // dummy transaction { version, locktime, vin, vout }
        // vin { txid, vout, scriptSig (unlocking script), sequence }
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
                    "value": 0.01500000,
                    "scriptPubKey": `OP_DUP OP_HASH160
                        ab68025513c3dbd2f7b92a94e0581f5d50f654e7 OP_EQUALVERIFY OP_CHECKSIG`
                },
                {
                    "value": 0.08450000,
                    "scriptPubKey": `OP_DUP OP_HASH160
                        7f9b1a7fb68d60c536c2fd8aeaa53a8f3cc025a8 OP_EQUALVERIFY OP_CHECKSIG`,
                }
            ]
        };

        return transaction;
    }

    _renderTransaction() {
        const { hex, signature } = this.state.transaction;

        return (
            <div className="row">
                <div className="col-md-12" style={{ wordWrap: 'break-word' }}>
                    <p className="lead">Transaction Hex: <br/> {hex}</p>
                    <p className="lead">Transaction Signature: {signature}</p>
                </div>
            </div>
        );
    }

}