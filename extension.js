/*(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.com/en_US/messenger.Extensions.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'Messenger'));
*/
const ui = require('./uiComponents.js');


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
  console.log('rendering continue(start_transaction)');
  res.render('continue');
}

exports.process_transaction = function (req, res) {
  
}

exports.send_message = function (req, res) {
  console.log('send_message request recieved');
  console.log(req.body);
  ui.sendText(req.body.psid, req.body.message);
  res.status(200).send('EVENT_RECEIVED');
}

exports.change_price = function (req, res) {
};

exports.abort = function (req, res) {
};


exports.database = function (req, res) {

};
