-- =============================================
-- NovaEra Web Tables - Complete Setup
-- Run this on your Novaera database
-- DO NOT delete Account, Character, or other game tables!
-- =============================================

-- =============================================
-- 1. DAILY REWARDS SYSTEM
-- =============================================

-- Daily rewards tracking per user
IF OBJECT_ID('web_daily_rewards', 'U') IS NOT NULL DROP TABLE web_daily_rewards;
CREATE TABLE web_daily_rewards (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    LastClaim DATETIME DEFAULT GETDATE(),
    Streak INT DEFAULT 0,
    CONSTRAINT FK_DailyRewards_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId)
);

-- Daily reward prizes configuration
IF OBJECT_ID('web_daily_prizes', 'U') IS NOT NULL DROP TABLE web_daily_prizes;
CREATE TABLE web_daily_prizes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Day INT NOT NULL,
    Coins INT DEFAULT 0,
    ItemVNum INT NULL,
    ItemAmount INT DEFAULT 0,
    Special BIT DEFAULT 0
);

-- Insert default daily prizes (7 days)
INSERT INTO web_daily_prizes (Day, Coins, ItemVNum, ItemAmount, Special) VALUES
(1, 100, NULL, 0, 0),
(2, 150, NULL, 0, 0),
(3, 200, NULL, 0, 0),
(4, 300, NULL, 0, 0),
(5, 400, NULL, 0, 0),
(6, 500, NULL, 0, 0),
(7, 1000, NULL, 0, 1);

-- =============================================
-- 2. ROULETTE SYSTEM
-- =============================================

-- Roulette prizes configuration
IF OBJECT_ID('web_roulette_prizes', 'U') IS NOT NULL DROP TABLE web_roulette_prizes;
CREATE TABLE web_roulette_prizes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Coins INT DEFAULT 0,
    ItemVNum INT NULL,
    ItemAmount INT DEFAULT 0,
    Probability DECIMAL(5,2) DEFAULT 10.00,
    Color NVARCHAR(20) DEFAULT '#FFD700'
);

-- Insert default roulette prizes
INSERT INTO web_roulette_prizes (Name, Coins, ItemVNum, ItemAmount, Probability, Color) VALUES
('100 Coins', 100, NULL, 0, 25.00, '#4CAF50'),
('250 Coins', 250, NULL, 0, 20.00, '#2196F3'),
('500 Coins', 500, NULL, 0, 15.00, '#9C27B0'),
('1000 Coins', 1000, NULL, 0, 10.00, '#FF9800'),
('2500 Coins', 2500, NULL, 0, 5.00, '#F44336'),
('5000 Coins', 5000, NULL, 0, 2.00, '#FFD700'),
('Try Again', 0, NULL, 0, 15.00, '#607D8B'),
('50 Coins', 50, NULL, 0, 8.00, '#795548');

-- Roulette spins tracking
IF OBJECT_ID('web_roulette_spins', 'U') IS NOT NULL DROP TABLE web_roulette_spins;
CREATE TABLE web_roulette_spins (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    LastSpin DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_RouletteSpins_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId)
);

-- =============================================
-- 3. COUPON SYSTEM
-- =============================================

-- Coupons configuration
IF OBJECT_ID('web_coupons', 'U') IS NOT NULL DROP TABLE web_coupons;
CREATE TABLE web_coupons (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    Coins INT DEFAULT 0,
    ItemVNum INT NULL,
    ItemAmount INT DEFAULT 0,
    MaxUses INT DEFAULT 1,
    CurrentUses INT DEFAULT 0,
    ExpiresAt DATETIME NULL,
    Active BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Coupon redemption tracking
IF OBJECT_ID('web_coupon_redemptions', 'U') IS NOT NULL DROP TABLE web_coupon_redemptions;
CREATE TABLE web_coupon_redemptions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CouponId INT NOT NULL,
    AccountId BIGINT NOT NULL,
    RedeemedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_CouponRedemptions_Coupon FOREIGN KEY (CouponId) REFERENCES web_coupons(Id),
    CONSTRAINT FK_CouponRedemptions_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId)
);

-- =============================================
-- 4. SUPPORT TICKETS SYSTEM
-- =============================================

-- Support tickets
IF OBJECT_ID('web_ticket_replies', 'U') IS NOT NULL DROP TABLE web_ticket_replies;
IF OBJECT_ID('web_tickets', 'U') IS NOT NULL DROP TABLE web_tickets;

CREATE TABLE web_tickets (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    Subject NVARCHAR(200) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    Category NVARCHAR(50) DEFAULT 'general',
    Status NVARCHAR(20) DEFAULT 'open',
    Priority NVARCHAR(20) DEFAULT 'normal',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Tickets_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId)
);

-- Ticket replies
CREATE TABLE web_ticket_replies (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TicketId INT NOT NULL,
    AccountId BIGINT NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    IsAdmin BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_TicketReplies_Ticket FOREIGN KEY (TicketId) REFERENCES web_tickets(Id),
    CONSTRAINT FK_TicketReplies_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId)
);

-- =============================================
-- 5. SHOP SYSTEM
-- =============================================

-- Shop categories
IF OBJECT_ID('web_shop_items', 'U') IS NOT NULL DROP TABLE web_shop_items;
IF OBJECT_ID('web_shop_categories', 'U') IS NOT NULL DROP TABLE web_shop_categories;

CREATE TABLE web_shop_categories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    Icon NVARCHAR(50) DEFAULT 'Package',
    SortOrder INT DEFAULT 0,
    Active BIT DEFAULT 1
);

-- Shop items
CREATE TABLE web_shop_items (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CategoryId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    ItemVNum INT NOT NULL,
    Amount INT DEFAULT 1,
    Price INT NOT NULL,
    OriginalPrice INT NULL,
    Featured BIT DEFAULT 0,
    Active BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_ShopItems_Category FOREIGN KEY (CategoryId) REFERENCES web_shop_categories(Id)
);

-- Insert default shop categories
INSERT INTO web_shop_categories (Name, Description, Icon, SortOrder) VALUES
('Wings', 'Alas y accesorios de vuelo', 'Sparkles', 1),
('Mounts', 'Monturas y vehículos', 'Horse', 2),
('Costumes', 'Trajes y disfraces', 'Shirt', 3),
('Consumables', 'Items consumibles', 'Flask', 4),
('Special', 'Items especiales', 'Star', 5);

-- Shop purchase history
IF OBJECT_ID('web_shop_purchases', 'U') IS NOT NULL DROP TABLE web_shop_purchases;
CREATE TABLE web_shop_purchases (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    ItemId INT NOT NULL,
    CharacterName NVARCHAR(100) NOT NULL,
    Amount INT DEFAULT 1,
    TotalPrice INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'pending',
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_ShopPurchases_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId),
    CONSTRAINT FK_ShopPurchases_Item FOREIGN KEY (ItemId) REFERENCES web_shop_items(Id)
);

-- =============================================
-- 6. DONATIONS / PAYMENTS
-- =============================================

-- Coin packages for purchase
IF OBJECT_ID('web_coin_packages', 'U') IS NOT NULL DROP TABLE web_coin_packages;
CREATE TABLE web_coin_packages (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Coins INT NOT NULL,
    BonusCoins INT DEFAULT 0,
    Price DECIMAL(10,2) NOT NULL,
    Currency NVARCHAR(3) DEFAULT 'EUR',
    Featured BIT DEFAULT 0,
    Active BIT DEFAULT 1,
    SortOrder INT DEFAULT 0
);

-- Insert default coin packages
INSERT INTO web_coin_packages (Name, Coins, BonusCoins, Price, Featured, SortOrder) VALUES
('Starter', 1000, 0, 1.00, 0, 1),
('Basic', 5000, 500, 5.00, 0, 2),
('Popular', 10000, 2000, 10.00, 1, 3),
('Premium', 25000, 7500, 20.00, 0, 4),
('Ultimate', 50000, 20000, 35.00, 0, 5);

-- Donation/payment records
IF OBJECT_ID('web_donations', 'U') IS NOT NULL DROP TABLE web_donations;
CREATE TABLE web_donations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    PackageId INT NULL,
    TransactionId NVARCHAR(100) NULL,
    PaymentMethod NVARCHAR(50) DEFAULT 'paypal',
    Amount DECIMAL(10,2) NOT NULL,
    Currency NVARCHAR(3) DEFAULT 'EUR',
    Coins INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'pending',
    PayerEmail NVARCHAR(200) NULL,
    CustomId NVARCHAR(100) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CompletedAt DATETIME NULL,
    CONSTRAINT FK_Donations_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId)
);

-- =============================================
-- 7. ADMIN / MODERATION
-- =============================================

-- Admin coin transactions log
IF OBJECT_ID('web_coin_transactions', 'U') IS NOT NULL DROP TABLE web_coin_transactions;
CREATE TABLE web_coin_transactions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    AdminId BIGINT NOT NULL,
    Amount INT NOT NULL,
    Type NVARCHAR(20) NOT NULL,
    Reason NVARCHAR(500) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_CoinTransactions_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId),
    CONSTRAINT FK_CoinTransactions_Admin FOREIGN KEY (AdminId) REFERENCES Account(AccountId)
);

-- Moderation actions log
IF OBJECT_ID('web_mod_actions', 'U') IS NOT NULL DROP TABLE web_mod_actions;
CREATE TABLE web_mod_actions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AdminId BIGINT NOT NULL,
    TargetAccountId BIGINT NULL,
    Action NVARCHAR(50) NOT NULL,
    Reason NVARCHAR(500) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_ModActions_Admin FOREIGN KEY (AdminId) REFERENCES Account(AccountId)
);

-- Announcements
IF OBJECT_ID('web_announcements', 'U') IS NOT NULL DROP TABLE web_announcements;
CREATE TABLE web_announcements (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    Type NVARCHAR(20) DEFAULT 'info',
    Priority NVARCHAR(20) DEFAULT 'normal',
    AuthorId BIGINT NOT NULL,
    Active BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NULL,
    CONSTRAINT FK_Announcements_Author FOREIGN KEY (AuthorId) REFERENCES Account(AccountId)
);

-- =============================================
-- 8. CHARACTER UNBUG TRACKING
-- =============================================

IF OBJECT_ID('web_unbug_logs', 'U') IS NOT NULL DROP TABLE web_unbug_logs;
CREATE TABLE web_unbug_logs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    CharacterId BIGINT NOT NULL,
    CharacterName NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_UnbugLogs_Account FOREIGN KEY (AccountId) REFERENCES Account(AccountId)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IX_DailyRewards_AccountId ON web_daily_rewards(AccountId);
CREATE INDEX IX_RouletteSpins_AccountId ON web_roulette_spins(AccountId);
CREATE INDEX IX_Coupons_Code ON web_coupons(Code);
CREATE INDEX IX_CouponRedemptions_AccountId ON web_coupon_redemptions(AccountId);
CREATE INDEX IX_Tickets_AccountId ON web_tickets(AccountId);
CREATE INDEX IX_Tickets_Status ON web_tickets(Status);
CREATE INDEX IX_ShopPurchases_AccountId ON web_shop_purchases(AccountId);
CREATE INDEX IX_Donations_AccountId ON web_donations(AccountId);
CREATE INDEX IX_Donations_CustomId ON web_donations(CustomId);
CREATE INDEX IX_Donations_Status ON web_donations(Status);

PRINT 'All web tables created successfully!';
