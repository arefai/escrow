CREATE TABLE transactions (
        txid VARCHAR(128) PRIMARY KEY, 
        buyer VARCHAR(32), 
        seller VARCHAR(32), 
        buyer_agreed INTEGER DEFAULT 0,
        seller_agreed INTEGER DEFAULT 0,
        buyer_paid INTEGER DEFAULT 0,
        buyer_charge_id VARCHAR(128),
        seller_paid INTEGER DEFAULT 0,
        seller_charge_id VARCHAR(128),
        asked_seller INTEGER DEFAULT 0,
        status VARCHAR(24),
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
        psid VARCHAR(128) PRIMARY KEY,
        first_name VARCHAR(128),
        last_name VARCHAR(128),
        stripe_id INTEGER
);
