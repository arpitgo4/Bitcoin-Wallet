import React from 'react';
import ReactDOM from 'react-dom';
import { Route, IndexRoute, Router, browserHistory } from 'react-router';

import 'jquery';
import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

import './index.html';
import './style.scss';

import AppLayout from './layouts/App.layout';
import App from './components/App';
import Wallet from './components/Wallet';
import Transaction from './components/Transaction';

const AppRouter = () => (
	<Router history={browserHistory}>
		<Route path="/" component={AppLayout}>
			<IndexRoute component={App} />
			<Route path="/wallet" component={Wallet} />
			<Route path="/transaction" component={Transaction} />
		</Route>
	</Router>
);

ReactDOM.render(
	<AppRouter />,
	document.getElementById('react-app')
);

// for hot reloading this router component.
if(module.hot){
	module.hot.accept('./components/App', () => {
		const AppRouter = require('./components/App').default;
		console.log('>>>>>> Router Updated !! <<<<<<<')
		ReactDOM.render(
			<AppRouter />,
			document.getElementById('react-app')
		);
	});
}