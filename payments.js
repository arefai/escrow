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
const ui = require('./uiComponents.js');


module.exports = {
  sendCharge : sendCharge,
  home : home,
  connect : connect,
  authorize : authorize,
  receiveLogin : receiveLogin,
  sendRefund : sendRefund,
  sendTransfer : sendTransfer,
  confirm: confirm,
  final_pay: final_pay
}

function final_pay(req, res){
  let txid = req.query.txid;
  
  return dbHelp.allAsync("SELECT * FROM transactions WHERE txid=?", [txid])
  .then((rows) => {
    if (rows.length == 1) {
    }
    console.log("link to send: " + "/payments/submit?" + rows[0].buyer);
    let price = rows[0].price * 100;
    let psid = 0;
    let user = '';
    if (rows[0].seller_paid === 0) {
      user = 'seller';
      psid = rows[0].buyer;
    }
    else {
      user = 'buyer';
      psid = rows[0].seller;
    }
    
    return res.render('final_pay', { amount : price, txid : txid, link : "/payments/submit?txid=" + txid + "&amount=" + price + "&user=" + user + "&psid="});  
  })
  .catch(function (err) {
    return res.send(JSON.stringify({error: true, errorMessage: err }));
  });
}

function confirm(req, res) {
  res.render('confirmation');
}

function connect(req, res) {
  res.render('connect'); 
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
    redirect_uri : redirect_url, 
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
          return dbHelp.runAsync("INSERT INTO users (psid, stripe_id) VALUES (?, ?)", [psid, user_info.stripe_user_id]);
        else
          return dbHelp.runAsync("UPDATE users SET stripe_id=? WHERE psid=?", [user_info.stripe_user_id, psid]);
      })
      .then(function(dbRes) {
        //return res.send(JSON.stringify({error: false, redirect_url: redirect_url}));
        if (redirect_url === 'begin')
          return res.redirect("https://hospitable-quarter.glitch.me/extension");
        else 
          return res.redirect("https://hospitable-quarter.glitch.me/start_transaction?txid=" + txid);
      })
      .catch(function (err) {
        console.log(err);
        return res.send(JSON.stringify({error: true, errorMessage: "There was a problem with the database"}));
      });
    }
  })
}

function home(req, res) {
  let txid = req.query.txid;
  // select the psid based on the buyer or seller 
  let user = req.query.user;
  let redirect_url = req.query.redirect_url;
  console.log("txid in home: " + txid);
  
  return dbHelp.allAsync("SELECT * FROM transactions WHERE txid=?", [txid])
  .then((rows) => {
    if (rows.length == 1) {
    }
    console.log("link to send: " + "/payments/submit?" + rows[0].buyer);
    let price = rows[0].price * 100;
    let psid = 0;
    if (user == "buyer") {
      psid = rows[0].buyer;
    }
    else {
      psid = rows[0].seller;
    }
    
    return res.render('payments', { amount : price, link : "/payments/submit?psid=" + psid + "&txid=" + txid + "&amount=" + price + "&user=" + user + "&redirect=" + redirect_url});  
  })
  .catch(function (err) {
    return res.send(JSON.stringify({error: true, errorMessage: err }));
  });
}

function sendCharge(req, res) {
  // get psid, query db, get stripe ID, and charge this user
  console.log('got sendCharge');
  let psid = req.query.psid;
  let market_participant = req.query.user;
  console.log("market_participant: " + req.query.user);
  //let redirect_url = req.query.redirect;
  let txid = req.query.txid;
  let message = {
    "attachment": {
      "type":"template",
      "payload":{ 
        "template_type":"generic",
        "elements": [{
          "title":"Please verify this PDF sent by the seller",
          "buttons":[{
            "type":"postback",
            "title":"DENY",
            "payload":"DENY",
          },{
            "type":"postback",
            "title":"APPROVE",
            "payload":"APPROVE",
          }]
        }]
      }
    }
  };
  console.log("psid inside sendCharge: " + psid);
  return dbHelp.allAsync("SELECT * FROM users WHERE psid=?", [psid])
  .then((rows) => {
    console.log(rows);
    let stripe_id = rows[0].stripe_id;
    
    return stripe.charges.create({
      amount: req.query.amount,
      currency: "usd",
      source: stripe_id,
    });
  })
  .then(function(payment) {
      console.log("successful payment response");
      console.log(payment);
      var stripe_charge_id = payment.id;
      // update users with charge ids for future refunds
      // update transaction table with buyer_paid and seller_paid
      if (market_participant === "buyer") {
        return dbHelp.runAsync("UPDATE transactions SET buyer_paid=?, buyer_charge_id=? WHERE txid=?", [1, stripe_charge_id, txid])
      } 
      else {
        return dbHelp.runAsync("UPDATE transactions SET seller_paid=?, seller_charge_id=? WHERE txid=?", [1, stripe_charge_id, txid])
      }
  })
  .then(function (dbRes) {
    return dbHelp.allAsync("SELECT * FROM transactions WHERE txid=?", [txid])
  })
  .then(function(rows) {
    console.log('checking if both have paid');
    if (rows[0].buyer_paid && rows[0].seller_paid) {
      console.log('they have');
      console.log(rows[0].buyer);
      console.log(rows[0].itemLink);
      console.log(ui);
      
      ui.sendText(rows[0].buyer, rows[0].itemLink);
      ui.sendCustom(rows[0].buyer, message);
      ui.sendBash();
      
      // testing refunds
      console.log("TESTING TRANSFER");
      sendTransfer(txid);
      
      return dbHelp.allAsync('UPDATE conversationStates SET state=? WHERE user=?', [2, rows[0].buyer])
        .then(function (dbRes) {
          return dbHelp.allAsync('UPDATE conversationStates SET txid=? WHERE user=?', [txid, rows[0].buyer]);
        })
        .catch((err) => console.log(err));
    }
  })
  .then(function (dbRes) {
    return res.send(JSON.stringify({error: false, paymentSubmitted: true}));
  })
  .catch(function (err) {
    console.log(err);
    return res.send(JSON.stringify({error: true, paymentSubmitted: false, errorMessage: "There was a problem with the database"}));
  });  
}

function sendRefund(txid) {
  console.log("inside sendRefund with txid of " + txid);
  return dbHelp.allAsync("SELECT * FROM transactions WHERE txid=?", [txid])
  .then((rows) => {
    let price = rows[0].price;
    let amountToRefund = 0.5 * price;
    let charge_id = rows[0].buyer_charge_id;
    
    stripe.refunds.create({
      charge: charge_id,
      amount: price
    })
    .then(function(refund) {
      console.log("successful refund");
    })
    .catch(function (err) {
      return "There was an error with the Stripe payment";
    });
  })
  .catch(function (err) {
    return "There was a problem with the database";
  });
}

function sendTransfer(txid) {
  return dbHelp.allAsync("SELECT u.stripe_id, t.price FROM users u, transactions t WHERE t.txid=? AND t.seller = u.psid", [txid])
  .then((rows) => {
    let stripe_id = rows[0].stripe_id;
    //let amount = 2 * rows[0].price;
    let amount = 10;
    
    /*
    stripe.transfers.create({
        amount: 1000,
        currency: "usd",
        destination: stripe_id
      },
      {stripe_account: stripe_client_id}
    );
    
    //Create a Transfer to the connected account
    stripe.payouts.create({
        amount: amount,
        currency: "usd",
        method: "instant"
      },
      {stripe_account: stripe_id}
    );
    
    stripe.transfers.create({
      amount: amount,
      currency: "usd",
      destination: stripe_id,
      transfer_group: txid,
    })
    */
    
    stripe.charges.create({
      source: "tok_visa",
      amount: amount,
      currency: "usd",
      // The destination parameter directs the funds.
      destination: {
        amount: amount,
        account: stripe_id
      }
    })
    .then(function(transfer) {
      console.log("successful transfer from bot to seller");
    })
    .catch(function (err) {
      return "There was an error with the Stripe payment";
    });
  })
  .catch(function (err) {
    return "There was an error with the database";
  });
}
