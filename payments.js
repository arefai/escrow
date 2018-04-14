"use strict";

var stripe = require("stripe")("sk_test_Be8aSqR2PVKve88a4PHfxl0T");
var stripe_client_id = "ca_CeE4r79P9oIOKuEaWVNoCjZVO9AVmvy4";
var stripe_authorize_url = "https://connect.stripe.com/express/oauth/authorize"
var stripe_redirect_uri = "https://hospitable-quarter.glitch.me/login"
var stripe_connect_url = "https://connect.stripe.com/oauth/token"
var stripe_test_key = "sk_test_Be8aSqR2PVKve88a4PHfxl0T"

const querystring = require('querystring');
const url = require('url');
const request = require('request'); 
const dbHelp = require('./dbhtml.js');

module.exports = {
  sendCharge : sendCharge,
  home : home,
  connect : connect,
  authorize : authorize,
  login : login,
  receiveLogin : receiveLogin
}

function connect(req, res) {
  res.render('connect');
  //res.render('/views/connect.ejs', { psid_fb : req.query.psid_fb }); 
}

function authorize(req, res) {
  // Generate a random string as state to protect from CSRF and place it in the session.
  // var psid = req.query.psid
  console.log(req.query);
  let redirect_url = req.query.redirect;
  let psid = req.query.psid;
  let txid = req.query.txid;
  
  
  var session_state = psid + "_" + txid;
  // Prepare the mandatory Stripe parameters.
  // Save psid into session here
  let parameters = {
    redirect_uri : stripe_redirect_uri, 
    client_id: stripe_client_id,
    state: session_state,
  };
  
  console.log("Authorize dat boi"); 

  res.redirect(stripe_authorize_url + '?' + querystring.stringify(parameters));
}

function receiveLogin(req, res) {
  let redirect_url = req.params.redirect;
  console.log("Redirect_url received by /receiveLogin: " + redirect_url);
  let psid_txid = req.query.state.split("_");
  let psid = psid_txid[0];
  let txid = psid_txid[1];
  
  console.log("PSID: " + psid);
  console.log("TXID: " + txid);
  
  // post to stripe
  request.post(stripe_connect_url, {
    form: {
      grant_type: 'authorization_code',
      client_id: stripe_client_id,
      client_secret: stripe_test_key,
      code: req.query.code
    }, json: true
  },(err, response, body) => {
    if (err || body.error) {
      return res.send(JSON.stringify({error: true, errorMessage: 'The Stripe onboarding process has not succeeded.'}));
    } 
    else {
      // Update the model and store the Stripe account ID in the datastore.
      // This Stripe account ID will be used to pay out to the pilot.
      console.log("User data - take that for data!"); 
      
      console.log("data received from stripe: " + JSON.stringify(body));
      let user_info = {
        stripe_user_id : body.stripe_user_id,
        stripe_user_access_tok : body.access_token,
        stripe_refresh_tok : body.refresh_token,
        stripe_publishable_key : body.stripe_publishable_key
      }
      
      console.log("Your psid: " + psid);
      return dbHelp.allAsync("SELECT * FROM users WHERE psid=?", [psid])
      .then((rows) => {
        if (rows.length === 0)
         return dbHelp.runAsync("INSERT INTO users (psid, stripe_id, auth_token) VALUES (?, ?, ?)", [psid, user_info.stripe_user_id, user_info.stripe_user_access_tok])
        else
          return dbHelp.runAsync("UPDATE users SET stripe_id=? WHERE psid=?", [user_info.stripe_user_id, psid])
          .then((dbRes) => {
            return dbHelp.runAsync("UPDATE users SET auth_token=? WHERE psid=?", [user_info.stripe_user_access_tok, psid]);
          });
      })
      .then(function(dbRes) {
        //return res.send(JSON.stringify({error: false, redirect_url: redirect_url}));
        if (redirect_url === 'begin')
          return res.redirect("https://hospitable-quarter.glitch.me/extension");
        else 
          return res.redirect("https://hospitable-quarter.glitch.me/start_transaction?txid=" + txid);
      })
      .catch(function (err) {
        return res.send(JSON.stringify({error: true, errorMessage: "There was a problem with the database"}));
      })
    }
  })
}

function home(req, res) {
  res.render('payments', { amount : 1000 }); 
}

// function to send payment request to Stripe API endpoint
// need: amount of transaction, stripe user id 
function sendCharge(req, res) {
  console.log("Hello inside of payments");
  let stripe_id = req.stripe_id
  let amount = req.amount 
  
  stripe.charges.create({
    amount: amount,
    currency: "usd",
    source: stripe_id
  }).then(function(error, payment) {
      if (error) {
        throw error;
      } else {
        console.log("This is the payment response");
        console.log(payment);
      }
  });
}

function sendPaymentInfo(psid) {
  
}
