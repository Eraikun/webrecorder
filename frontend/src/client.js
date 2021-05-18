import '@babel/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import Raven from 'raven-js';
import { AppContainer } from 'react-hot-loader';
import { Provider } from 'react-redux';

import config from 'config';

import createStore from './store/create';
import ApiClient from './helpers/ApiClient';
import baseRoute from './baseRoute';
import Root from './root';

//import './bootstrap/css/bootstrap.min.css';
//import './bootstrap/js/bootstrap.min.js';
import './base.scss';


const client = new ApiClient();

const dest = document.getElementById('app');
const script = document.createElement("script");
script.async = true;
script.src = "http://127.0.0.1:8096/static/main-ce6d544a4ec204f36b27.js";
document.head.appendChild(script);
window.wrAppContainer = dest;

// eslint-disable-next-line no-underscore-dangle
const store = createStore(client, window.__data);

// error reporting
if (config.ravenConfig) {
  Raven.config(config.ravenConfig).install();
}

const renderApp = (renderProps) => {
  ReactDOM.hydrate(
    <AppContainer warnings={false}>
      <Provider store={store} key="provider">
        <Root {...{ store, ...renderProps }} />
      </Provider>
    </AppContainer>,
    dest
  );
};

// render app
renderApp({ routes: __PLAYER__ ? require('./playerRoutes') : baseRoute, client });

if (module.hot && !__DESKTOP__) {
  module.hot.accept('./baseRoute', () => {
    const nextRoutes = require('./baseRoute');

    // Hacky solution to get around HTML5Backend reinit bug
    // https://github.com/react-dnd/react-dnd/issues/894#issuecomment-367463855
    window.__isReactDndBackendSetUp = false;
    renderApp({ routes: nextRoutes, client });
  });
}
