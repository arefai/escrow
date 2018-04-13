INSERT INTO flowStates (state, keyword, valueAction, nextstate) VALUES 
(0, 'ANY', 'FILE', 1),
(1, 'ANY' , null, 0)

/*
    (0, 'PAYMENTS', null, 1),
    (1, 'ANY', null, 2),
    (2, 'ANY', null, 3),
    (3, 'ANY', null, 4),
    (4, 'ANY', null, 5),
    (5, 'ANY', null, 0),
    (6, 'NEW', 'NEW_TRANSACT', 7),
    (6, 'EXISTING', null, 14),
    (7, 'ANY', 'BUYER', 8),
    (8, 'ANY', 'SELLER', 9),
    (9, 'BUYER', null, 13),
    (9, 'SELLER', null, 10),

    --- Seller info 
    (10, 'ANY', 'PRICE', 11),
    (11, 'ANY', 'FILE', 12),
    -- Existing transaction, code will jump state
    (12, 'ANY', '', 21),
    (13, 'ANY', '', 15),
    (14, 'ANY', 'EXISTING_TRANSACTION', 0),
    
    -- Seller incomplete
    (17, 'ANY', 'FILE', 18),
    (18, 'ANY', 'PRICE', 21),
    
    -- Is item ok?
    (15, 'YES', null, 22),
    (15, 'NO', null, 16),
    (16, 'ANY', null, 22),
    (22, 'ANY', null, 0),
    (0, 'TRANSACTION', null, 6);
    */
    
INSERT INTO messages(state, messageType, message, options) VALUES 
  (0, 'dynamic', 'TRANSACTION INFO HERE: ', 'SELLER_UPLOAD')

/*
    -- beginning general info
    (0, 'button', 'Hi, welcome to escrow bot. Respond PAYMENTS if you would like to enter payment info or TRANSACTION if you would like to start a new transaction', 'PAYMENTS,TRANSACTION'),
    (1, 'text', 'You selected PAYMENTS. You can respond HELP to get a help message or ABORT to exit the process at any time. Please enter the full name that appears on the card.', ''),
    (2, 'text', 'Enter the card number.', ''),
    (3, 'text', 'Enter the expiration date.', ''),
    (4, 'text', 'Enter the CVV.', ''),
    (5, 'text', 'Enter the zip code.', ''),
    (6, 'button', 'You selected TRANSACTION. Please select EXISTING for an existing transaction or NEW to start a new transaction.','EXISTING,NEW'),
    -- new transaction
    (7, 'text', 'You have started a new transaction. You can respond HELP to get a help message, SUMMARY to see a summary of the current transaction, or ABORT to exit the process at any time. Please enter the full name of the buyer.', ''),
    (8, 'text', 'Enter the full name of the seller of this transaction.', ''),
    (9, 'button', 'Are you the buyer or seller?', 'BUYER,SELLER'),
    -- Seller
    (10, 'text', 'Please enter the price of the transaction.', ''),
    (11, 'text', 'Please attach a PDF version of the item to be exchanged', ''),
    -- tell other person to message bot
    (12, 'dynamic', 'Please tell the other member of the transaction to message our page and select EXISTING transaction. Your transaction is [txid]', 'SELLER_SHARE'),
    (13, 'dynamic', 'Please tell the other member of the transaction to message our page and select EXISTING transaction. Your transaction is [txid]', 'BUYER_SHARE'),
    -- existing transaction
    (14, 'text', 'Please enter your transaction ID', ''),
    -- buyer incomplete state
    (15, 'dynamic', 'View a PDF version of the item you agreed to exchange with the seller here.', 'ITEM_APPROVE'), 
    (16, 'text', 'Your transaction is now marked as disputed. It has now gone into arbitration. Type anything to continue.', ''),
    -- seller incomplete state
    (17, 'text', 'Please attach a PDF version of the item to be exchanged. Once your item is approved by the buyer, you will receive all payment. If there are any disputes, this transaction will go to arbitration.', ''),
    (18, 'text', 'What is the price of this transaction?', ''),
    -- ending messages
    (21, 'text', 'The buyer will now approve or deny the item you have sent. In the case of any issues, this transaction will be sent to arbitration. Otherwise, all payments will be released.', ''),
    (22, 'text', 'Your transaction is now complete. Thank you for using Escrow bot! Type anything to start a new transaction.', ''),
    (911, 'text', 'This bot helps you secure your marketplace transactions via an escrow model. The bot will tell you everything you need to know at each stage of the conversation. Type ABORT at any point to cancel your transaction.', ''), 
    (666, 'text', 'Your transaction was aborted. To restart the conversation, simply message the bot anything.', '');
    
    --editing
    --(15, 'text', 'The transaction is complete. Would you like to edit any information?', 'YES,NO'),
    --(12, 'button', 'The information for the transaction has now been stored. Would you like to edit any information?', 'YES,NO'),
    --(13, 'button', 'What would you like to edit about your transaction?', 'BUYER,SELLER,PRICE'),
    --(14, 'text', 'Enter a new buyer name', ''),
    --(15, 'text', 'Enter a new seller name', ''),
    --(16, 'text', 'Enter a new price', ''),
    
*/