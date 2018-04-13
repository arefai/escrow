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
  res.render('begin');
};

exports.log = function (req, res) {
  console.log('got : ');
  console.log(req.body);
  res.status(200).send('EVENT_RECEIVED');
}

exports.start_transaction = function (req, res) {
  /*db.all('SELECT * FROM transactions WHERE txid=?', [req.query.txid], (err, rows) => {
    if (err) {
      console.log(err);
    }
    else {
      console.log(rows);
    }
  });
  */
  console.log('start_transaction for' + req.query.txid);
  let data = {
    txid: req.query.txid
  };
  
  res.render('start_transaction', data);
  console.log('rendering continue(start_transaction)');
}

exports.process_transaction = function (req, res) {
  
}

exports.send_message = function (req, res) {
  console.log('send_message request recieved');
  console.log(req.body);
  let txid = req.body.txid;
  let psid = req.body.psid;
  return dbHelp.runAsync("INSERT INTO conversationStates(user, state, txid) VALUES (?, ?, ?)", [psid, 0, txid])
  .then((dbRes) => {
    return dbHelp.runAsync("UPDATE transactions SET asked_seller=1 WHERE txid=?", [txid]);
  })
  .then((dbRes) => {
    return dbHelp.allAsync("SELECT * FROM transactions WHERE txid=? INNER JOIN users ON transactions.buyer = users.psid", [txid]);
  })
  .then((rows) => {
    console.log(rows);
    let string = "You've agreed to a transaction on E-scrow bot. Here are some details of your transaction:\n";
    let transact = rows[0];+
    string.concat("Buyer: ").concat(transact.first_name).concat(' ').concat(transact.last_name).concat('\n');
    string.concat("Price: ").concat(transact.price).concat('\n');
    string.concat("Item Description: ").concat(transact.itemDescription).concat('\n');
    string.concat("Please upload your item to continue with this transaction.");
    
    
    ui.sendText(req.body.psid, string);
    return res.status(200).send('EVENT_RECEIVED');
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
