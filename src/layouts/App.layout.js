import React, { Component } from 'react';

export default class AppLayout extends Component {

    render() {
        const { children } = this.props;

        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-md-12">
                        <div style={{ boxShadow: "7px 9px 47px -1px rgba(120,107,107,0.68)", margin: 20, padding: 20 }}>
                            { children }
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}