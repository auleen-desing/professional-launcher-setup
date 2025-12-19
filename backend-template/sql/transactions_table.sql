-- Transactions history table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_transactions' AND xtype='U')
BEGIN
    CREATE TABLE web_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        account_id BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'purchase', 'gift_sent', 'gift_received', 'coupon', 'daily_reward', 'roulette', 'shop_purchase', 'admin_add', 'admin_remove'
        amount INT NOT NULL, -- positive for received, negative for spent
        description NVARCHAR(255),
        reference_id VARCHAR(100), -- PayPal ID, coupon code, item name, etc.
        target_account_id BIGINT NULL, -- for gifts: recipient or sender
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (account_id) REFERENCES Account(AccountId)
    );
    
    CREATE INDEX IX_transactions_account ON web_transactions(account_id);
    CREATE INDEX IX_transactions_type ON web_transactions(type);
    CREATE INDEX IX_transactions_date ON web_transactions(created_at DESC);
END
GO
