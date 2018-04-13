CREATE TABLE transactions (
       txid VARCHAR(128) PRIMARY KEY, 
       buyer VARCHAR(32), 
       seller VARCHAR(32), 
       buyer_agreed INTEGER DEFAULT 0,
       seller_agreed INTEGER DEFAULT 0,
       asked_seller INTEGER DEFAULT 0,
       price REAL DEFAULT 0,
       itemLink TEXT,
       groupId INTEGER, 
       itemDescription TEXT
);
CREATE TABLE conversationStates (
	      txid INTEGER, 
        state INTEGER, 
        user VARCHAR(32)
);
CREATE TABLE messages (
        state INTEGER PRIMARY KEY,
        messageType VARCHAR(32), 
        message VARCHAR(512),
        options VARCHAR(512)
);
CREATE TABLE flowStates (
	      state INTEGER, 
        keyword VARCHAR(32),
        valueAction VARCHAR(32),
        nextstate INTEGER,
        PRIMARY KEY (state, keyword)
);
CREATE TABLE users (
        psid INTEGER PRIMARY KEY,
        first VARCHAR(128),
        last VARCHAR(128),
        stripe_id INTEGER,
        auth_token INTEGER
);
