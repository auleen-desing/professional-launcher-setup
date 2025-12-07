-- Shop Categories Table
IF OBJECT_ID('web_item_shop_categories', 'U') IS NULL
BEGIN
    CREATE TABLE web_item_shop_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        master_category INT NULL,
        CONSTRAINT FK_Categories_Parent FOREIGN KEY (master_category) REFERENCES web_item_shop_categories(id)
    );
    
    -- Insert default categories
    INSERT INTO web_item_shop_categories (name, master_category) VALUES 
    ('Weapons', NULL),
    ('Armor', NULL),
    ('Accessories', NULL),
    ('Mounts', NULL),
    ('Costumes', NULL),
    ('Consumables', NULL),
    ('Special', NULL);
END
GO

-- Shop Items Table
IF OBJECT_ID('web_item_shop_items', 'U') IS NULL
BEGIN
    CREATE TABLE web_item_shop_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        vnum INT NOT NULL,
        amount INT DEFAULT 1,
        price INT NOT NULL,
        description NVARCHAR(500) NULL,
        unique_purchase BIT DEFAULT 0,
        show_in_home BIT DEFAULT 0,
        upgrade TINYINT DEFAULT 0,
        rarity TINYINT DEFAULT 0,
        category_id INT NULL,
        speed TINYINT NULL,
        level TINYINT NULL,
        CONSTRAINT FK_Items_Category FOREIGN KEY (category_id) REFERENCES web_item_shop_categories(id)
    );
    
    CREATE INDEX IX_ShopItems_Category ON web_item_shop_items(category_id);
    CREATE INDEX IX_ShopItems_VNum ON web_item_shop_items(vnum);
END
GO

-- Coin Prices Table (for PayPal packages)
IF OBJECT_ID('web_item_shop_coin_prices', 'U') IS NULL
BEGIN
    CREATE TABLE web_item_shop_coin_prices (
        id INT IDENTITY(1,1) PRIMARY KEY,
        coins INT NOT NULL,
        payment_method NVARCHAR(50) DEFAULT 'paypal',
        price DECIMAL(10,2) NOT NULL
    );
    
    -- Insert default coin packages
    INSERT INTO web_item_shop_coin_prices (coins, payment_method, price) VALUES 
    (8000, 'paypal', 10.00),
    (24500, 'paypal', 30.00),
    (55000, 'paypal', 50.00),
    (110000, 'paypal', 100.00),
    (240000, 'paypal', 200.00);
END
GO

-- Shop Purchase Logs Table
IF OBJECT_ID('web_shop_logs', 'U') IS NULL
BEGIN
    CREATE TABLE web_shop_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        AccountId BIGINT NOT NULL,
        ItemId INT NOT NULL,
        Price INT NOT NULL,
        PurchaseDate DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_ShopLogs_Account ON web_shop_logs(AccountId);
END
GO

-- Example: Add sample items (uncomment to use)
-- INSERT INTO web_item_shop_items (vnum, amount, price, description, category_id, upgrade, rarity) VALUES 
-- (4705, 1, 500, 'Powerful sword', 1, 0, 0),
-- (4706, 1, 750, 'Magic staff', 1, 0, 0);
