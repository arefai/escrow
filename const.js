const objects = require('./messageObjects.js');

const ACTIONS = {
   "PRICE" : {
     type : "decimal",
     query : function (db, userid, txid, value) {
       db.run("UPDATE transactions SET price=? WHERE txid=?", [value, txid], function(){});
     }
   },
   "BUYER" : {
      type : "text",
      query : function(db, userid, txid, value) {
          db.run("UPDATE transactions SET buyer=? WHERE txid=?", [value, txid], function() {});
      }
   },
  "SELLER" : {
      type : "text",
      query : function(db, userid, txid, value) {
          db.run("UPDATE transactions SET seller=? WHERE txid=?", [value, txid], function() {});
      }
  },
  "FILE" : {
     type : "text",
    query: function(db, userid, txid, value) {
        db.run("UPDATE transactions SET itemLink=? WHERE txid=?", [value, txid], function() {}); 
    }
    
  }
  
}

const DYNAMIC_ACTIONS = {
   "SELLER_SHARE" : function(db, senderId, ui) {
      db.all("SELECT txid FROM conversationStates WHERE user=?", [senderId], function (err, rows) {
        if (!err && rows.length > 0) {
          let txid = rows[0]['txid'];
           ui.sendText(senderId, "You're transaction id is: " + txid + ", share this with the buyer you are transacting with so they can approve the item! Type anything to continue."); 
        }
      });
   },
   "BUYER_SHARE" : function(db, senderId, ui) {
     console.log("Performing buyer share");
      db.all("SELECT txid FROM conversationStates WHERE user=?", [senderId], function (err, rows) {
        console.log(err);
        if (!err && rows.length > 0) {
          let txid = rows[0]['txid'];
           ui.sendText(senderId, "You're transaction id is: " + txid + ", share this with the seller you are transacting with so they can upload the item! Since we can't send unsolicited messages, send us any message to check on the status of the transaction."); 
        }
      });   
   },
   "ITEM_APPROVE" : function (db, senderId, ui) {
      db.all("SELECT txid FROM conversationStates WHERE user=?", [senderId], function (err, rows) {
        if (!err && rows.length > 0) {
          let txid = rows[0]['txid'];
          db.all("SELECT itemLink from transactions WHERE txid=?", [txid], function (err, rows) {
             ui.sendText(senderId, "Here is your item: " + rows[0]['itemLink']); 

                      // separate values by comma 
            var buttonTexts = ["YES", "NO"];
            var buttons = []; 

            for (var i = 0; i < buttonTexts.length ; i++) {
                var newButton = new objects.buttonMsg(buttonTexts[i], buttonTexts[i]); 
                buttons.push(newButton);
            }

            ui.sendButton(senderId, "Is this item valid? If not, this case will enter arbitration and we will be in touch regarding the outcome.", buttons); 
          });
        }
      });
         
   }
  
  
}

const endState = 22;

module.exports = {
 PAGE_ACCESS_TOKEN : process.env.PAGE_ACCESS_TOKEN, 
  START_STATE : 0,
  BUYER_INCOMPLETE_STATE: 15,
  SELLER_INCOMPLETE_STATE: 17,
  BUYER_WAITING_STATE: 13,
  NEW_TRANSACTION_STATE: 7,
  HELP_STATE: 911,
  ABORT_STATE: 666,
  ACTIONS : ACTIONS,
  END_STATE : endState, 
  DYNAMIC_ACTIONS : DYNAMIC_ACTIONS,
}


