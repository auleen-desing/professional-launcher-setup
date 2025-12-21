-- ============================================
-- WebCoins System - Separate Web Coins Column
-- ============================================
-- This adds a separate WebCoins column to Account that the game NEVER touches.
-- The web writes to WebCoins, the game reads and uses Coins.
-- 
-- When a player logs into the game, the Game Server should:
-- 1. Read WebCoins
-- 2. Add WebCoins to Coins
-- 3. Set WebCoins = 0
--
-- This prevents any race conditions or overwrites.
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
ELSE
BEGIN
    PRINT 'WebCoins column already exists';
END
GO

-- Step 2: Create index for faster queries
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE object_id = OBJECT_ID(N'Account') AND name = 'IX_Account_WebCoins'
)
BEGIN
    CREATE INDEX IX_Account_WebCoins ON Account(WebCoins) WHERE WebCoins > 0;
    PRINT 'Index IX_Account_WebCoins created';
END
GO

-- ============================================
-- Stored Procedure: SP_ClaimWebCoins
-- The Game Server calls this on player login
-- ============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_ClaimWebCoins')
    DROP PROCEDURE SP_ClaimWebCoins;
GO

CREATE PROCEDURE SP_ClaimWebCoins
    @AccountId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @WebCoins INT;
    
    -- Get current web coins
    SELECT @WebCoins = ISNULL(WebCoins, 0)
    FROM Account 
    WHERE AccountId = @AccountId;
    
    -- If there are web coins to claim
    IF @WebCoins > 0
    BEGIN
        -- Transfer to Coins and reset WebCoins
        UPDATE Account 
        SET Coins = ISNULL(Coins, 0) + @WebCoins,
            WebCoins = 0
        WHERE AccountId = @AccountId;
        
        -- Return the claimed amount
        SELECT @WebCoins AS ClaimedCoins, 1 AS Success;
    END
    ELSE
    BEGIN
        SELECT 0 AS ClaimedCoins, 1 AS Success;
    END
END
GO

PRINT 'SP_ClaimWebCoins procedure created';

-- ============================================
-- View: vw_account_all_coins
-- Shows combined coins (for display purposes)
-- ============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_account_all_coins')
    DROP VIEW vw_account_all_coins;
GO

CREATE VIEW vw_account_all_coins AS
SELECT 
    AccountId,
    Name,
    Coins AS GameCoins,
    WebCoins,
    (ISNULL(Coins, 0) + ISNULL(WebCoins, 0)) AS TotalCoins
FROM Account;
GO

PRINT 'vw_account_all_coins view created';

-- ============================================
-- C# Game Server Integration Code
-- ============================================
/*
Add this to your Game Server login handler (e.g., in CharacterSession or LoginHandler):

// After successful login, claim web coins
private void ClaimWebCoins(long accountId)
{
    try
    {
        using (var connection = new SqlConnection(connectionString))
        {
            connection.Open();
            using (var command = new SqlCommand("SP_ClaimWebCoins", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@AccountId", accountId);
                
                using (var reader = command.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        int claimedCoins = reader.GetInt32(0);
                        if (claimedCoins > 0)
                        {
                            // Add to character's in-memory coin balance
                            Session.Account.Coins += claimedCoins;
                            
                            Logger.Info($"[WebCoins] Account {accountId} claimed {claimedCoins} web coins");
                            
                            // Optionally notify the player
                            Session.SendPacket($"say 1 {Session.Character.CharacterId} 10 You received {claimedCoins} coins from web purchases!");
                        }
                    }
                }
            }
        }
    }
    catch (Exception ex)
    {
        Logger.Error($"[WebCoins] Error claiming web coins for account {accountId}: {ex.Message}");
    }
}

// Call this method after successful login:
// ClaimWebCoins(Session.Account.AccountId);
*/

-- ============================================
-- Test Queries
-- ============================================
-- Add 1000 web coins to account 1 (for testing):
-- UPDATE Account SET WebCoins = 1000 WHERE AccountId = 1;

-- Check account balances:
-- SELECT * FROM vw_account_all_coins WHERE WebCoins > 0;

-- Manually claim web coins:
-- EXEC SP_ClaimWebCoins @AccountId = 1;
