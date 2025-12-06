-- Title Shop Tables

-- Create titles table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_titles' AND xtype='U')
CREATE TABLE web_titles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL UNIQUE,
    DisplayName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    Price INT NOT NULL DEFAULT 0,
    Rarity NVARCHAR(20) NOT NULL DEFAULT 'common', -- common, uncommon, rare, epic, legendary
    Icon NVARCHAR(50) NOT NULL DEFAULT 'star',
    Color NVARCHAR(20) NOT NULL DEFAULT '#9ca3af',
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Create user titles table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='web_user_titles' AND xtype='U')
CREATE TABLE web_user_titles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AccountId BIGINT NOT NULL,
    TitleId INT NOT NULL FOREIGN KEY REFERENCES web_titles(Id),
    PurchaseDate DATETIME DEFAULT GETDATE(),
    Equipped BIT DEFAULT 0,
    CONSTRAINT UQ_UserTitle UNIQUE (AccountId, TitleId)
);

-- Insert default titles
IF NOT EXISTS (SELECT * FROM web_titles WHERE Name = 'novice')
BEGIN
    INSERT INTO web_titles (Name, DisplayName, Description, Price, Rarity, Icon, Color) VALUES
    ('novice', 'Novice', 'A beginner adventurer', 100, 'common', 'star', '#9ca3af'),
    ('warrior', 'Warrior', 'Battle-hardened fighter', 500, 'uncommon', 'shield', '#4ade80'),
    ('champion', 'Champion', 'Victor of many battles', 1500, 'rare', 'crown', '#60a5fa'),
    ('legend', 'Legend', 'Stories are told about you', 5000, 'epic', 'sparkles', '#c084fc'),
    ('immortal', 'Immortal', 'Beyond life and death', 15000, 'legendary', 'flame', '#facc15'),
    ('destroyer', 'Destroyer', 'Leave nothing standing', 3000, 'rare', 'skull', '#f87171'),
    ('beloved', 'Beloved', 'Loved by all', 2000, 'uncommon', 'heart', '#fb7185'),
    ('lightning', 'Lightning', 'Fast as thunder', 8000, 'epic', 'zap', '#fbbf24');
END
GO
