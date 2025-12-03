-- =============================================
-- NovaEra Web Backend - SQL Setup Script
-- Run this script on your NosTale database
-- =============================================

-- Shop Items Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_shop_items' AND xtype='U')
CREATE TABLE web_shop_items (
    Id INT PRIMARY KEY IDENTITY,
    ItemVNum INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    Price INT NOT NULL,
    Category VARCHAR(50),
    Stock INT DEFAULT -1,
    ImageUrl VARCHAR(255),
    IsActive BIT DEFAULT 1
);

-- Shop Logs Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_shop_logs' AND xtype='U')
CREATE TABLE web_shop_logs (
    Id INT PRIMARY KEY IDENTITY,
    AccountId INT NOT NULL,
    ItemId INT NOT NULL,
    CharacterId INT NOT NULL,
    Price INT NOT NULL,
    Date DATETIME DEFAULT GETDATE()
);

-- Tickets Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_tickets' AND xtype='U')
CREATE TABLE web_tickets (
    Id INT PRIMARY KEY IDENTITY,
    AccountId INT NOT NULL,
    Subject NVARCHAR(200) NOT NULL,
    Category VARCHAR(50),
    Status VARCHAR(20) DEFAULT 'open',
    Message NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME
);

-- Ticket Replies Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_ticket_replies' AND xtype='U')
CREATE TABLE web_ticket_replies (
    Id INT PRIMARY KEY IDENTITY,
    TicketId INT NOT NULL,
    AccountId INT NOT NULL,
    Message NVARCHAR(MAX),
    IsStaff BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Daily Rewards Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_daily_rewards' AND xtype='U')
CREATE TABLE web_daily_rewards (
    AccountId INT PRIMARY KEY,
    LastClaim DATETIME,
    Streak INT DEFAULT 0
);

-- Coupons Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_coupons' AND xtype='U')
CREATE TABLE web_coupons (
    Id INT PRIMARY KEY IDENTITY,
    Code VARCHAR(50) UNIQUE NOT NULL,
    Coins INT NOT NULL,
    MaxUses INT,
    Uses INT DEFAULT 0,
    ExpiresAt DATETIME,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Coupon Uses Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_coupon_uses' AND xtype='U')
CREATE TABLE web_coupon_uses (
    Id INT PRIMARY KEY IDENTITY,
    AccountId INT NOT NULL,
    CouponId INT NOT NULL,
    UsedAt DATETIME DEFAULT GETDATE()
);

-- Add Coins column to account table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'account') AND name = 'Coins')
BEGIN
    ALTER TABLE account ADD Coins INT DEFAULT 0;
END

-- =============================================
-- Sample Data (Optional)
-- =============================================

-- Sample Shop Items
INSERT INTO web_shop_items (ItemVNum, Name, Description, Price, Category, IsActive) VALUES
(1012, 'Wings of Death', 'Legendary wings that grant increased movement speed', 5000, 'wings', 1),
(4099, 'SP Card Box', 'Contains a random SP card', 2500, 'sp', 1),
(1030, 'Rare Pet Bead', 'Used to upgrade your pet', 3000, 'pets', 1),
(5000, 'Golden Costume Box', 'Contains a random golden costume', 7500, 'costumes', 1),
(2000, 'Full Potion Bundle', '100x HP and MP potions', 500, 'consumables', 1);

-- Sample Coupon
INSERT INTO web_coupons (Code, Coins, MaxUses, IsActive) VALUES
('WELCOME2024', 500, 1000, 1),
('NOVAERA', 1000, 500, 1);

PRINT 'NovaEra Web Backend tables created successfully!';
