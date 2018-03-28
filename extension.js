/*(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.com/en_US/messenger.Extensions.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'Messenger'));
*/


exports.home = function (req, res) {
  console.log('rendering second');
  res.render('second')
};

exports.log = function (req, res) {
  console.log('got : ');
  console.log(req.body);
  res.status(200).send('EVENT_RECEIVED');
}

exports.start_transaction = function (req, res) {
  console.log('rendering start_transaction');
  res.render('start_transaction');
}

exports.process_transaction = function (req, res) {
   
  
}