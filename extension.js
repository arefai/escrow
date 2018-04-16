/*(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.com/en_US/messenger.Extensions.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'Messenger'));
*/
const ui = require('./uiComponents.js'),
  dbHelp = require('./dbhtml.js'),
  dbInit = require('./dbInit.js');

let db = dbInit.getDb();

exports.home = function (req, res) {
  console.log('rendering begin');
  ui.sendBash();
  res.render('begin');
};

exports.log = function (req, res) {
  console.log('got : ');
  console.log(req.body);
  res.status(200).send('EVENT_RECEIVED');
}

exports.start_transaction = function (req, res) {
  return dbHelp.allAsync('SELECT * FROM transactions WHERE txid=?', [req.query.txid])
  .then((rows) => {
      console.log('start_transaction for' + req.query.txid);
      console.log(req.query);
      console.log(rows);
      let amount;
      let user;
      if (rows[0].seller === null) {
        user = 'seller';
        amount = 100;
      }
      else {
        user = 'buyer';
        amount = rows[0].price;
      }
      let data = {
        txid: req.query.txid,
        amount: amount*100,
        link: "/payments/submit?txid=" + req.query.txid + "&amount=" + amount*100 + "&user=" + user + "&psid="
      };
  
      res.render('start_transaction', data);
      console.log('rendering continue(start_transaction)');
  })
  .catch((err) => {
    console.log(err);
    return res.render('start_transaction');
  });
}

exports.redirect_user = function (req, res) {  
  let data = {
     txid: req.query.txid 
  }
  console.log("rendering redirect");
  res.render('redirect', data);
}

exports.process_transaction = function (req, res) {
  
}

exports.send_message = function (req, res) {
  console.log('send_message request recieved');
  console.log(req.body);
  let txid = req.body.txid;
  let psid = req.body.psid;
  console.log("TX IN SEND MESSAGE" + txid);
  console.log("PSID IN SEND MESSAGE" + psid); 
  return dbHelp.allAsync("SELECT * FROM conversationStates WHERE user=?", [psid])
  .then((rows) => {
    if (rows.length == 0)
      return dbHelp.runAsync("INSERT INTO conversationStates(user, state, txid) VALUES (?, ?, ?)", [psid, 0, txid]);
    else 
      return dbHelp.runAsync("DELETE FROM conversationStates WHERE user=?", [psid])
      .then((dbRes) => { return dbHelp.runAsync("INSERT INTO conversationStates(user, state, txid) VALUES (?, ?, ?)", [psid, 0, txid]);});
  })
  .then((dbRes) => {
    return dbHelp.runAsync("UPDATE transactions SET asked_seller=1 WHERE txid=?", [txid]);
  })
  .then((dbRes) => {
    return dbHelp.allAsync("SELECT * FROM transactions LEFT JOIN users ON transactions.buyer=users.psid WHERE transactions.txid=?", [txid]);
  })
  .then((rows) => {
    console.log(rows);
    let string = "You've agreed to a transaction on E-scrow bot. Here are some details of your transaction:\n";
    let transact = rows[0];
    if (transact.first_name)
      string = string.concat("Buyer: ").concat(transact.first_name).concat(' ').concat(transact.last_name).concat('\n');
    string = string.concat("Price: ").concat(transact.price).concat('\n');
    string = string.concat("Item Description: ").concat(transact.itemDescription).concat('\n');
    string = string.concat("Please upload your item to continue with this transaction.");
    
    console.log('about to call ui.sendText');
    ui.sendText(req.body.psid, string);
    return res.status(200).send('EVENT_RECEIVED');
  })
  .catch((err) => {
    console.log(err);
  });
}

exports.change_price = function (req, res) {
  console.log('change_price for' + req.query.txid);
  let data = {
    txid: req.query.txid
  };
  res.render('change_price', data);
};

exports.abort = function (req, res) {
};


exports.database = function (req, res) {

};

exports.sendFinalMessage = function (txid, message) {
  return dbHelp.allAsync("SELECT * FROM transactions WHERE txid=?", [txid])
  .then((rows) => {
    ui.sendText(rows[0].buyer, message);
    ui.sendText(rows[0].seller, message);
  });
}