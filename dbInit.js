const sqlite3 = require('sqlite3').verbose();
let db = null;


module.exports = {
  getDb : function () {
    if (db === null) {
      initDb();
    }
    return db; 
  }
}

function initDb() {
  db = new sqlite3.Database('db.sqlite3', (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the SQlite database.');
  });
}
