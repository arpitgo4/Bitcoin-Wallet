import React, { Component } from 'react';
import { Link } from 'react-router';

import CoinKey from 'coinkey';
import SecureRandom from 'secure-random';

export default class App extends Component {

    constructor(props) {
        super(props);
        this.ck = new CoinKey.createRandom();
        this.state = {};
    }

    render() {   
        return (
            <div className="row">
                <div className="col-md-12">
                    <button 
                        className="btn btn-primary btn-lg center-block" 
                        onClick={this.createWalletHandler.bind(this)}>Create New Wallet</button>

                    <div style={{ marginTop: 20 }}>
                            { this.state.privateKey ? (this._renderRest()) : null }
                    </div>
                </div>
            </div>                
        );
    }

    _renderRest() {
        return (
            <div className="row">
                <div className="col-md-12">
                    <p className="lead">Private Key: {this.state.privateKey}</p>
                    <p className="text-danger">**Copy and save the private key somewhere safe</p>
                    <Link to="/wallet">                                    
                        <button 
                            style={{ margin: 5 }}
                            className="btn btn-primary btn-lg pull-right">
                            Wallet
                        </button>
                    </Link>
                    <Link to="/transaction">
                        <button 
                            style={{ margin: 5 }}
                            className="btn btn-primary btn-lg pull-right">
                            Transact
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    createWalletHandler() {
        const publicAddress = this.ck.publicAddress;
        const privateKey = this.ck.privateKey.toString('hex');
        this.setState({ 
            privateKey
        });
    }

}