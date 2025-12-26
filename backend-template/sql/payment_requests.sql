-- Payment requests table for manual processing (Paysafecard, Bizum, etc.)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_payment_requests' AND xtype='U')
BEGIN
    CREATE TABLE web_payment_requests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        account_id BIGINT NOT NULL,
        payment_type VARCHAR(50) NOT NULL, -- 'paysafecard', 'bizum'
        code VARCHAR(100) NOT NULL, -- PIN code or transaction reference
        amount DECIMAL(10,2) NOT NULL, -- Amount in EUR
        coins_requested INT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
        admin_notes NVARCHAR(500) NULL,
        processed_by BIGINT NULL,
        processed_at DATETIME NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (account_id) REFERENCES Account(AccountId)
    );
    
    CREATE INDEX IX_payment_requests_account ON web_payment_requests(account_id);
    CREATE INDEX IX_payment_requests_status ON web_payment_requests(status);
    CREATE INDEX IX_payment_requests_date ON web_payment_requests(created_at DESC);
END
GO
