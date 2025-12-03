import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AdminUser, Announcement, ServerStats, CoinTransaction, ModAction } from '@/types/admin';

interface AdminContextType {
  isAdmin: boolean;
  stats: ServerStats;
  users: AdminUser[];
  announcements: Announcement[];
  transactions: CoinTransaction[];
  modActions: ModAction[];
  updateUserCoins: (userId: string, amount: number, type: 'add' | 'remove', reason: string) => void;
  banUser: (userId: string, reason: string) => void;
  unbanUser: (userId: string) => void;
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'author'>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncement: (id: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Mock data
const mockStats: ServerStats = {
  totalUsers: 15847,
  activeUsers: 8234,
  onlinePlayers: 2847,
  totalCoins: 458923847,
  revenue: 12580,
  newUsersToday: 127,
  ticketsOpen: 23,
  bannedUsers: 156,
};

const mockUsers: AdminUser[] = [
  { id: '1', username: 'Auleen', email: 'auleen@novaera.com', coins: 8000123, status: 'active', role: 'vip', lastLogin: '2024-01-15T10:30:00', createdAt: '2023-06-15', ip: '192.168.1.1' },
  { id: '2', username: 'DragonSlayer', email: 'dragon@email.com', coins: 45000, status: 'active', role: 'user', lastLogin: '2024-01-15T09:15:00', createdAt: '2023-08-20', ip: '192.168.1.2' },
  { id: '3', username: 'ShadowKnight', email: 'shadow@email.com', coins: 125000, status: 'banned', role: 'user', lastLogin: '2024-01-10T14:00:00', createdAt: '2023-09-10', ip: '192.168.1.3' },
  { id: '4', username: 'Phoenix', email: 'phoenix@email.com', coins: 89000, status: 'active', role: 'moderator', lastLogin: '2024-01-15T11:00:00', createdAt: '2023-05-01', ip: '192.168.1.4' },
  { id: '5', username: 'NightWolf', email: 'wolf@email.com', coins: 32000, status: 'suspended', role: 'user', lastLogin: '2024-01-14T16:30:00', createdAt: '2023-10-05', ip: '192.168.1.5' },
];

const mockAnnouncements: Announcement[] = [
  { id: '1', title: 'Nueva Temporada: Era del Dragón', content: 'Descubre las nuevas mazmorras y jefes épicos.', type: 'event', priority: 'high', active: true, createdAt: '2024-01-15', author: 'Admin' },
  { id: '2', title: 'Mantenimiento Programado', content: 'El servidor estará en mantenimiento el día 20 de enero.', type: 'maintenance', priority: 'normal', active: true, createdAt: '2024-01-14', expiresAt: '2024-01-21', author: 'Admin' },
  { id: '3', title: 'Actualización v2.5', content: 'Balance de clases y nuevos items.', type: 'update', priority: 'normal', active: false, createdAt: '2024-01-10', author: 'Admin' },
];

const mockTransactions: CoinTransaction[] = [
  { id: '1', userId: '1', username: 'Auleen', amount: 5000, type: 'add', reason: 'Premio evento', adminId: 'admin1', createdAt: '2024-01-15T10:00:00' },
  { id: '2', userId: '2', username: 'DragonSlayer', amount: 1000, type: 'remove', reason: 'Penalización', adminId: 'admin1', createdAt: '2024-01-15T09:30:00' },
];

const mockModActions: ModAction[] = [
  { id: '1', userId: '3', username: 'ShadowKnight', action: 'ban', reason: 'Uso de hacks', adminId: 'admin1', adminName: 'Admin', createdAt: '2024-01-10T14:00:00' },
  { id: '2', userId: '5', username: 'NightWolf', action: 'suspend', reason: 'Comportamiento tóxico', duration: '7 días', adminId: 'admin1', adminName: 'Admin', createdAt: '2024-01-14T16:30:00' },
];

export function AdminProvider({ children }: { children: ReactNode }) {
  const [stats] = useState<ServerStats>(mockStats);
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [transactions, setTransactions] = useState<CoinTransaction[]>(mockTransactions);
  const [modActions, setModActions] = useState<ModAction[]>(mockModActions);

  const updateUserCoins = (userId: string, amount: number, type: 'add' | 'remove', reason: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          coins: type === 'add' ? user.coins + amount : Math.max(0, user.coins - amount)
        };
      }
      return user;
    }));

    const user = users.find(u => u.id === userId);
    if (user) {
      const newTransaction: CoinTransaction = {
        id: String(transactions.length + 1),
        userId,
        username: user.username,
        amount,
        type,
        reason,
        adminId: 'admin1',
        createdAt: new Date().toISOString(),
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
  };

  const banUser = (userId: string, reason: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        return { ...user, status: 'banned' as const };
      }
      return user;
    }));

    const user = users.find(u => u.id === userId);
    if (user) {
      const newAction: ModAction = {
        id: String(modActions.length + 1),
        userId,
        username: user.username,
        action: 'ban',
        reason,
        adminId: 'admin1',
        adminName: 'Admin',
        createdAt: new Date().toISOString(),
      };
      setModActions(prev => [newAction, ...prev]);
    }
  };

  const unbanUser = (userId: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        return { ...user, status: 'active' as const };
      }
      return user;
    }));

    const user = users.find(u => u.id === userId);
    if (user) {
      const newAction: ModAction = {
        id: String(modActions.length + 1),
        userId,
        username: user.username,
        action: 'unban',
        reason: 'Desbaneo manual',
        adminId: 'admin1',
        adminName: 'Admin',
        createdAt: new Date().toISOString(),
      };
      setModActions(prev => [newAction, ...prev]);
    }
  };

  const createAnnouncement = (announcement: Omit<Announcement, 'id' | 'createdAt' | 'author'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: String(announcements.length + 1),
      createdAt: new Date().toISOString().split('T')[0],
      author: 'Admin',
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, active: !a.active };
      }
      return a;
    }));
  };

  return (
    <AdminContext.Provider value={{
      isAdmin: true,
      stats,
      users,
      announcements,
      transactions,
      modActions,
      updateUserCoins,
      banUser,
      unbanUser,
      createAnnouncement,
      deleteAnnouncement,
      toggleAnnouncement,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
