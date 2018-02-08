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
    convertPrivateKeyToAddress,
    reverseHexString
} from './utils';
import { OP_CODES_HEX } from './constants';

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
                    <p className="lead">Transaction Hex:</p>
                    <p className="mark lead">{hex}</p>

                    <p className="lead">Transaction Signature:</p>
                    <p className="mark lead">{signature}</p>

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

        const txBuffer = this._createTransaction(
                        privateKeyRef.value, addressRef.value, amountRef.value);

        const shaDigest = sha256Hash(txBuffer.toString('hex'));

        const privateKeyHex = privateKeyRef.value;
        const ck = new CoinKey(new Buffer(privateKeyHex, 'hex'), true);
        
        const signature = Ecdsa.sign(shaDigest, BigInteger.fromBuffer(ck.privateKey));

        // Verification
        // const isValid = Ecdsa.verify(shaDigest, signature, BigInteger.fromBuffer(ck.publicKey));
        // console.log('Signature Verification:', isValid);

        // TODO: encode the signature by DER encoding appending the SHA_HASH_FLAG
        const transactionSignature = signature.r.toString() + signature.s.toString();

        this.setState({
            transaction: {
                hex: txBuffer.toString('hex'),
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

    /**
     * txOut: {
     *  value: 8 bytes (little endian, in satoshi 1e-8), writeFloatLE()
     *  locking-script size: 1-9 bytes (varint), writeUInt()
     *  locking-script: variable, write()
     * }
     * max_total: 8+1+9 = 18 bytes
     */
    // TODO: add script's sizes before their source.
    // P2PKH (Pay to Public Key Hash)
    /**
     * txIn: {
     *  txHash: 32 bytes,
     *  outputIdx: 4 bytes,
     *  unlocking-script size: 1-9 bytes (varint)
     *  unlocking-script: variable
     *  seq_num: 4 bytes
     * }
     * max_total: 32+4+1+9+4 = 50 bytes
     */
    _createTransaction(senderPrivateKey, recepientAddress, amount) {

        const senderPublicKey = convertPrivateKeyToPublicKey(senderPrivateKey);
        const senderAddress = convertPrivateKeyToAddress(senderPrivateKey);
        const amountToSend = amount / 2; // to send + change
        
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
                    "scriptSig" : "3045022100884d142d86652a3f47ba4746ec719bbfbd040a570b1deccbb6498c75c4ae24cb02204b9f039ff08df09cbe9f6addac960298cad530a863ea8f53982c09db8f6e38130484ecc0d46f1918b30928fa0e4ed99f16a0fb4fde0735e7ade8416ab9fe423cc5412336376789d172787ec3457eee41c04f4938de5cc17b4a10fa336a8d752adf",
                    "sequence": 4294967295
                }
            ],
            "vout": [
                {
                    "value": 0.01500000,
                    "scriptPubKey": "OP_DUP OP_HASH160 ab68025513c3dbd2f7b92a94e0581f5d50f654e7 OP_EQUALVERIFY OP_CHECKSIG"
                },
                {
                    "value": 0.08450000,
                    "scriptPubKey": "OP_DUP OP_HASH160 7f9b1a7fb68d60c536c2fd8aeaa53a8f3cc025a8 OP_EQUALVERIFY OP_CHECKSIG"
                }
            ]
        };

        const bufTxOut = this.serializeTxOut(transaction.vout);
        console.log(bufTxOut.toString('hex'));

        const bufTxIn = this._serializeTxIn(transaction.vin);
        console.log(bufTxIn.toString('hex'));

        const versionBuffer = Buffer.alloc(1, transaction.version);
        const lockTimeBuffer = Buffer.alloc(4, transaction.locktime);

        const tx = Buffer.concat([
            versionBuffer,
            lockTimeBuffer,
            bufTxIn,
            bufTxOut
        ]);

        console.log('full tx', tx.toString('hex'));

        return tx;
    }

    serializeTxOut(txOut) {
        const bufList = [];
        for(let out of txOut) {
    
            // script (hex)
            // 76a914ab68025513c3dbd2f7b92a94e0581f5d50f654e788ac (book)
            // 76a914ab68025513c3dbd2f7b92a94e0581f5d50f654e788ac

            // tx (hex)
            // 60e31600000000001976a914ab68025513c3dbd2f7b92a94e0581f5d50f654e788ac
            // 60e31600000000001976a914ab68025513c3dbd2f7b92a94e0581f5d50f654e788ac

            const parsedScriptBuf = this._parseTxOutScript(out.scriptPubKey);
            const tx = Buffer.alloc(8+1+parsedScriptBuf.length);
    
            tx.writeIntLE(out.value*1e8, 0, 8);
            tx.writeIntBE(parsedScriptBuf.length, 8, 1);
            tx.write(parsedScriptBuf.toString('hex'), 9, 'hex');

            bufList.push(tx);
        }

        return Buffer.concat(bufList);
    }

    _serializeTxIn(txIn) {
        const bufList = [];
        for(let tin of txIn) {
            const scriptSize = Buffer.from(tin.scriptSig.toString(16), 'hex').length;
        
            const tx = Buffer.alloc(scriptSize + 32 + 4 + 2 + 4);

            tx.write(reverseHexString(tin.txid), 0, 32, 'hex');
            tx.writeIntBE(tin.vout, 32, 4);

            // 186f9f998a5aa6f048e51dd8419a14d8a0f1a8a2836dd734d2804fe65fa35779000000008b483045022100884d142d86652a3f47ba4746ec719bbfbd040a570b1deccbb6498c75c4ae24cb02204b9f039ff08df09cbe9f6addac960298cad530a863ea8f53982c09db8f6e381301410484ecc0d46f1918b30928fa0e4ed99f16a0fb4fde0735e7ade8416ab9fe423cc5412336376789d172787ec3457eee41c04f4938de5cc17b4a10fa336a8d752adfffffffff
            // 186f9f998a5aa6f048e51dd8419a14d8a0f1a8a2836dd734d2804fe65fa357790000000000883045022100884d142d86652a3f47ba4746ec719bbfbd040a570b1deccbb6498c75c4ae24cb02204b9f039ff08df09cbe9f6addac960298cad530a863ea8f53982c09db8f6e38130484ecc0d46f1918b30928fa0e4ed99f16a0fb4fde0735e7ade8416ab9fe423cc5412336376789d172787ec3457eee41c04f4938de5cc17b4a10fa336a8d752adfffffffff

            tx.writeIntBE(scriptSize, 36, 2);

            tx.write(tin.scriptSig, 38, 'hex');
            tx.write(tin.sequence.toString(16), 38+scriptSize,'hex');

            bufList.push(tx);
        }

        return Buffer.concat(bufList);
    }

    _parseTxOutScript(script) {
        const [ OP_1, OP_2, PUB_KEY, OP_3, OP_4 ] = script.split(' ');

        const txScript = [
            OP_CODES_HEX[OP_1].toString(16),
            OP_CODES_HEX[OP_2].toString(16),
            Buffer.from(PUB_KEY, 'hex').length,
            PUB_KEY,
            OP_CODES_HEX[OP_3].toString(16),
            OP_CODES_HEX[OP_4].toString(16)
        ].join('');
        
        return Buffer.from(txScript, 'hex');
    }

}