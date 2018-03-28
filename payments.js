"use strict";
var paypal = require('paypal-rest-sdk');

module.exports = {
  sendPayment : sendPayment
}

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AfEHBdXVSj_QdkMcEEYxMTFoGwKxxnORVUtsRHlVr9SWKB8DY-MtNCGl63g8tQLYjNYh6tTJ0Lr8dShq',
  'client_secret': 'EAPD4GugrBmLNVCYZVCfEQJXoeJuRnRr3HKARxLCTPyzcsjIrhFIbd0w9ssWeQPo3Y1xg0HtR2utcEdR'
});

// function to send payment request to Paypal API endpoint
function sendPayment(price) {
  console.log("Hello inside of payments");
  var create_payment_json = {
    "intent": "sale",
    "payer": {
      "payment-method": "paypal"
    },
    "redirect-urls": {
      "return_url": "https://hospitable-quarter.glitch.me/payments", // filler link
      "cancel_url": "https://hospitable-quarter.glitch.me/payments" // filler link
    },
    "transactions": [{
      "item-list": {
        "items": [{ 
          "name": "item",
          "sku": "item",
          "price": price,
          "currency": "USD",
          "quantity": 1
        }]
      },
      "amount": {
        "currency": "USD",
        "total": price
      },
      "description": "This is a test payment using PayPal API"
    }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      console.log("This is the payment response");
      console.log(payment);
    }
  });
}
