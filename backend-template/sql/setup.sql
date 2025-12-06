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

-- Daily Reward Prizes Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_daily_prizes' AND xtype='U')
CREATE TABLE web_daily_prizes (
    Id INT PRIMARY KEY IDENTITY,
    Day INT NOT NULL,
    Coins INT NOT NULL DEFAULT 0,
    ItemVNum INT,
    ItemAmount INT DEFAULT 1,
    Special BIT DEFAULT 0
);

-- Insert default daily prizes
IF NOT EXISTS (SELECT * FROM web_daily_prizes)
BEGIN
    INSERT INTO web_daily_prizes (Day, Coins, ItemVNum, ItemAmount, Special) VALUES
    (1, 100, NULL, 0, 0),
    (2, 150, NULL, 0, 0),
    (3, 200, NULL, 0, 0),
    (4, 300, NULL, 0, 0),
    (5, 400, NULL, 0, 0),
    (6, 500, NULL, 0, 0),
    (7, 1000, 4099, 1, 1);
END

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

-- Roulette Prizes Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_roulette_prizes' AND xtype='U')
CREATE TABLE web_roulette_prizes (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(100) NOT NULL,
    Type VARCHAR(20) NOT NULL, -- 'coins' or 'item'
    Value INT NOT NULL,
    Chance DECIMAL(5,2) NOT NULL
);

-- Insert default roulette prizes
IF NOT EXISTS (SELECT * FROM web_roulette_prizes)
BEGIN
    INSERT INTO web_roulette_prizes (Name, Type, Value, Chance) VALUES
    ('500 Coins', 'coins', 500, 25),
    ('1000 Coins', 'coins', 1000, 20),
    ('2500 Coins', 'coins', 2500, 15),
    ('5000 Coins', 'coins', 5000, 10),
    ('SP Card Box', 'item', 4099, 10),
    ('Wings Box', 'item', 5000, 5),
    ('10000 Coins', 'coins', 10000, 5),
    ('Jackpot!', 'coins', 50000, 1),
    ('Try Again', 'coins', 100, 9);
END

-- Donations Table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_donations' AND xtype='U')
CREATE TABLE web_donations (
    Id INT PRIMARY KEY IDENTITY,
    AccountId INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Coins INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'pending',
    TransactionId VARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    CompletedAt DATETIME
);

-- Coin Transactions Table (Admin)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_coin_transactions' AND xtype='U')
CREATE TABLE web_coin_transactions (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL,
    AdminId INT NOT NULL,
    Amount INT NOT NULL,
    Type VARCHAR(10) NOT NULL, -- 'add' or 'remove'
    Reason NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Mod Actions Table (Admin)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_mod_actions' AND xtype='U')
CREATE TABLE web_mod_actions (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL,
    AdminId INT NOT NULL,
    Action VARCHAR(20) NOT NULL, -- 'ban', 'unban', 'suspend', 'warn', 'mute'
    Reason NVARCHAR(255),
    Duration VARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Announcements Table (Admin)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_announcements' AND xtype='U')
CREATE TABLE web_announcements (
    Id INT PRIMARY KEY IDENTITY,
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    Type VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'event', 'maintenance', 'update'
    Priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high'
    Active BIT DEFAULT 1,
    ExpiresAt DATETIME,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Author NVARCHAR(100)
);

-- Add Coins column to account table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'account') AND name = 'Coins')
BEGIN
    ALTER TABLE account ADD Coins INT DEFAULT 0;
END

-- Add RegistrationDate column to account table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'account') AND name = 'RegistrationDate')
BEGIN
    ALTER TABLE account ADD RegistrationDate DATETIME DEFAULT GETDATE();
END

-- =============================================
-- Sample Data (Optional)
-- =============================================

-- Sample Shop Items
IF NOT EXISTS (SELECT * FROM web_shop_items)
BEGIN
    INSERT INTO web_shop_items (ItemVNum, Name, Description, Price, Category, IsActive) VALUES
    (1012, 'Wings of Death', 'Legendary wings that grant increased movement speed', 5000, 'wings', 1),
    (4099, 'SP Card Box', 'Contains a random SP card', 2500, 'sp', 1),
    (1030, 'Rare Pet Bead', 'Used to upgrade your pet', 3000, 'pets', 1),
    (5000, 'Golden Costume Box', 'Contains a random golden costume', 7500, 'costumes', 1),
    (2000, 'Full Potion Bundle', '100x HP and MP potions', 500, 'consumables', 1);
END

-- Sample Coupon
IF NOT EXISTS (SELECT * FROM web_coupons)
BEGIN
    INSERT INTO web_coupons (Code, Coins, MaxUses, IsActive) VALUES
    ('WELCOME2024', 500, 1000, 1),
    ('NOVAERA', 1000, 500, 1);
END

PRINT 'NovaEra Web Backend tables created successfully!';
