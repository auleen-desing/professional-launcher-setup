-- Mass emails history table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_mass_emails' AND xtype='U')
BEGIN
    CREATE TABLE web_mass_emails (
        id INT IDENTITY(1,1) PRIMARY KEY,
        subject NVARCHAR(255) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        target_group VARCHAR(50) DEFAULT 'all',
        recipient_count INT DEFAULT 0,
        sent_by BIGINT NOT NULL,
        sent_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (sent_by) REFERENCES Account(AccountId)
    );
    
    CREATE INDEX IX_mass_emails_date ON web_mass_emails(sent_at DESC);
END
GO
