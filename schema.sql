CREATE TABLE transactions (
       txid INTEGER PRIMARY KEY AUTOINCREMENT, 
       buyer VARCHAR(32), 
       seller VARCHAR(32), 
       price INTEGER,
       itemLink TEXT
);
CREATE TABLE conversationStates (
	      txid INTEGER PRIMARY KEY AUTOINCREMENT, 
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
