const dbInit = require('./dbInit.js');

exports.home = function (req, res) {
  let db = dbInit.getDb();
  let context = {}; // { transactions : [], messages : [], states : [] };
  db.all("select name from sqlite_master where type='table'", function (err, tables) {
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