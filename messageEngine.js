
const 
  dbInit = require('./dbInit.js'), 
  request = require('request'), 
  consts = require('./const.js'),
  objects = require('./messageObjects.js'),
  ui = require('./uiComponents.js');
      
let db = dbInit.getDb();

module.exports = {
  sendMessage : sendMessage,   
  processMessage : processMessage
}

/*   db.all('SELECT * FROM transactions WHERE txid=?', [txid], (err, row) => {
      if (err) {
        return console.error(err.message);
      }
      if (row) {
        if (words.indexOf('buyer') > -1) {
          db.run('UPDATE transactions SET buyer=?', [words[3]], function(err) {
            if (err) {
              return console.error(err.message);
            }
            console.log(`Row(s) updated: ${this.changes}`);
 
          });
        }
        else if (words.indexOf('seller') > -1)

    });
    */

function processMessage(sender, message) {
    db.all('SELECT * FROM conversationStates where user=?', [sender], (err, rows) => {
      if (err) {
         console.log(`SQL ERROR ${err}`);
      }
      else {
       let state = consts.START_STATE;
       if (rows.length === 0) {
         console.log("NEW CONVERSATION");
         db.run('INSERT INTO transactions(buyer) VALUES (?)', [null], handleSQLError);
         let txid = null;
         db.all('SELECT last_insert_rowid()', (err, rows) => {
           if (err) {
             handleSQLError(err);
           }
           else {
             txid = rows[0]['last_insert_rowid()'];
           }
         });
         db.run('INSERT INTO conversationStates(user, state, txid) VALUES (?, ?, ?)', [sender, consts.START_STATE, txid], function (err) { 
           console.log("conversationStates INSERT FAILED")});
         sendStateMessage(state, sender);
       }
       else {
         state = rows[0]['state']; 
         if (message === "HELP") {
           sendStateMessage(consts.HELP_STATE, sender);
           sendStateMessage(state, sender);
         }
         else if (message === "ABORT") {
           // If they are at a place to abort they can abort otherwise we should tell them they cant
           db.run('DELETE FROM conversationStates WHERE user=?', [sender], handleSQLError);
           sendStateMessage(consts.ABORT_STATE, sender);
         }
         else if (message === "SUMMARY") {
           sendSummary(rows[0]['txid'], sender);
           sendStateMessage(state, sender);
         }
         else {
           moveTransaction(state, sender, message, rows[0]['txid']);
         }
       }
       
      }
    });
}

var testTrans = new objects.transactionMsg("Brendan Hart", "Rohan", "Visa 6392", "20.00", "1"); 
var testBuyerEl = new objects.paymentElementMsg("Escrow", null, "1", "20.00", "http://cashtyme.wpengine.com/wp-content/uploads/2015/04/money.png"); 
var testSellerEl = new objects.paymentElementMsg("Ticket", null, "1", "20.00", "https://marketingland.com/wp-content/ml-loads/2016/04/sp-tickets-600x393.png"); 

function moveTransaction(currentId, senderPSID, message, txid) {
  db.all('SELECT * FROM flowStates where state=?', [currentId], (err, rows) => {
    if (err) {
       console.log(`SQL ERROR ${err}`); 
    }
    else {
      if (rows.length === 0) {
        console.log(currentId);
        console.log("NO SUCH TRANSACTION");
      }
      else {
        let currentState = null;
        if (rows.length == 1 && rows[0].keyword === 'ANY') {
          currentState = rows[0];   
        }
        else {
            rows.forEach(row => {
            console.log("ROW KEWORD " + row.keyword);
            console.log("MESSAGE " + message);
            if (row.keyword === message) {
             currentState = row; 
            }
          });
        }
        
        if (currentState === null) {
          ui.sendText(senderPSID, "We could not recognize your response");
          return;
        }
        
        if (currentState.valueAction !== null) {
          try {
            let value = parseValue(currentState.valueAction, message);
            updateValue(currentState.valueAction, value, txid, senderPSID);
          }
          catch (err) {
            ui.sendText(senderPSID, "Sorry, the value you entered was invalid.");
            sendStateMessage(currentId, senderPSID);
            return;
          }
        }

        let nextTransactionId = currentState['nextstate'];
        if (nextTransactionId === consts.END_STATE) { 
          db.run("DELETE FROM conversationStates WHERE user=?", [senderPSID], handleSQLError);
          sendSummary(txid, senderPSID);
        }
        else {
          db.run("UPDATE conversationStates SET state=? where user=?", [nextTransactionId, senderPSID], handleSQLError);
        }
        return sendStateMessage(nextTransactionId, senderPSID);
      }
    }
    
  });
  
}

function sendStateMessage(stateId, senderId) {
  console.log("Sending state : " + stateId);
  if (stateId === null) {
   // End Conversation
      ui.sendText(senderId, "Thanks for talking!");
  }
  
  db.all('SELECT * FROM messages where state=?', [stateId], (err, rows) => {
    if (err) {
       console.log(`SQL ERROR ${err}`); 
    }
    else {
      if (rows.length === 0) {
        console.log("NO SUCH TRANSACTION");
      }
      else {
        let message = rows[0]['message'];
        let type = rows[0]['messageType'];
        let options = rows[0]['options'];
        console.log("SENDER" + senderId);
        
        if (type == "button") {
          // separate values by comma 
          var buttonTexts = options.split(',');
          var arrayLength = buttonTexts.length;
          
          var buttons = []; 
          
          for (var i = 0; i < arrayLength; i++) {
              var newButton = new objects.buttonMsg(buttonTexts[i], buttonTexts[i]); 
              buttons.push(newButton);
          }
          
          ui.sendButton(senderId, message, buttons); 
          
        }
        if (type == "text") {
          ui.sendText(senderId, message, null); 
        }
      }
    }
    
  });
  
}

// Sends response messages via the Send API
function sendMessage(sender_psid, response) {
    // Construct the message body
  console.log("SENDER ID" + sender_psid);
  console.log(response);
  let body = {
   'text' : response 
  }
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": body
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": consts.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}
  
function handleSQLError(err) {
   if (err) {
     console.log(err.message);
   }
}

function updateValue(key, value, txid, senderId) {
   if (consts.ACTIONS[key] !== undefined) {
     console.log("UPDATING " + key);
     consts.ACTIONS[key].query(db, senderId, txid, value);
   }
  else {
    console.log("ACTION UNDEFINED");
  }
}

function parseValue(keyword, text) {
  if (consts.ACTIONS[keyword] === undefined) {
     console.log("ACTION UNDEFINED");
  }
  else {
    let value = text.trim();
    switch (consts.ACTIONS[keyword].type) {
      case "decimal":
        if (value < 0) {
          throw "The value cannot be negative" 
        }
        if (value > 10000) {
          throw "The value cannot be greater than 10,000" 
        }
        value = parseFloat(value).toFixed(2)
        if(isNaN(value)) {
          throw "Not a number"
        }
        break;
      case "text":
        break;
    }
  }
  return text;
}

function sendSummary(txid, sender) {
  if(txid === undefined && txid === null) {
    return "No current Transaction available"; 
  }
  else {
    let response = "No current Transaction available";
    db.all("SELECT * FROM transactions WHERE txid=?", [txid], (err, rows) => {
      if (rows.length == 1) {
        // Iterate all object attributes, regardless of how many there are
        let items = ["SUMMARY:"];
        for(let key in rows[0]) {
          if (rows[0].hasOwnProperty(key)) {
            items.push(key + " : " + (rows[0][key] === null ? " " : rows[0][key]));
          }
        }
        ui.sendText(sender, items.join(" \n"));
      }
    });
  }
}
