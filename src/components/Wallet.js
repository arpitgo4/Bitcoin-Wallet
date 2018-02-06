import React, { Component } from 'react';

import CoinKey from 'coinkey';

import { getAppState, setAppState } from '../layouts/AppState';
import { goToPreviousPage } from './utils';

export default class Wallet extends Component {

    constructor(props) {
        super(props);
        this.state = {
            publicAddress: '',
            publicKey: ''
        };
    }

    render() {
        const { publicAddress, publicKey } = this.state;

        return (
            <div className="row">
                <div className="col-md-12">
                    <div className="row" >
                        <div className="col-md-12">
                            <p className="lead">Paste Your Private Key:</p>
                            <textarea ref="key" 
                                style={{ marginBottom:20 }}                                
                                className="form-control"></textarea>
                            <button style={{ margin: 5 }}
                                className="btn btn-primary btn-lg"
                                onClick={this.unlockWallet.bind(this)}>Unlock</button>
                            <button style={{ margin: 5 }}
                                className="btn btn-lg"
                                onClick={goToPreviousPage}>
                                Back
                            </button>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-12">

                            <div style={{ marginTop: 20 }}>
                                    { publicAddress ? (
                                        <div className="row">
                                            <div className="col-md-12">
                                                <p className="lead">
                                                    Public Address:
                                                    <p className="lead mark">{publicAddress}</p>
                                                </p>
                                                <p className="lead">
                                                    Public Key:
                                                    <p className="lead mark">{publicKey}</p>
                                                </p>
                                            </div>
                                        </div>
                                        ) : null
                                    }
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }

    unlockWallet() {
        const privateKeyHex = this.refs.key.value;
        const ck = new CoinKey(new Buffer(privateKeyHex, 'hex'));
        const publicAddress = ck.publicAddress;
        const publicKey = ck.publicKey.toString('hex');

        this.setState({
            publicAddress,
            publicKey
        });
    }

}