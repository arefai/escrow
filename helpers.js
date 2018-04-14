const dbHelp = require('./dbhtml.js'),
  fetch = require('node-fetch');

module.exports = {
   checkAndUpdateUser : checkAndUpdateUser,
  findName : findName
}

function checkAndUpdateUser (first_name, last_name, psid) {
   return dbHelp.allAsync("SELECT * FROM users WHERE psid=?", [psid])
  .then((rows) => {
     if(rows.length == 0) 
       return dbHelp.runAsync("INSERT INTO users(psid, first_name, last_name) VALUES (?,?,?)", [psid, first_name, last_name]);
     else
       return dbHelp.runAsync("UPDATE users SET first_name=? WHERE psid=?", [first_name, psid])
             .then((dbRes) => {
               return dbHelp.runAsync("UPDATE users SET last_name=? WHERE psid=?", [last_name, psid])
             });
   });
  
}

function findName(psid) {
    let name = []
    let url = "https://graph.facebook.com/v2.6/".concat(psid).concat("?fields=first_name,last_name&access_token=").concat(process.env.PAGE_ACCESS_TOKEN);    
    console.log(url);
    return fetch(url, {
      credentials: 'same-origin',
      method: 'GET',
    })
    .then((response) => {
      console.log(response);
    if (!response.ok) throw Error(response.statusText);
        return response.json();
    })
    .then((data) => {
       name[0]= data.first_name;
       name[1] = data.last_name;
       console.log(name);
       return name;
    })
}