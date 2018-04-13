/*
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Remix this as the starting point for following the Messenger Platform
 * quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';



// Imports dependencies and set up http server
const 
  s3 = require('./S3Manager.js'),
  messageEngine = require('./messageEngine.js'),
  dbInit = require('./dbInit.js'),
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()), // creates express http server
  dbHelp = require('./dbhtml.js'),
  payments = require('./payments.js'),
  consts = require('./const.js'),
  properties = require('./properties.js'),
  uuid = require('uuid/v4'),
  fetch = require('node-fetch'),
  extension = require('./extension.js');

const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

let db = dbInit.getDb();

module.exports = app;

/*
s3.initAWS(process);
s3.uploadLocalFile('./schema.sql', 'test.txt');
*/

app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/database', dbHelp.home);

app.get('/payments', payments.home);
app.post('/payments/submit', payments.sendCharge); 
app.get('/connect', payments.connect); 
app.get('/authorize', payments.authorize); 
app.get('/login', payments.login);

app.get('/extension', extension.home);
app.get('/start_transaction', extension.start_transaction);
app.get('/abort', extension.abort);
app.get('/change_price', extension.change_price);
app.post('/log', extension.log);
app.post('/send_message', extension.send_message);
app.post('/post_database', extension.database);

app.use(body_parser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(body_parser.json());

app.post("/submit_transaction", [
    check('sender_id').exists(),
    check('group_id').exists(),
    check('price').exists().isDecimal().toFloat(), 
    check('sender_is_buyer').exists().isBoolean().toBoolean(), 
    check('item_description').exists()], 
  function (req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ error : true, errors: errors.mapped() });
      }

      // matchedData returns only the subset of data validated by the middleware
      const request = matchedData(req);
      request.price = request.price.toFixed(2);
  
      let params = [];
      console.log(typeof(uuid()));
      params.push(uuid().replace(/\-/g, ''));
      if (request['sender_is_buyer']) {
        params.push(request.sender_id);
        params.push(null);
      }
      else {
        params.push(null);
        params.push(request.sender_id);
      }
  
      params.push(request.price);
      params.push(request.item_description);
      params.push(request.group_id);
  
      return dbHelp.runAsync("INSERT INTO transactions(txid, buyer, seller, price, itemDescription, groupId) VALUES(?,?,?,?,?,?)",
                         params)
      .then((dbRes) => {
            let url = "https://graph.facebook.com/v2.6/".concat(request.sender_id).concat("?fields=first_name,last_name&access_token=419937085114571");
        console.log(url);    
        return fetch(url, {
              credentials: 'same-origin',
              method: 'GET',
            }).then((response) => {
              if (!response.ok) throw Error(response.statusText);
              return response.json();
            }).then((data) => {
              return data;
            }).catch(error => {return null;});
      })
      .then((data) => {
         if (data) {
           request.first_name = data.first_name;
           request.last_name = data.last_name;
         }
         else {
          request.first_name = "Not Found";
           request.last_name = "Not Found";
         }
      })
      .then(() => {
        return dbHelp.runAsync("UPDATE users SET first_name=? WHERE psid=?", [request.first_name, request.sender_id]);
      })
      .then((dbRes) => {
        return dbHelp.runAsync("UPDATE users SET last_name=? WHERE psid=?", [request.last_name, request.sender_id]);
      })
      .then(function(dbRes) {
        if (dbRes.changes) {
          console.log(dbRes);
          return res.send(JSON.stringify({error : false, txid : params[0]}));
        }
        else {
          throw "database not changed";
        }
      })
      .catch(function(err) {
        console.log(err);
        return res.status(500).send(JSON.stringify({error : true, errorMessage : "There was a problem with the database"}));
      });
});

app.get("/transaction_info", function (req, res) {
  // console.log('transaction_info req received');
    let txid = req.query['txid'];
    return dbHelp.allAsync("SELECT * FROM transactions WHERE txid=?", [txid])
    .then(function(rows) {
      // console.log(rows);
      if(rows.length == 0) {
         return res.status(400).send(JSON.stringify({error : true, errorMessage : "No such transaction exists"}));
      }
      else {
         res.setHeader('Content-Type', 'application/json');
         return res.send(JSON.stringify({transaction : rows[0], error : false}));
      }
    })
    .catch(function (err) {
      return res.status(500).send(JSON.stringify({error : true, errorMessage : "There was a problem with the database"}));
    });
});

app.post("/set_price", function (req, res) {
  let price = parseFloat(req.body.price).toFixed(2);
  let txid = req.body.txid;
  if (isNaN(price)) {
    return res.status(400).send(JSON.stringify({error : true, errorMessage : "Invalid price"}));
  }
  else {
    return dbHelp.runAsync("UPDATE transactions SET price=? WHERE txid=?", [price, txid])
    .then(function(dbRes) {
      let resJSON = {}
      resJSON.error = dbRes.changes ? false : true;
      if (resJSON.error) {
         resJSON.errorMessage = "No such transaction exists"; 
      }
      return res.send(JSON.stringify(resJSON));
    })
    .catch(function (err) {
      return res.send(JSON.stringify({error: true, errorMessage: "There was a problem with the database"}));
    });
  }
});

app.post("/user_agree", [
  check('role').exists().isIn(['BUYER', 'SELLER']),
  check('psid').exists(),
  check('txid').exists()
],
  function (req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ error : true, errors: errors.mapped() });
      }

      // matchedData returns only the subset of data validated by the middleware
      const request = matchedData(req);
      
      return dbHelp.allAsync("SELECT * from transactions WHERE txid=?", [request.txid])
      .then(function (rows) {
        if (rows.length != 1)
          throw "No such transaction"
        
        console.log(rows);
        console.log(request)
        let transact = rows[0];
        let sqlToRun = null;
        if (request.role === 'BUYER' && transact.buyer === request.psid) {
          console.log("RUNNING BUYER AGRED");
          return dbHelp.runAsync("UPDATE transactions SET buyer_agreed=1 WHERE txid=?", [transact.txid]);
        }
        else if (request.role === 'SELLER' && transact.seller === request.psid) {
          return dbHelp.runAsync("UPDATE transactions SET seller_agreed=1 WHERE txid=?", [transact.txid]);
        }
        else if (request.role === 'SELLER' && transact.seller === null) {
         if (request.psid === transact.buyer) 
           throw "Buyer cannot be seller";
          
         return dbHelp.runAsync("UPDATE transactions SET seller=? WHERE txid=?", [request.psid, transact.txid])
          .then(function(dbRes) {
             console.log(dbRes);
             if (dbRes.changes === false) {
                throw "Could not update transaction";
             }
             else {
               return dbHelp.runAsync("UPDATE transactions SET seller_agreed=1 WHERE txid=?", [transact.txid]);
             }
           })
           .catch(err => {
             throw err;
           });
        }
        else if (request.role == 'BUYER' && transact.buyer === null) {
          if (request.psid === transact.seller) 
            throw "Buyer cannot be Seller";
          
         return dbHelp.runAsync("UPDATE transactions SET buyer=? WHERE txid=?", [request.psid, transact.txid])
          .then(function(dbRes) {
             console.log(dbRes);
             if (dbRes.changes === false) {
                throw "Could not update transaction"; 
             }
             else {
               return dbHelp.runAsync("UPDATE transactions SET buyer_agreed=1 WHERE txid=?", [transact.txid]);
             }
           })
           .catch(err => {
              throw err;
           });
        }
        else {
          throw "Transaction status incorrect for this method";
        }
      })
      .then(function (dbRes) {
          console.log(dbRes);
          if (dbRes.changes === false)
            throw "No such transaction" 
        
          return res.send(JSON.stringify({error : false, successMessage : "Succesfully updated db"}));
      })
      .catch(function (err) {
        console.log(err);
        return res.send(JSON.stringify({error : true, errorMessage : err}));
      });
});

// check if current user's payment information is stored in db
app.post('/checkUser', function (req, res) {
    let psid = req.body.psid
    
    return dbHelp.allAsync("SELECT * FROM users WHERE psid=?", [psid])
    .then(function(rows) {
      return res.send(JSON.stringify({error: false, userPresent: rows.length == 1}));
    })
    .catch(function (err) {
      return res.send(JSON.stringify({error: true, errorMessage: "There was a problem with the database"}));
    });
});

// check if current user's payment information is stored in db
app.post('/getStripeID', function (req, res) {
    let psid = req.body.psid
    
    return dbHelp.allAsync("SELECT stripe_id, auth_token FROM users WHERE psid=?", [psid])
    .then(function(rows) {
      return res.send(JSON.stringify({error: false, stripe_id: rows.stripe_id, auth_token: rows.auth_token}));
    })
    .catch(function (err) {
      return res.send(JSON.stringify({error: true, errorMessage: "There was a problem with the database"}));
    });
});

// check if current user's payment information is stored in db
app.post('/insertStripeInfo', function (req, res) {
    let psid = req.body.psid
    let stripe_id = req.body.stripe_id
    
    return dbHelp.allAsync("UPDATE users SET stripe_id=? WHERE psid=?", [stripe_id, psid])
    .then(function(rows) {
      return res.send(JSON.stringify({error: false}));
    })
    .catch(function (err) {
      return res.send(JSON.stringify({error: true, errorMessage: "There was a problem with the database"}));
    });
});

app.post('/update_transaction', [ 
        check('role').exists().isIn(['BUYER', 'SELLER']), 
        check('psid').exists(), 
        check('txid').exists()],
  function (req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ error : true, errors: errors.mapped() });
      }

      // matchedData returns only the subset of data validated by the middleware
      const request = matchedData(req);
      
      return dbHelp.allAsync("SELECT * FROM transactions WHERE txid=?", [request.txid])
      .then(function (rows) {
        if (rows.length == 0)
           throw "No such transaction" 
        
        let transact = rows[0]
        if (request.role === 'BUYER' && transact.buyer !== null) 
           throw "BUYER already set";
          
        if (request.role === 'SELLER' && transact.seller !== null)
            throw "Seller already set";
      })
      .then((dbRes) => {
            let url = "https://graph.facebook.com/v2.6/".concat(request.sender_id).concat("?fields=first_name,last_name&access_token=419937085114571");
            return fetch(url, {
              credentials: 'same-origin',
              method: 'GET',
            }).then((response) => {
              if (!response.ok) throw Error(response.statusText);
              return response.json();
            }).then((data) => {
              return data;
            }).catch(error => {throw error;});
      })
      .then((data) => {
         request.first_name = data.first_name;
         request.last_name = data.last_name;
      })
      .then(function () {
        if (request.role === 'BUYER')
          return dbHelp.runAsync("UPDATE transactions SET BUYER=? WHERE txid=?", [request.psid, request.txid]);
        else
          return dbHelp.runAsync("UPDATE transactions SET SELLER=? WHERE txid=?", [request.psid, request.txid]);
      })
      .then(function (dbRes) {
          if (dbRes.changes === false)
            throw "Could not update transaction";
        
           return dbHelp.runAsync("UPDATE users SET first_name=? WHERE psid=?", [request.first_name, request.psid])
            .then((dbRes) => {
              return dbHelp.runAsync("UPDATE users SET last_name=? WHERE psid=?", [request.last_name, request.psid]);
            })
      })
      .then(function (dbRes) {
          return res.send(JSON.stringify({error : dbRes.changes ? false : true}));
      })
      .catch( err => {
          return res.send(JSON.stringify({errors : true, errorMessage : err}));
      });
});



// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;
  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event.message);
      
      let sender_psid = webhook_event.sender.id;

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message && webhook_event.message.app_id === undefined) {
        if (webhook_event.message.attachments) {
          console.log(webhook_event.message.attachments); 
          messageEngine.processMessage(sender_psid, webhook_event.message.attachments[0]['payload']['url'])
        }
        else {
          messageEngine.processMessage(sender_psid, webhook_event.message.text);   
        }
      } 
      else if (webhook_event.postback) {
        messageEngine.processMessage(sender_psid, webhook_event.postback.payload);
      }
      
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "ccf200e1d8b344978d38a55365258616";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

app.get('/helloworld', (req, res) => {
  console.log("hello world");
  res.sendStatus(200);
});

app.get('/payments', (req, res) => {
  // console.log("Hello inside of payments");
  res.render('payment is processing...');
  res.sendStatus(200);
});



class Transaction {
  constructor(buyer, seller, price, id) {
    this.buyer = buyer;
    this.seller = seller;
    this.price = price;
    this.id = id;
    this.state = 0;
  }
}

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  console.log(received_message.text);
  if (received_message.text === undefined) {
    return;
  }
  
  if (received_message.text) {
    response = {
      'text' : `Parrot Says: "${received_message.text}"`
    }
  }
  let db = dbInit.getDb();
  if (received_message.text === "create transaction") {
    db.run('INSERT INTO transactions(buyer, seller, price) VALUES(?, ?, ?)', ['', '', 0], function(err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      response = {'text' : `Ok transaction id is ${this.lastID}`};
      messageEngine.sendMessage(sender_psid, response);
    });
  }
  else {
    let words = received_message.text.split(' ');
    console.log(words);
    let txid = parseInt(words[0]);
    db.all('SELECT * FROM transactions WHERE txid=?', [txid], (err, row) => {
      if (err) {
        return console.error(err.message);
      }
      if (row.length !== 0) {
        let word = '';
        let value = '';
        if (words.indexOf('buyer') > -1) {
          word = 'buyer';
          value = words[3];
        }
        else if (words.indexOf('seller') > -1) { 
          word = 'seller';
          value = words[3];
        }
        else if (words.indexOf('price') > -1) { 
          word = 'price';
          value = parseInt(words[3]);
          
        }
        if (word !== ''){
          db.run('UPDATE transactions SET ' + word + '=?', [value], function(err) {
            if (err) {
              return console.error(err);
            }
            console.log(`Row(s) updated: ${this.changes}`);

          });
          response = { 'text' : `Ok transaction ${txid} ${word} id is "${value}"`};
        }
        else if (words.indexOf('print') > -1) {
          console.log(row);
          response = { 'text' : `Ok transaction ${row[0].txid} buyer : ${row[0].buyer}; seller : ${row[0].seller}; price : ${row[0].price};` };
        }
      }
      else {
        response = { 'text' : 'invalid transaction id' };
      }
      messageEngine.sendMessage(sender_psid, response);
    });
  }  
}
