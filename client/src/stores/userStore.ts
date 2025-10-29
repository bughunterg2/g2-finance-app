import { create } from 'zustand';
import type { User } from '@/types';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  fetchUsers: () => Promise<void>;
  updateRole: (uid: string, role: 'admin' | 'agent') => Promise<void>;
  toggleActive: (uid: string) => Promise<void>;
  inviteUser: (user: Pick<User, 'email' | 'name' | 'role' | 'division'> & { phoneNumber?: string }) => Promise<void>;
}

export const useUserStore = create<UserState & UserActions>()((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      // generate mock users
      const names = ['Ayu Rahma','Budi Santoso','Citra Lestari','Dedi Pratama','Eka Putri','Fajar Nugraha','Gita Saraswati','Hasan Basri','Inda Safitri','Joko Widodo','Kiki Amelia','Lia Utami','Malik Akbar','Nina Sari','Oka Dharma','Putra Ananda','Qori Rahman','Rina Wulandari','Sigit Pamungkas','Tania Dewi'];
      const divisions = ['Blok M', 'Pejaten', 'Poin'];
      const make = (i: number): User => {
        const role = i < 2 ? 'admin' : 'agent';
        return {
          uid: `user-${i}`,
          email: `${names[i % names.length].toLowerCase().replace(/\s+/g,'')}@example.com`,
          name: names[i % names.length],
          role,
          division: divisions[i % divisions.length],
          phoneNumber: `0812-34${(100 + i).toString()}-${(1000 + i).toString()}`,
          isActive: Math.random() > 0.1,
          createdAt: new Date(Date.now() - Math.floor(Math.random()*200)*86400000),
          updatedAt: new Date(),
          lastLoginAt: new Date(Date.now() - Math.floor(Math.random()*30)*86400000),
        };
      };
      const list = Array.from({ length: 20 }, (_, i) => make(i));
      set({ users: list, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch users', isLoading: false });
    }
  },

  updateRole: async (uid, role) => {
    set({ isLoading: true });
    try {
      set(state => ({ users: state.users.map(u => u.uid === uid ? { ...u, role, updatedAt: new Date() } : u), isLoading: false }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to update role', isLoading: false });
    }
  },

  toggleActive: async (uid) => {
    set({ isLoading: true });
    try {
      set(state => ({ users: state.users.map(u => u.uid === uid ? { ...u, isActive: !u.isActive, updatedAt: new Date() } : u), isLoading: false }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to toggle user', isLoading: false });
    }
  },

  inviteUser: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newUser: User = {
        uid: `user-${Date.now()}`,
        email: data.email,
        name: data.name,
        role: data.role,
        division: data.division,
        phoneNumber: data.phoneNumber,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: undefined,
      };
      set(state => ({ users: [newUser, ...state.users], isLoading: false }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to invite user', isLoading: false });
    }
  },
}));


