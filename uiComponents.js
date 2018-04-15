const 
  request = require('request'), 
  consts = require('./const.js'),
  objects = require('./messageObjects.js'),
  payment = require('./payments.js');

module.exports = {
  sendText : sendText,
  sendButton : sendButton,
  sendReciept : sendReciept,
  sendQuickReply : sendQuickReply
}

var car = {
  type:"Fiat", 
  model:"500", 
  color:"white"
};

function sendCustom(psid, message) {
  let body = {
    "recipient": {
      "id": psid
    },
    "message": message
  };
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": consts.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": body,
  }, 
  (err, res, body) => {
    if (!err) {
      console.log('custom message sent!');
    } 
    else {
      console.error("Unable to send message:" + err);
    }
  }); 
}
// Sends response messages via the Send API
function sendText(sender_psid, response) {
  // Construct the message body
  console.log("SENDER ID" + sender_psid);
  console.log(response);
  
  let body = {
   'text' : response 
  };
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": body
  };

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": consts.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, 
  (err, res, body) => {
    if (!err) {
      console.log('message sent!');
    } 
    else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

// Sends button with included options via the Send API
function sendButton(sender_psid, response, buttons) {
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
    // "message": body
    "message": {
      "attachment": {
        "type":"template",
        "payload":{
          "template_type":"button",
          "text": response,
          "buttons": buttons
        }
      }
    }
  }
  
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": consts.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, 
  (err, res, body) => {
    if (!err) {
      console.log('message sent!');
    } 
    else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

// Sends a quick reply
function sendQuickReply(sender_psid, response, quickReplies) {
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
    // "message": body
    "message": {
      "text": response,
      "quick_replies": quickReplies
      // "quick_replies":[
      //   {
      //     "content_type":"text",
      //     "title":"Search",
      //     "payload":"<POSTBACK_PAYLOAD>",
      //     "image_url":"http://example.com/img/red.png"
      //   }
      // ]
    }
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": consts.PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, 
  (err, res, body) => {
    if (!err) {
      console.log('message sent!');
    } 
    else {
      console.error("Unable to send message:" + err);
    }
  }); 
}


// Sends a recipt template
// Requires: 
// transaction - details the recipient (buyer) and merchant (seller) + total cost
// payment_elements (x2) - what is being transacted 
function sendReciept(sender_psid, response, transaction, payment_element_buy, payment_element_sell) {
    // Construct the message body
  sendText(sender_psid, response)
  console.log("SENDER ID" + sender_psid);
  console.log(response);
  let buyerElt = {
    title: payment_element_buy.title, 
    subtitle: payment_element_buy.subtitle, 
    quantity: payment_element_buy.quantity, 
    price: payment_element_buy.price,
    image_url: payment_element_buy.image_url
  }
  
  let sellerElt = {
    title: payment_element_sell.title, 
    subtitle: payment_element_sell.subtitle, 
    quantity: payment_element_sell.quantity, 
    price: payment_element_sell.price,
    image_url: payment_element_sell.image_url
  }
  
  let payment_sum = {
    "total_cost" : transaction.total_cost
  }
  
  let payload = {
    "template_type":"receipt",
    "recipient_name": transaction.recipient_name,
    "merchant_name": transaction.merchant_name,
    "order_number": transaction.order_number,
    "currency":"USD",
    "payment_method":transaction.payment_method, 
    "elements" : [buyerElt, sellerElt],
    "summary" : payment_sum
  }
  
  let body = {
   'type' : "template",
   'payload' : payload
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