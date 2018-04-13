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

module.exports = {
  sendCharge : sendCharge,
  home : home,
  connect : connect,
  authorize : authorize,
  login : login
}

function connect(req, res) {
  res.render('connect');
  //res.render('/views/connect.ejs', { psid_fb : req.query.psid_fb }); 
}

function authorize(req, res) {
  // Generate a random string as state to protect from CSRF and place it in the session.
  // var psid = req.query.psid
  var session_state = Math.random().toString(36).slice(2);
  // Prepare the mandatory Stripe parameters.
  let parameters = {
    redirect_uri : stripe_redirect_uri, 
    client_id: stripe_client_id,
    state: session_state,
  };
  
  console.log("Authorize dat boi"); 

  res.redirect(stripe_authorize_url + '?' + querystring.stringify(parameters));
}

function login(req, res) {  
  // Post the authorization code to Stripe to complete the authorization flow.
  var psid = req.query.state
  console.log(req.query.state)
  request.post(stripe_connect_url, {
    form: {
      grant_type: 'authorization_code',
      client_id: stripe_client_id,
      client_secret: stripe_test_key,
      code: req.query.code
    }, json: true
  }, (err, response, body) => {
    if (err || body.error) {
      console.log('The Stripe onboarding process has not succeeded.');
    } else {
      // Update the model and store the Stripe account ID in the datastore.
      // This Stripe account ID will be used to pay out to the pilot.
      console.log("User data - take that for data!"); 
      
      var user_info = {
        stripe_user_id : body.stripe_user_id,
        stripe_user_access_tok : body.access_token,
        stripe_refresh_tok : body.refresh_token,
        stripe_publishable_key : body.stripe_publishable_key
      }
      
      console.log(user_info);
    }
    
    // Redirect to the final stage.
    res.redirect('https://facebook.com');
  });
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
