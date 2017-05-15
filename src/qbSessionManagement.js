'use strict';

var CryptoSHA1 = require('crypto-js/hmac-sha1');
var Promise = require('bluebird');

var CONFIG = require('./qbConfig');
var UTILS = require('./qbUtils');

/**
 * SessionManager - Session AutoManagment
 * SessionManager является частью qbProxy
 *
 * There are 3 types of session (http://quickblox.com/developers/Authentication_and_Authorization#Access_Rights):
 * 1. API Application (AS). 
 * 2. User session (US).
 * 3. Account owner (AO).
 * 
 * 1. How is SessionManager works?
 * SessionManager управляет сессией, обновляет и сохраняет (document.cookie - qb*) предыдущее состояние,
 * а так же данные для повторного создания сессии.
 *
 *
 * Чтобы активировать SessionManagement необходимо в конфиг добавить:
 * ```javascript
 *  const config = {
 *      sessionManagement: { // It's a section for SessionManagement
 *          enable: true,
 *          onerror: function() {
 *              console.error(`SDK can\'t reestablish a session. Check out the Internet connection.`);
 *          }
 *      }
 *  }
 *  
 *  QB.init(creds.appId, creds.authKey, creds.authSecret, config);
 * ```
 * 
 * 
 * Cases:
 * 1.Перед создание сессии проверяется хранилище на наличие токена.
 *   Если в хранилище есть токен, тогда проверяется соответствие appId и количество пройденного времени с config.expiredTime.
 *   
 *   1.1 Создание API Application (AS).
 *   After this action you have a read rules.
 *   ```javascript
 *     
 *   ```
 *
 *   1.2 Update AS to User session.
 *   After create a AS session by QB.init with apps parameters you can login by user.
 *   ```javascript
 *     QB.login(userParams, function(err, result) {
 *       console.log('LOGIN Callback', result, err);
 *     });
 *   ```
 *
 */

function SessionManager(params) {
    this.appParams = params;
    this.userParams = null;

    this.isSessionCreated = false;

    this.session = null;
    this.lastRequest = {};

    this.onerror = null; // client handle of error
}

/* STATIC METHODS */
SessionManager._ajax = typeof window !== 'undefined' ? require('./plugins/jquery.ajax').ajax : require('request');

SessionManager.prototype._createASRequestParams = function(params) {
    function randomNonce() {
        return Math.floor(Math.random() * 10000);
    }

    function unixTime() {
        return Math.floor(Date.now() / 1000);
    }

    function serialize(obj) {
        var serializedRequest = Object.keys(obj).reduce(function(accumulator, currentVal, currentIndex, array) {
            accumulator.push(currentVal + '=' + obj[currentVal]);

            return accumulator;
        }, []).sort().join('&');

        return serializedRequest;
    }

    function signRequest(reqParams, salt) {
        var serializedRequest = serialize(reqParams);

        return new CryptoSHA1(serializedRequest, salt).toString();
    }

    var reqParams = {
        'application_id': params.appId,
        'auth_key': params.authKey,
        'nonce': randomNonce(),
        'timestamp': unixTime()
    };

    reqParams.signature = signRequest(reqParams, params.authSecret);

    return reqParams;
};

SessionManager.prototype.createSession = function() {
    var self = this;

    var requestData = {
            'type': 'POST',
            'url': UTILS.getUrl(CONFIG.urls.session)
        };

    return new Promise(function(resolve, reject) {
        self.session = {};

        reqData.data = self._createASRequestParams(self.appCreds);

        SessionManager._ajax(reqData).done(function(response) {
            self.session = response.session;
            self.isSessionCreated = true;

            resolve(self.session.token);
        }).fail(function(jqXHR, textStatus) {
            this.session = null;

            reject(textStatus);
        });
    });
};

// SessionManager._b64EncodeUnicode = function(str) {
//     return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
//         return String.fromCharCode('0x' + p1);
//     }));
// };

// SessionManager._b64DecodeUnicode = function(str) {
//     return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
//         return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//     }).join(''));
// };

// SessionManager._getSavedInitialInfo = function(value) {
//     var regExp = new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)');
//     var matches = document.cookie.match(regExp);

//     return matches ? SessionManager._b64DecodeUnicode(matches[1]) : false;
// };

// SessionManager.prototype._saveToCookie = function(params) {
//     var now = new Date();
//     var time = now.getTime();
//     var expireTime = CONFIG.sessionManagement.expiredTime * 3600;
//     now.setTime(expireTime);

//     document.cookie = SessionManager._SAVED_TOKEN_NAME + '=' + SessionManager._b64EncodeUnicode(this.session.token) + ';expires='+ now.toGMTString() +';path=/';
//     document.cookie = SessionManager._CREATE_SESSION_PARAMS + '=' + SessionManager._b64EncodeUnicode(JSON.stringify(params)) + ';expires='+ now.toGMTString() +';path=/';
// };



// SessionManager.prototype._getSavedInfo = function (params) {
//     var self = this;
//     var token = SessionManager._getFromCookie(this._SAVED_TOKEN_NAME);

//     if(!token) {
//         return null;
//     }

//     var credsApp = +(JSON.parse(SessionManager._getFromCookie(this._CREATE_SESSION_PARAMS)));
//     var userId = +(JSON.parse(SessionManager._getFromCookie(this._SAVED_USER_ID)));

//     if(params.appId === (+credsApp.appId)) {
//         self.createSessionParams = credsApp;

//         return token;
//     } else {
//         return false;
//     }
// };

// SessionManager.prototype.destroy = function(){
//     this.session = null;
//     this.onerror = null;
//     this.lastRequest = {};
//     this.createSessionParams = {};

//     var cookies = document.cookie.split(';');

//     for (var i = 0; i < cookies.length; i++) {
//         var cookie = cookies[i];
//         var eqPos = cookie.indexOf('=');
//         var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
//         document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
//     }
// };



// SessionManager.prototype.reestablishSession = function() {
//     var self = this,
//         reqData = {
//             'type': 'POST',
//             'url': UTILS.getUrl(CONFIG.urls.session)
//         };

//     reqData.data = self._createASRequestParams(self.createSessionParams);

//     return new Promise(function(resolve, reject) {
//         if(self._isReestablished) {
//             reject(SessionManager.ERRORS.reestablish);
//         } else {
//              self._isReestablished = true;

//              SessionManager._ajax(reqData).done(function(response) {
//                 self.session = response.session;

//                 document.cookie = self._SAVED_TOKEN_NAME + '=' + SessionManager._b64EncodeUnicode(self.session.token);
//                 document.cookie = self._SAVED_APP_ID + '=' + SessionManager._b64EncodeUnicode(self.createSessionParams.appId);

//                 self._isReestablished = false;
//                 resolve(self.session.token);
//             }).fail(function(jqXHR, textStatus) {
//                 this.session = null;
//                 reject(textStatus);
//             });
//         }
//     });
// };

// SessionManager.prototype.updateUser = function(params){
//     this.session.id = params.userId;
//     document.cookie = this._SAVED_USER_ID + '=' + SessionManager._b64EncodeUnicode(params.userId);

//     console.info(this.session);
// };



// SessionManager._APP_CREDS = 'qbac';
// SessionManager._SAVED_TOKEN_NAME = 'qbst';
// SessionManager._SAVED_APP_ID = 'qbai';
// SessionManager._SAVED_USER_ID = 'qbui';


module.exports = SessionManager;