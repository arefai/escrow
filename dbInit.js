const sqlite3 = require('sqlite3').verbose();
let db = null;


module.exports = {
  getDb : function () {
    if (db === null) {
      initDb();
    }
    return db; 
  }, 
}

function initDb() {
  db = new sqlite3.Database('db.sqlite3', (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the SQlite database.');
  });
}

function allAsync(sql) {
    return new Promise(function (resolve, reject) {
        db.all(sql, function (err, row) {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
}

function runAsync(sql) {
    return new Promise(function (resolve, reject) {
        db.run(sql, function (err, row) {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
  
  
}
