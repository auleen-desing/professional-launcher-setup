// API Configuration - Connect to your Node.js/IIS backend
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api', // Change to your API URL
  
  // Server Configuration
  SERVER_IP: '127.0.0.1',
  LOGIN_PORT: 4000,
  CHANNELS: {
    CH1: { port: 1337, name: 'Channel 1' },
    CH2: { port: 1338, name: 'Channel 2' },
    CH3: { port: 1339, name: 'Channel 3' },
    CH4: { port: 1340, name: 'Channel 4' },
    CH5: { port: 1341, name: 'Channel 5' },
    CH51: { port: 5100, name: 'Raid Channel' },
  },
  
  // NosTale Server Info
  SERVER_NAME: 'NovaEra',
  SERVER_VERSION: '1.0.0',
  MAX_LEVEL: 99,
  RATES: {
    EXP: 50,
    GOLD: 20,
    DROP: 15,
    FAIRY_EXP: 10,
  },
  
  // Shop Configuration
  COIN_NAME: 'NovaCoins',
  DISCOUNT: 0,
  FORTUNE_WHEEL: {
    DAILY_FREE_SPIN: 0,
    SPIN_COST: 2500,
  },
  SHOP_BONUS: 0,
  PROMO: 20,
  
  // Payment
  PAYPAL_EMAIL: 'pincjx771@gmail.com',
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REGISTER: '/auth/register',
      SESSION: '/auth/session',
    },
    USER: {
      PROFILE: '/user/profile',
      COINS: '/user/coins',
      PASSWORD: '/user/password',
      AVATAR: '/user/avatar',
      CHARACTERS: '/user/characters',
    },
    SHOP: {
      ITEMS: '/shop/items',
      PURCHASE: '/shop/purchase',
      PACKAGES: '/shop/packages',
      CATEGORIES: '/shop/categories',
    },
    PAYMENTS: {
      CREATE: '/payments/create',
      VERIFY: '/payments/verify',
      HISTORY: '/payments/history',
    },
    COUPONS: {
      REDEEM: '/coupons/redeem',
    },
    DAILY: {
      CLAIM: '/daily/claim',
      STATUS: '/daily/status',
    },
    ROULETTE: {
      SPIN: '/roulette/spin',
      PRIZES: '/roulette/prizes',
    },
    TICKETS: {
      LIST: '/tickets',
      CREATE: '/tickets/create',
      VIEW: '/tickets/:id',
      REPLY: '/tickets/:id/reply',
      CLOSE: '/tickets/:id/close',
    },
    CHARACTER: {
      UNBUG: '/character/unbug',
      LIST: '/character/list',
      INFO: '/character/:name',
    },
    SERVER: {
      STATUS: '/server/status',
      CHANNELS: '/server/channels',
      MAINTENANCE: '/server/maintenance',
    },
    RANKINGS: {
      LEVEL: '/rankings/level',
      REPUTATION: '/rankings/reputation',
      PVP: '/rankings/pvp',
      GUILD: '/rankings/guild',
    },
    ADMIN: {
      USERS: '/admin/users',
      COINS: '/admin/coins',
      BAN: '/admin/ban',
      UNBAN: '/admin/unban',
      ANNOUNCEMENTS: '/admin/announcements',
      STATS: '/admin/stats',
      LOGS: '/admin/logs',
    },
  },
};

// Helper to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
