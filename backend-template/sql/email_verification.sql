-- =============================================
-- Email Verification Tables
-- Run this on your Novaera database
-- =============================================

-- Email verification tokens
IF OBJECT_ID('web_email_verifications', 'U') IS NOT NULL DROP TABLE web_email_verifications;
CREATE TABLE web_email_verifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    Token NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL,
    VerifiedAt DATETIME NULL,
    CONSTRAINT FK_EmailVerifications_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId)
);

-- Add EmailVerified column to Account if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Account') AND name = 'EmailVerified')
BEGIN
    ALTER TABLE Account ADD EmailVerified BIT DEFAULT 0;
END

-- Index for quick token lookups
CREATE INDEX IX_EmailVerifications_Token ON web_email_verifications(Token);
CREATE INDEX IX_EmailVerifications_AccountId ON web_email_verifications(AccountId);

PRINT 'Email verification tables created successfully!';
