let request = require('request'),
  consts = require('./const.js');
let token = 'EAAF97jjJSMsBABtfnjXfFGo5f62Q1E2cyIsPB9QkaQZAiXxkUvbbY6EaXOmKJ12yewQhxqWG9ZADi7xJeHIW7dcm6Bv9btdY4YAZBscRn1PERHkdsF76L8gR9ZAargFWPWyD5Jji6WrAHXFbLaK8ZCUzyDXFgYwfs9Ahylo6PyQZDZD'
exports.home = function (req, res) {
  request(`https://graph.facebook.com/v2.6/me/messenger_profile?properites=home_url&
          access_token=${token}`, function (error, response, body) {
    console.log(body);
  });
};

