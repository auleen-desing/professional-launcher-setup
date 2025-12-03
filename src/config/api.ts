// API Configuration - Connect to your Node.js/IIS backend
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api', // Change to your API URL
  
  // Server Configuration
  SERVER_IP: '127.0.0.1',
  LOGIN_PORT: 4000,
  CHANNELS: {
    CH1: 1337,
    CH2: 1338,
    CH3: 1339,
    CH4: 1340,
    CH5: 1341,
    CH51: 5100,
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
    },
    SHOP: {
      ITEMS: '/shop/items',
      PURCHASE: '/shop/purchase',
      PACKAGES: '/shop/packages',
    },
    PAYMENTS: {
      CREATE: '/payments/create',
      VERIFY: '/payments/verify',
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
    },
    TICKETS: {
      LIST: '/tickets',
      CREATE: '/tickets/create',
      VIEW: '/tickets/:id',
    },
    CHARACTER: {
      UNBUG: '/character/unbug',
    },
  },
};
