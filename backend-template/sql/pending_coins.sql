-- =============================================
-- PENDING COINS SYSTEM FOR NOVAERA
-- This solves the issue where the Game Server
-- overwrites coins added by the Web API
-- =============================================

-- 1. Create pending coins table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_pending_coins' AND xtype='U')
BEGIN
    CREATE TABLE web_pending_coins (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AccountId BIGINT NOT NULL,
        Amount INT NOT NULL,
        Source NVARCHAR(50) NOT NULL, -- 'coupon', 'admin', 'donation', 'roulette', 'refund'
        SourceDetail NVARCHAR(200), -- coupon code, admin name, package id, etc.
        Status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'claimed', 'expired'
        CreatedAt DATETIME DEFAULT GETDATE(),
        ClaimedAt DATETIME NULL,
        ExpiresAt DATETIME NULL -- optional expiration
    );
    
    CREATE INDEX IX_pending_coins_account ON web_pending_coins(AccountId, Status);
    CREATE INDEX IX_pending_coins_status ON web_pending_coins(Status, CreatedAt);
    
    PRINT 'Created web_pending_coins table';
END
GO

-- 2. Stored procedure for the Game Server to claim pending coins
-- The Game Server should call this when a player logs in or periodically
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_ClaimPendingCoins')
    DROP PROCEDURE SP_ClaimPendingCoins;
GO

CREATE PROCEDURE SP_ClaimPendingCoins
    @AccountId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalCoins INT = 0;
    DECLARE @ClaimedCount INT = 0;
    
    -- Calculate total pending coins for this account
    SELECT @TotalCoins = ISNULL(SUM(Amount), 0), @ClaimedCount = COUNT(*)
    FROM web_pending_coins
    WHERE AccountId = @AccountId 
    AND Status = 'pending'
    AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE());
    
    IF @TotalCoins > 0
    BEGIN
        -- Start transaction
        BEGIN TRANSACTION;
        
        BEGIN TRY
            -- Add coins to account
            UPDATE Account 
            SET Coins = ISNULL(Coins, 0) + @TotalCoins 
            WHERE AccountId = @AccountId;
            
            -- Mark all pending as claimed
            UPDATE web_pending_coins
            SET Status = 'claimed', ClaimedAt = GETDATE()
            WHERE AccountId = @AccountId 
            AND Status = 'pending'
            AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE());
            
            COMMIT TRANSACTION;
            
            -- Return result
            SELECT @TotalCoins as CoinsAdded, @ClaimedCount as ItemsClaimed, 'success' as Result;
        END TRY
        BEGIN CATCH
            ROLLBACK TRANSACTION;
            SELECT 0 as CoinsAdded, 0 as ItemsClaimed, ERROR_MESSAGE() as Result;
        END CATCH
    END
    ELSE
    BEGIN
        SELECT 0 as CoinsAdded, 0 as ItemsClaimed, 'no_pending' as Result;
    END
END
GO

PRINT 'Created SP_ClaimPendingCoins procedure';
GO

-- 3. Stored procedure to get pending coins count (for displaying in web/game)
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_GetPendingCoins')
    DROP PROCEDURE SP_GetPendingCoins;
GO

CREATE PROCEDURE SP_GetPendingCoins
    @AccountId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ISNULL(SUM(Amount), 0) as TotalPending,
        COUNT(*) as PendingCount
    FROM web_pending_coins
    WHERE AccountId = @AccountId 
    AND Status = 'pending'
    AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE());
END
GO

PRINT 'Created SP_GetPendingCoins procedure';
GO

-- 4. View to easily see all pending coins
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_pending_coins_summary')
    DROP VIEW vw_pending_coins_summary;
GO

CREATE VIEW vw_pending_coins_summary AS
SELECT 
    pc.AccountId,
    a.Name as AccountName,
    SUM(pc.Amount) as TotalPending,
    COUNT(*) as PendingCount,
    MIN(pc.CreatedAt) as OldestPending,
    MAX(pc.CreatedAt) as NewestPending
FROM web_pending_coins pc
INNER JOIN Account a ON pc.AccountId = a.AccountId
WHERE pc.Status = 'pending'
AND (pc.ExpiresAt IS NULL OR pc.ExpiresAt > GETDATE())
GROUP BY pc.AccountId, a.Name;
GO

PRINT 'Created vw_pending_coins_summary view';
GO

-- =============================================
-- USEFUL QUERIES
-- =============================================

-- View all pending coins
-- SELECT * FROM web_pending_coins WHERE Status = 'pending' ORDER BY CreatedAt DESC;

-- View pending coins summary by user
-- SELECT * FROM vw_pending_coins_summary ORDER BY TotalPending DESC;

-- Manually claim coins for a user (testing)
-- EXEC SP_ClaimPendingCoins @AccountId = 123;

-- Check pending for specific user
-- EXEC SP_GetPendingCoins @AccountId = 123;

-- View recent claimed coins
-- SELECT * FROM web_pending_coins WHERE Status = 'claimed' ORDER BY ClaimedAt DESC;

PRINT '';
PRINT '=============================================';
PRINT 'PENDING COINS SYSTEM INSTALLED SUCCESSFULLY';
PRINT '=============================================';
PRINT '';
PRINT 'IMPORTANT: You need to modify your Game Server to:';
PRINT '1. Call SP_ClaimPendingCoins when player logs in';
PRINT '2. Or call it periodically while player is online';
PRINT '';
PRINT 'Example C# code for Game Server:';
PRINT '  using (var cmd = new SqlCommand("SP_ClaimPendingCoins", conn))';
PRINT '  {';
PRINT '      cmd.CommandType = CommandType.StoredProcedure;';
PRINT '      cmd.Parameters.AddWithValue("@AccountId", accountId);';
PRINT '      var result = cmd.ExecuteScalar();';
PRINT '  }';
PRINT '';
