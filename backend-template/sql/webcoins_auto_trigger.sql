-- ============================================
-- WebCoins Auto-Claim Trigger
-- ============================================
-- This trigger automatically transfers WebCoins to Coins
-- whenever the Game Server updates the Account table.
-- 
-- NO GAME SERVER CODE CHANGES REQUIRED!
-- 
-- How it works:
-- 1. Web adds coins to WebCoins column
-- 2. Game Server saves player (updates Coins)
-- 3. Trigger fires, adds WebCoins to Coins, resets WebCoins to 0
-- ============================================

-- Step 1: Add WebCoins column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'Account') AND name = 'WebCoins'
)
BEGIN
    ALTER TABLE Account ADD WebCoins INT NOT NULL DEFAULT 0;
    PRINT 'WebCoins column added to Account table';
END
GO

-- Step 2: Drop existing trigger if exists
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Account_ClaimWebCoins')
    DROP TRIGGER TR_Account_ClaimWebCoins;
GO

-- Step 3: Create the auto-claim trigger
CREATE TRIGGER TR_Account_ClaimWebCoins
ON Account
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only process if Coins column was updated (game server saving)
    IF NOT UPDATE(Coins)
        RETURN;
    
    -- Don't process if WebCoins was also updated (web operation, not game)
    IF UPDATE(WebCoins)
        RETURN;
    
    -- For each updated account with pending WebCoins, transfer them
    UPDATE a
    SET 
        a.Coins = a.Coins + a.WebCoins,
        a.WebCoins = 0
    FROM Account a
    INNER JOIN inserted i ON a.AccountId = i.AccountId
    WHERE a.WebCoins > 0;
    
END
GO

PRINT 'Trigger TR_Account_ClaimWebCoins created successfully';
PRINT '';
PRINT '============================================';
PRINT 'SETUP COMPLETE!';
PRINT '';
PRINT 'How it works:';
PRINT '1. Web adds coins to WebCoins column';
PRINT '2. Player logs in or game saves';
PRINT '3. Trigger automatically transfers WebCoins to Coins';
PRINT '';
PRINT 'NO GAME SERVER CODE CHANGES NEEDED!';
PRINT '============================================';

-- ============================================
-- Test the trigger
-- ============================================
-- 1. Add 500 web coins to test account:
--    UPDATE Account SET WebCoins = 500 WHERE AccountId = 1;
--
-- 2. Simulate game server save (update Coins):
--    UPDATE Account SET Coins = Coins WHERE AccountId = 1;
--
-- 3. Check result - WebCoins should be 0, Coins increased by 500:
--    SELECT AccountId, Coins, WebCoins FROM Account WHERE AccountId = 1;
