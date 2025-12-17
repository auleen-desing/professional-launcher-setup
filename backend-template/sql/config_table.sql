-- Web Configuration Table
-- Run this SQL in SQL Server Management Studio to create the config table

CREATE TABLE web_config (
    id INT PRIMARY KEY IDENTITY(1,1),
    config_key NVARCHAR(100) NOT NULL UNIQUE,
    config_value NVARCHAR(500) NOT NULL,
    description NVARCHAR(255) NULL,
    updated_at DATETIME DEFAULT GETDATE()
);

-- Insert default values
INSERT INTO web_config (config_key, config_value, description) VALUES 
('COIN_BONUS', '30', 'Bonus percentage for coin purchases (0-100)'),
('SHOP_DISCOUNT', '50', 'Discount percentage for shop items (0-100)'),
('ROULETTE_SPIN_COST', '2500', 'Cost in coins for each roulette spin'),
('DAILY_FREE_SPINS', '0', 'Number of free daily roulette spins');

GO
