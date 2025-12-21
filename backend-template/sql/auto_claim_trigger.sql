-- =============================================
-- AUTO-CLAIM PENDING COINS TRIGGER
-- No requiere modificar el Game Server
-- =============================================
-- 
-- CÓMO FUNCIONA:
-- Cuando el Game Server guarda coins (UPDATE Account SET Coins = X),
-- este trigger automáticamente suma los coins pendientes al valor.
--
-- Ejemplo:
-- 1. Usuario tiene 400 coins, Game Server tiene 400 en memoria
-- 2. Web agrega 10000 coins pendientes
-- 3. Game Server hace: UPDATE Account SET Coins = 400
-- 4. Trigger intercepta y hace: Coins = 400 + 10000 = 10400
-- 5. Marca los 10000 como reclamados
-- =============================================

-- Primero asegúrate de que existe la tabla de pending coins
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_pending_coins' AND xtype='U')
BEGIN
    CREATE TABLE web_pending_coins (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AccountId BIGINT NOT NULL,
        Amount INT NOT NULL,
        Source NVARCHAR(50) NOT NULL,
        SourceDetail NVARCHAR(200) NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        ClaimedAt DATETIME NULL,
        ExpiresAt DATETIME NULL
    );
    CREATE INDEX IX_pending_coins_account ON web_pending_coins(AccountId, Status);
    PRINT 'Created web_pending_coins table';
END
GO

-- Eliminar trigger anterior si existe
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Account_AutoClaimPending')
    DROP TRIGGER TR_Account_AutoClaimPending;
GO

-- Crear el trigger de auto-claim
CREATE TRIGGER TR_Account_AutoClaimPending
ON Account
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Solo procesar si se actualizó la columna Coins
    IF NOT UPDATE(Coins)
        RETURN;
    
    -- Solo procesar actualizaciones del Game Server (.Net SqlClient)
    -- Esto evita que el trigger se ejecute cuando la Web ya sumó los coins
    IF APP_NAME() NOT LIKE '%SqlClient%' AND APP_NAME() NOT LIKE '%.Net%'
        RETURN;
    
    -- Para cada cuenta actualizada, verificar si hay coins pendientes
    DECLARE @AccountId BIGINT;
    DECLARE @PendingCoins INT;
    
    DECLARE pending_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT i.AccountId
        FROM inserted i
        INNER JOIN deleted d ON i.AccountId = d.AccountId
        WHERE i.Coins <> d.Coins; -- Solo si realmente cambió
    
    OPEN pending_cursor;
    FETCH NEXT FROM pending_cursor INTO @AccountId;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Obtener total de coins pendientes para esta cuenta
        SELECT @PendingCoins = ISNULL(SUM(Amount), 0)
        FROM web_pending_coins
        WHERE AccountId = @AccountId 
        AND Status = 'pending'
        AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE());
        
        IF @PendingCoins > 0
        BEGIN
            -- Sumar los coins pendientes
            UPDATE Account
            SET Coins = Coins + @PendingCoins
            WHERE AccountId = @AccountId;
            
            -- Marcar como reclamados
            UPDATE web_pending_coins
            SET Status = 'claimed', ClaimedAt = GETDATE()
            WHERE AccountId = @AccountId 
            AND Status = 'pending'
            AND (ExpiresAt IS NULL OR ExpiresAt > GETDATE());
            
            -- Log opcional
            PRINT 'Auto-claimed ' + CAST(@PendingCoins AS VARCHAR) + ' coins for account ' + CAST(@AccountId AS VARCHAR);
        END
        
        FETCH NEXT FROM pending_cursor INTO @AccountId;
    END
    
    CLOSE pending_cursor;
    DEALLOCATE pending_cursor;
END
GO

PRINT '';
PRINT '=============================================';
PRINT 'AUTO-CLAIM TRIGGER INSTALLED';
PRINT '=============================================';
PRINT '';
PRINT 'Ahora cuando el Game Server guarde coins,';
PRINT 'automaticamente se sumaran los pendientes.';
PRINT '';
PRINT 'NO necesitas modificar el Game Server!';
PRINT '';
GO
