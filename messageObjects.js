class Transaction {
  constructor(buyer, seller, method, price, id) {
    this.recipient_name = buyer;
    this.merchant_name = seller;
    this.payment_method = method;
    this.total_cost = price;
    this.order_number = id;
  }
};  

class Button {
  constructor(title, payload) {
    this.type = "postback";
    this.title = title;
    this.payload = payload;
  }
};
    
class paymentElement {
  constructor(title, subtitle, quantity, price, image) {
    this.title = title;
    this.subtitle = subtitle;
    this.quantity = quantity;
    this.price = price;
    this.image_url = image;
  }
};

module.exports = {
  transactionMsg : Transaction,
  paymentElementMsg : paymentElement,
  buttonMsg : Button
}