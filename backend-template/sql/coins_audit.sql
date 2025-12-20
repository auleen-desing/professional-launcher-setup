-- =============================================
-- COINS AUDIT SYSTEM FOR NAVICAT
-- This script creates an audit table and trigger
-- to track ALL coin modifications
-- =============================================

-- 1. Create audit table to log all coin changes
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='coins_audit_log' AND xtype='U')
BEGIN
    CREATE TABLE coins_audit_log (
        id INT IDENTITY(1,1) PRIMARY KEY,
        account_id BIGINT NOT NULL,
        account_name NVARCHAR(50),
        old_coins INT,
        new_coins INT,
        change_amount INT, -- positive = added, negative = removed
        change_source NVARCHAR(100), -- will try to identify source
        changed_at DATETIME DEFAULT GETDATE(),
        app_name NVARCHAR(128), -- application that made the change
        host_name NVARCHAR(128), -- computer/server that made the change
        login_name NVARCHAR(128) -- SQL login used
    );
    
    CREATE INDEX IX_coins_audit_account ON coins_audit_log(account_id);
    CREATE INDEX IX_coins_audit_date ON coins_audit_log(changed_at DESC);
    
    PRINT 'Created coins_audit_log table';
END
GO

-- 2. Create trigger to automatically log all coin changes
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Account_CoinsAudit')
    DROP TRIGGER TR_Account_CoinsAudit;
GO

CREATE TRIGGER TR_Account_CoinsAudit
ON Account
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only log if Coins column was changed
    IF UPDATE(Coins)
    BEGIN
        INSERT INTO coins_audit_log (
            account_id,
            account_name,
            old_coins,
            new_coins,
            change_amount,
            change_source,
            app_name,
            host_name,
            login_name
        )
        SELECT 
            i.AccountId,
            i.Name,
            d.Coins,
            i.Coins,
            i.Coins - d.Coins,
            CASE 
                WHEN APP_NAME() LIKE '%node%' OR APP_NAME() LIKE '%Node%' THEN 'Web API'
                WHEN APP_NAME() LIKE '%Management%' THEN 'SQL Management Studio'
                WHEN APP_NAME() LIKE '%Navicat%' THEN 'Navicat'
                WHEN APP_NAME() LIKE '%Game%' OR APP_NAME() LIKE '%Server%' THEN 'Game Server'
                ELSE APP_NAME()
            END,
            APP_NAME(),
            HOST_NAME(),
            SUSER_SNAME()
        FROM inserted i
        INNER JOIN deleted d ON i.AccountId = d.AccountId
        WHERE i.Coins <> d.Coins;
    END
END
GO

PRINT 'Created TR_Account_CoinsAudit trigger';
GO

-- =============================================
-- USEFUL QUERIES FOR INVESTIGATING COIN ISSUES
-- =============================================

-- View recent coin changes (last 24 hours)
-- SELECT * FROM coins_audit_log 
-- WHERE changed_at >= DATEADD(HOUR, -24, GETDATE())
-- ORDER BY changed_at DESC;

-- View coin changes for a specific user
-- SELECT * FROM coins_audit_log 
-- WHERE account_name = 'USERNAME_HERE'
-- ORDER BY changed_at DESC;

-- Find suspicious changes (large decreases)
-- SELECT * FROM coins_audit_log 
-- WHERE change_amount < -100
-- ORDER BY changed_at DESC;

-- Find changes by source
-- SELECT change_source, COUNT(*) as changes, SUM(change_amount) as total_change
-- FROM coins_audit_log
-- GROUP BY change_source;

-- Find users who lost coins
-- SELECT account_name, SUM(change_amount) as net_change
-- FROM coins_audit_log
-- WHERE changed_at >= DATEADD(DAY, -7, GETDATE())
-- GROUP BY account_name
-- HAVING SUM(change_amount) < 0
-- ORDER BY net_change ASC;

PRINT '';
PRINT '=============================================';
PRINT 'COINS AUDIT SYSTEM INSTALLED SUCCESSFULLY';
PRINT '=============================================';
PRINT 'Now all coin changes will be logged to coins_audit_log table.';
PRINT 'Use the queries above to investigate coin issues.';
PRINT '';
