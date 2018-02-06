import React, { Component } from 'react';
import { Link } from 'react-router';
import CoinKey from 'coinkey';

import { setAppState, getAppState } from '../layouts/AppState';

export default class App extends Component {

    constructor(props) {
        super(props);
        this.ck = new CoinKey.createRandom();
    }

    render() {  
        const { privateKey } = getAppState();

        return (
            <div className="row">
                <div className="col-md-12">
                    <button 
                        className="btn btn-primary btn-lg center-block" 
                        onClick={this.createWalletHandler.bind(this)}>Create New Wallet</button>

                    <div style={{ marginTop: 20 }}>
                            { privateKey ? (this._renderRest()) : null }
                    </div>
                </div>
            </div>                
        );
    }

    _renderRest() {
        const { privateKey } = getAppState();

        return (
            <div className="row">
                <div className="col-md-12">
                    <p className="lead">
                        Private Key:
                        <p className="lead mark">{privateKey}</p>
                    </p>
                    <p className="text-danger lead">**Copy and save the private key somewhere safe</p>
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
        const privateKey = this.ck.privateKey.toString('hex');
        setAppState({
            privateKey
        }, this);
    }

}