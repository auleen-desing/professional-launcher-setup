-- =============================================
-- Password Reset Table
-- Run this on your Novaera database
-- =============================================

-- Password reset tokens
IF OBJECT_ID('web_password_resets', 'U') IS NOT NULL DROP TABLE web_password_resets;
CREATE TABLE web_password_resets (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    Token NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL,
    UsedAt DATETIME NULL,
    CONSTRAINT FK_PasswordResets_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId)
);

-- Index for quick token lookups
CREATE INDEX IX_PasswordResets_Token ON web_password_resets(Token);
CREATE INDEX IX_PasswordResets_AccountId ON web_password_resets(AccountId);

PRINT 'Password reset table created successfully!';
