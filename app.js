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
  dbHTML = require('./dbhtml.js'),
  consts = require('./const.js'),
  properties = require('./properties.js'),
  extension = require('./extension.js');

const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');

let db = dbInit.getDb();

module.exports = app;

s3.initAWS(process);
s3.uploadLocalFile('./schema.sql', 'test.txt');

app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/database', dbHTML.home);

app.get('/extension', extension.home);
app.get('/start_transaction', extension.start_transaction);
app.post('/log', extension.log);

app.use(body_parser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(body_parser.json());

app.post("/submit_transaction", [
    check('price').exists().toFloat(),
    check('username').exists()], 
  function (req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.mapped() });
      }

      // matchedData returns only the subset of data validated by the middleware
      const user = matchedData(req);
      console.log(user);
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
