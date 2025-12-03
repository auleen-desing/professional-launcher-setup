export interface AdminUser {
  id: string;
  username: string;
  email: string;
  coins: number;
  status: 'active' | 'banned' | 'suspended';
  role: 'user' | 'vip' | 'moderator' | 'admin';
  lastLogin: string;
  createdAt: string;
  ip?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'event' | 'maintenance' | 'update';
  priority: 'low' | 'normal' | 'high';
  active: boolean;
  createdAt: string;
  expiresAt?: string;
  author: string;
}

export interface ServerStats {
  totalUsers: number;
  activeUsers: number;
  onlinePlayers: number;
  totalCoins: number;
  revenue: number;
  newUsersToday: number;
  ticketsOpen: number;
  bannedUsers: number;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  username: string;
  amount: number;
  type: 'add' | 'remove' | 'purchase' | 'reward';
  reason: string;
  adminId: string;
  createdAt: string;
}

export interface ModAction {
  id: string;
  userId: string;
  username: string;
  action: 'ban' | 'unban' | 'suspend' | 'warn' | 'mute';
  reason: string;
  duration?: string;
  adminId: string;
  adminName: string;
  createdAt: string;
}
