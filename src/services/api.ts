// API Service Layer for NosTale Private Server
import { API_CONFIG } from '@/config/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    coins: number;
    authority: number;
    avatar?: string;
    createdAt: string;
  };
  token: string;
}

interface ServerStatus {
  online: boolean;
  players: number;
  maxPlayers: number;
  channels: {
    id: string;
    name: string;
    port: number;
    players: number;
    status: 'online' | 'offline' | 'maintenance';
  }[];
}

interface Character {
  id: string;
  name: string;
  class: 'Swordsman' | 'Archer' | 'Mage';
  level: number;
  gold: number;
  reputation: number;
  lastLogin: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.token = localStorage.getItem('novaera_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: json.message || json.error || 'Request failed',
        };
      }

      // Backend returns { success, data, error } - pass through directly
      if (json.success !== undefined) {
        return {
          success: json.success,
          data: json.data,
          error: json.error,
        };
      }

      // Fallback for endpoints that don't follow the standard format
      return {
        success: true,
        data: json,
      };
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('novaera_token', token);
    } else {
      localStorage.removeItem('novaera_token');
    }
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const result = await this.request<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async logout(): Promise<ApiResponse> {
    const result = await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
    this.setToken(null);
    return result;
  }

  async getSession(): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.SESSION);
  }

  async register(username: string, email: string, password: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<LoginResponse['user']>> {
    return this.request(API_CONFIG.ENDPOINTS.USER.PROFILE);
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.USER.PASSWORD, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async updateAvatar(avatarUrl: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.USER.AVATAR, {
      method: 'PUT',
      body: JSON.stringify({ avatar: avatarUrl }),
    });
  }

  async getCoins(): Promise<ApiResponse<{ coins: number }>> {
    return this.request(API_CONFIG.ENDPOINTS.USER.COINS);
  }

  // Shop endpoints
  async getShopItems(): Promise<ApiResponse<any[]>> {
    return this.request(API_CONFIG.ENDPOINTS.SHOP.ITEMS);
  }

  async purchaseItem(itemId: string, quantity: number = 1): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.SHOP.PURCHASE, {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity }),
    });
  }

  async getCoinPackages(): Promise<ApiResponse<any[]>> {
    return this.request(API_CONFIG.ENDPOINTS.SHOP.PACKAGES);
  }

  // Payment endpoints
  async createPayment(packageId: string, method: string): Promise<ApiResponse<{ paymentUrl: string }>> {
    return this.request(API_CONFIG.ENDPOINTS.PAYMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify({ packageId, method }),
    });
  }

  async verifyPayment(paymentId: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY, {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    });
  }

  // Coupon endpoints
  async redeemCoupon(code: string): Promise<ApiResponse<{ coins: number }>> {
    return this.request(API_CONFIG.ENDPOINTS.COUPONS.REDEEM, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Daily reward endpoints
  async claimDailyReward(): Promise<ApiResponse<{ coins: number; streak: number }>> {
    return this.request(API_CONFIG.ENDPOINTS.DAILY.CLAIM, {
      method: 'POST',
    });
  }

  async getDailyStatus(): Promise<ApiResponse<{ canClaim: boolean; streak: number; nextClaim: string }>> {
    return this.request(API_CONFIG.ENDPOINTS.DAILY.STATUS);
  }

  // Roulette endpoints
  async spinRoulette(): Promise<ApiResponse<{ prize: string; coins: number }>> {
    return this.request(API_CONFIG.ENDPOINTS.ROULETTE.SPIN, {
      method: 'POST',
    });
  }

  // Ticket endpoints
  async getTickets(): Promise<ApiResponse<any[]>> {
    return this.request(API_CONFIG.ENDPOINTS.TICKETS.LIST);
  }

  async createTicket(subject: string, message: string, category: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.TICKETS.CREATE, {
      method: 'POST',
      body: JSON.stringify({ subject, message, category }),
    });
  }

  async getTicket(id: string): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.TICKETS.VIEW.replace(':id', id));
  }

  // Character endpoints
  async unbugCharacter(characterName: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.CHARACTER.UNBUG, {
      method: 'POST',
      body: JSON.stringify({ characterName }),
    });
  }

  // Server status (custom endpoint)
  async getServerStatus(): Promise<ApiResponse<ServerStatus>> {
    return this.request('/server/status');
  }

  // Characters list
  async getCharacters(): Promise<ApiResponse<Character[]>> {
    return this.request('/user/characters');
  }

  // Rankings
  async getRankings(type: 'level' | 'reputation' | 'pvp' = 'level', limit: number = 100): Promise<ApiResponse<any[]>> {
    return this.request(`/rankings?type=${type}&limit=${limit}`);
  }
}

export const apiService = new ApiService();
export type { ApiResponse, LoginResponse, ServerStatus, Character };
