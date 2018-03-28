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
        db.run("UPDATE trasactions SET fileLink=? WHERE txid=?", [value, txid], function() {}); 
    }
    
  }
  
}

const endState = 11;

module.exports = {
 PAGE_ACCESS_TOKEN : process.env.PAGE_ACCESS_TOKEN, 
  START_STATE : 0,
  HELP_STATE: 911,
  ABORT_STATE: 666,
  ACTIONS : ACTIONS,
  END_STATE : endState
}


