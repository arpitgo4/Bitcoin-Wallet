import React, { Component } from'react';
import { browserHistory } from 'react-router';

import Crypto from 'crypto';
import Ecdsa from 'ecdsa';
import BigInteger from 'bigi';
import CoinKey from 'coinkey';
import varuint from 'varuint-bitcoin';

import { getAppState, setAppState } from '../layouts/AppState';
import { 
    convertPublicKeyToAddress, 
    sha256Hash, 
    goToPreviousPage,
    convertPrivateKeyToPublicKey,
    convertPrivateKeyToAddress,
    reverseHexString
} from './utils';
import { OP_CODES_HEX, SIGHASH } from './constants';

import ReactJson from 'react-json-view';

export default class Transaction extends Component {

    constructor(props) {
        super(props);
        this.state = {
            transaction: null,           /* { hex: '', signature: '' } */ 
            decodedTx: null
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
                    {this.state.decodedTx ? this._renderDecodeTx() : null}
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

    _renderDecodeTx() {
        const { decodedTx } = this.state;

        return (
            <div className="row">
                <div className="col-md-12" style={{ wordWrap: 'break-word', overflow: 'hidden' }}>
                    <p className="lead">Transaction Json: </p>
                    <ReactJson className=" mark" src={decodedTx}></ReactJson>
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
        const serializedSignature = signature.toDER();

        this.fetchDecodedTx(txBuffer);

        this.setState({
            transaction: {
                hex: txBuffer.toString('hex'),
                signature: serializedSignature.toString('hex')
            }
        });
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

        const bufTxOutBuf = this.serializeTxOut(transaction.vout);
        console.log(bufTxOutBuf.toString('hex'));

        const bufTxInBuf = this._serializeTxIn(transaction.vin);
        console.log(bufTxInBuf.toString('hex'));

        // corrected
        const versionBuffer = Buffer.alloc(4);
        versionBuffer.writeUInt32LE(transaction.version);

        // corrected
        const lockTimeBuffer = Buffer.alloc(4);
        lockTimeBuffer.writeUInt32BE(transaction.locktime);

        const txInCountBuf = varuint.encode(transaction.vin.length);
        const txOutCountBuf = varuint.encode(transaction.vout.length);

        const tx = Buffer.concat([
            versionBuffer,
            txInCountBuf,           // txIn count
            bufTxInBuf,
            txOutCountBuf,          // txOut count
            bufTxOutBuf,
            lockTimeBuffer          // extra-data
        ]);

        console.log('full tx', tx.toString('hex'));

        return tx;
    }

    // do not change.
    serializeTxOut(txOut) {
        const bufList = [];
        for(let out of txOut) {
    
            // script (hex)
            // 76a914ab68025513c3dbd2f7b92a94e0581f5d50f654e788ac (book)
            // 76a914ab68025513c3dbd2f7b92a94e0581f5d50f654e788ac

            // tx (hex)
            // 60e3160000000000 19 76a9 14 ab68025513c3dbd2f7b92a94e0581f5d50f654e788ac
            // 60e3160000000000 19 76a9 20 ab68025513c3dbd2f7b92a94e0581f5d50f654e788ac   d0ef8000000000001976a9207f9b1a7fb68d60c536c2fd8aeaa53a8f3cc025a888ac

            const parsedScriptBuf = this._pareTxOutScript(out.scriptPubKey);
            const tx = Buffer.alloc(8
                    + varuint.encodingLength(parsedScriptBuf.length)
                    + parsedScriptBuf.length);
    
            tx.writeIntLE(out.value*1e8, 0, 8);
            varuint.encode(parsedScriptBuf.length, tx, 8);
            tx.write(parsedScriptBuf.toString('hex'),
                             8 + varuint.encodingLength(parsedScriptBuf.length), 'hex');

            console.log('txout', tx.toString('hex'));

            bufList.push(tx);
        }

        return Buffer.concat(bufList);
    }

    // correct, working, do not change
    _serializeTxIn(txIn) {
        const bufList = [];
        for(let tin of txIn) {
            const scriptSize = Buffer.from(tin.scriptSig.toString(16), 'hex').length;

            const scriptSigBuf = this._parseTxInScript(tin.scriptSig);
            const totalScriptSize = scriptSigBuf.length;

            // correct size of the total signature.
            //console.log('total size in buf', scriptSigBuf.length.toString(16));

            //console.log('txin script', scriptSigBuf.toString('hex'));

            // only writing txid, vout & totalScriptSize
            // after these concating the buffers.
            let tx = Buffer.alloc(
                32 + 4
                + varuint.encodingLength(totalScriptSize) 
            );

            // tx outpoint
            tx.write(reverseHexString(tin.txid), 0, 32, 'hex'); // 32 bytes
            tx.writeInt32LE(tin.vout, 32);      // 4 bytes

            varuint.encode(totalScriptSize, tx, 36);  // varuint.encodingLength(totalScriptSize)

            tx = Buffer.concat([ tx, scriptSigBuf ]);
            
            const seqBuf = new Buffer(4);
            seqBuf.writeUInt32BE(tin.sequence);

            tx = Buffer.concat([ tx, seqBuf ]);

            console.log('txin', tx.toString('hex'));

            // txin script, correct
            // 6a 47 3044022034519a85fb5299e180865dda936c5d53edabaaf6d15cd1740aac9878b76238e002207345fcb5a62deeb8d9d80e5b412bd24d09151c2008b7fef10eb5f13e484d1e0d 01 21 0207c9ece04a9b5ef3ff441f3aad6bb63e323c05047a820ab45ebbe61385aa7446ffffffff
            // 6a 47 3044022034519a85fb5299e180865dda936c5d53edabaaf6d15cd1740aac9878b76238e002207345fcb5a62deeb8d9d80e5b412bd24d09151c2008b7fef10eb5f13e484d1e0d 01 21 0207c9ece04a9b5ef3ff441f3aad6bb63e323c05047a820ab45ebbe61385aa7446ffffffff

            // txin
            // 186f9f998a5aa6f048e51dd8419a14d8a0f1a8a2836dd734d2804fe65fa3577900000000 6a 47 3044022034519a85fb5299e180865dda936c5d53edabaaf6d15cd1740aac9878b76238e002207345fcb5a62deeb8d9d80e5b412bd24d09151c2008b7fef10eb5f13e484d1e0d01210207c9ece04a9b5ef3ff441f3aad6bb63e323c05047a820ab45ebbe61385aa7446ffffffff

            bufList.push(tx);
        }

        return Buffer.concat(bufList);
    }

    // do not change
    _pareTxOutScript(script) {
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

    // working, do not change.
    _parseTxInScript(script) {

        // 47 3044022034519a85fb5299e180865dda936c5d53edabaaf6d15cd1740aac9878b76238e002207345fcb5a62deeb8d9d80e5b412bd24d09151c2008b7fef10eb5f13e484d1e0d 01 21 0207c9ece04a9b5ef3ff441f3aad6bb63e323c05047a820ab45ebbe61385aa7446
        // 47 3044022034519a85fb5299e180865dda936c5d53edabaaf6d15cd1740aac9878b76238e002207345fcb5a62deeb8d9d80e5b412bd24d09151c2008b7fef10eb5f13e484d1e0d 01 21 0207c9ece04a9b5ef3ff441f3aad6bb63e323c05047a820ab45ebbe61385aa7446

        // from siliconian valley site.
        //script = '3044022034519a85fb5299e180865dda936c5d53edabaaf6d15cd1740aac9878b76238e002207345fcb5a62deeb8d9d80e5b412bd24d09151c2008b7fef10eb5f13e484d1e0d0207c9ece04a9b5ef3ff441f3aad6bb63e323c05047a820ab45ebbe61385aa7446'

        // 71 bytes signature size, 2 chars = 1 byte.
        const signature = script.slice(0, 70*2);
        const pubKey = script.slice(70*2);

        const signatureBuf = new Buffer(signature, 'hex');
        const pubKeyBuf = new Buffer(pubKey, 'hex');

        // console.log('signature', signature);
        // console.log('pubKey', pubKey);

        const sigSizeBuf = varuint.encode(signatureBuf.length+1);
        const pubKeySizeBuf = varuint.encode(pubKeyBuf.length);

        // wrote SIGHHASH_ALL = 0x01 in the buffer
        const sighHashBuf = new Buffer(1);
        sighHashBuf.writeIntBE(SIGHASH.ALL, 0, 1);

        return Buffer.concat([
            sigSizeBuf,
            signatureBuf,
            sighHashBuf,
            pubKeySizeBuf,
            pubKeyBuf
        ]);
    }

    fetchDecodedTx(txBuffer) {
        const txHex = txBuffer.toString('hex');

        fetch('https://api.blockcypher.com/v1/bcy/test/txs/decode', {
            method: 'POST',
            body: JSON.stringify({ tx : txHex })
        })
        .then(res => res.json())
        .then(decodedTx => {
            this.setState({
                decodedTx
            });
        })
        .catch(err => console.log(err));
    }

    _syntaxHighlight(json) {
        if (typeof json != 'string') {
             json = JSON.stringify(json, undefined, 2);
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

}