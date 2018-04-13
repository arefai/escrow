const dbInit = require('./dbInit.js');

function home(req, res) {
  let db = dbInit.getDb();
  let context = {}; // { transactions : [], messages : [], states : [] };
  db.all("select name from sqlite_master where type='table' ORDER BY name ASC", function (err, tables) {
    console.log(tables);
    let j = 0;
    for(let i = 0; i < tables.length; ++i) {
      // console.log('SELECT * FROM ' + tables[i].name);
      db.all('SELECT * FROM ' + tables[i].name, (err, rows) => {
        if (err) {
          console.log(err.message);
        }
        // console.log(rows);
        context[tables[i].name] = [];
        rows.forEach((row) => {
          context[tables[i].name].push(row);
        });
        ++j;
        if (j == tables.length) {
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify(context, null, 3));
        }
      });
    }
  });
};

function allAsync(sql, params) {
    let db = dbInit.getDb();
    return new Promise(function (resolve, reject) {
        db.all(sql, params, function (err, row) {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
}

function runAsync(sql, params) {
    let db = dbInit.getDb();
    return new Promise(function (resolve, reject) {
        db.run(sql, params, function (err) {
            if (err)
                reject(err);
            else {
                resolve(this);
            }
        });
    });
  
  
}


module.exports = {
  allAsync : allAsync, 
  runAsync : runAsync,
  home : home
}
