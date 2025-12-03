export interface User {
  id: string;
  username: string;
  email: string;
  coins: number;
  avatar?: string;
  createdAt: string;
  authority: number; // 100 = admin
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

export interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'closed';
  createdAt: string;
  lastUpdate: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'event' | 'maintenance';
  createdAt: string;
}
