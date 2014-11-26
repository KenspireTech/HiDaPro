/*
 * QuickBlox JavaScript SDK
 *
 * RequireJS config and main file
 *
 */

if (typeof module !== 'undefined' && module.exports) {
  var requirejs = require('requirejs');
}

requirejs.config({
  nodeRequire: require,

  shim: {
    strophe: {
      exports: 'Strophe'
    }
  },

  packages: [
    {
      name: 'crypto-js',
      location: '../node_modules/crypto-js',
      main: 'hmac-sha1'
    }
  ],

  paths: {
    // libs
    strophe: '../lib/strophe/strophe.min',
    webRTCAdapter: '../lib/adapter',

    quickblox: 'qbMain',
    qbConfig: 'qbConfig',
    qbUtils: 'qbUtils',
    qbProxy: 'qbProxy',
    qbStrophe: 'qbStrophe',
    qbAuth: 'modules/qbAuth',
    qbUsers: 'modules/qbUsers',
    qbChat: 'modules/qbChat',
    qbWebRTC: 'modules/qbWebRTC',
    qbContent: 'modules/qbContent',
    qbLocation: 'modules/qbLocation',
    qbMessages: 'modules/qbMessages',
    qbData: 'modules/qbData'
  }
});

requirejs(['quickblox']);
