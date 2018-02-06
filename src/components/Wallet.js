import React, { Component } from 'react';
import CoinKey from 'coinkey';

export default class Wallet extends Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <div className="row">
                <div className="col-md-12">
                    <div className="row" >
                        <div className="col-md-12">
                            <p className="lead">Paste Your Private Key:</p>
                            <textarea ref="key" className="form-control"></textarea>
                            <button style={{ marginTop: 20 }}
                                className="btn btn-primary btn-lg"
                                onClick={this.unlockWallet.bind(this)}>Unlock</button>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-12">

                            <div style={{ marginTop: 20 }}>
                                    { this.state.publicAddress ? (
                                        <div className="row">
                                            <div className="col-md-12">
                                                <p className="lead">
                                                    Public Address: {this.state.publicAddress}
                                                </p>
                                                <p className="lead">
                                                    Public Key: {this.state.publicKey}
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