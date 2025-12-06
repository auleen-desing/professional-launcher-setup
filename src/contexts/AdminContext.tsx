import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser, Announcement, ServerStats, CoinTransaction, ModAction } from '@/types/admin';
import { useAuth } from './AuthContext';
import { buildApiUrl } from '@/config/api';

interface AdminContextType {
  isAdmin: boolean;
  stats: ServerStats;
  users: AdminUser[];
  announcements: Announcement[];
  transactions: CoinTransaction[];
  modActions: ModAction[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  updateUserCoins: (userId: string, amount: number, type: 'add' | 'remove', reason: string) => Promise<void>;
  banUser: (userId: string, reason: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'author'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  toggleAnnouncement: (id: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const defaultStats: ServerStats = {
  totalUsers: 0,
  activeUsers: 0,
  onlinePlayers: 0,
  totalCoins: 0,
  revenue: 0,
  newUsersToday: 0,
  ticketsOpen: 0,
  bannedUsers: 0,
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<ServerStats>(defaultStats);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [modActions, setModActions] = useState<ModAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = () => localStorage.getItem('auth_token');

  const fetchStats = async () => {
    try {
      const response = await fetch(buildApiUrl('/admin/stats'), {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(buildApiUrl('/admin/users'), {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(buildApiUrl('/admin/transactions'), {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const fetchModActions = async () => {
    try {
      const response = await fetch(buildApiUrl('/admin/modactions'), {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setModActions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch mod actions:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(buildApiUrl('/admin/announcements'), {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchTransactions(),
      fetchModActions(),
      fetchAnnouncements(),
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      refreshData();
    }
  }, [isAdmin]);

  const updateUserCoins = async (userId: string, amount: number, type: 'add' | 'remove', reason: string) => {
    try {
      const response = await fetch(buildApiUrl('/admin/coins'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ userId: parseInt(userId), amount, type, reason })
      });
      const data = await response.json();
      if (data.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to update coins:', error);
      throw error;
    }
  };

  const banUser = async (userId: string, reason: string) => {
    try {
      const response = await fetch(buildApiUrl('/admin/ban'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ userId: parseInt(userId), reason })
      });
      const data = await response.json();
      if (data.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
      throw error;
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const response = await fetch(buildApiUrl('/admin/unban'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ userId: parseInt(userId) })
      });
      const data = await response.json();
      if (data.success) {
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to unban user:', error);
      throw error;
    }
  };

  const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'author'>) => {
    try {
      const response = await fetch(buildApiUrl('/admin/announcements'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(announcement)
      });
      const data = await response.json();
      if (data.success) {
        await fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      throw error;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const response = await fetch(buildApiUrl(`/admin/announcements/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        await fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      throw error;
    }
  };

  const toggleAnnouncement = async (id: string) => {
    const announcement = announcements.find(a => a.id === id);
    if (!announcement) return;
    
    try {
      const response = await fetch(buildApiUrl(`/admin/announcements/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ active: !announcement.active })
      });
      const data = await response.json();
      if (data.success) {
        await fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to toggle announcement:', error);
      throw error;
    }
  };

  return (
    <AdminContext.Provider value={{
      isAdmin,
      stats,
      users,
      announcements,
      transactions,
      modActions,
      isLoading,
      refreshData,
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
