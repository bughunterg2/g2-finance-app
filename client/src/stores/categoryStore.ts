import { create } from 'zustand';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/types';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

interface CategoryActions {
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState & CategoryActions>()(
  (set, get) => ({
    // State
    categories: [],
    isLoading: false,
    error: null,

    // Actions
    fetchCategories: async () => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase data fetching
        console.log('Fetching categories');
        
        // Mock data for now
        const mockCategories: Category[] = [
          {
            id: 'cat-1',
            name: 'Office Supplies',
            description: 'Office supplies and stationery',
            icon: 'work',
            color: '#3b82f6',
            budget: 500000,
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdBy: 'admin-uid',
          },
          {
            id: 'cat-2',
            name: 'Travel',
            description: 'Business travel expenses',
            icon: 'flight',
            color: '#22c55e',
            budget: 2000000,
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdBy: 'admin-uid',
          },
          {
            id: 'cat-3',
            name: 'Meals',
            description: 'Business meals and entertainment',
            icon: 'restaurant',
            color: '#f59e0b',
            budget: 1000000,
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdBy: 'admin-uid',
          },
          {
            id: 'cat-4',
            name: 'Transportation',
            description: 'Local transportation costs',
            icon: 'directions_car',
            color: '#ef4444',
            budget: 800000,
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdBy: 'admin-uid',
          },
        ];
        
        set({ 
          categories: mockCategories, 
          isLoading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch categories',
          isLoading: false 
        });
      }
    },

    createCategory: async (data: CreateCategoryData) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase creation
        console.log('Creating category:', data);
        
        const newCategory: Category = {
          id: `category-${Date.now()}`,
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          budget: data.budget,
          isActive: true,
          createdAt: new Date(),
          createdBy: 'current-user-id',
        };
        
        set(state => ({
          categories: [...state.categories, newCategory],
          isLoading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create category',
          isLoading: false 
        });
      }
    },

    updateCategory: async (id: string, data: UpdateCategoryData) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase update
        console.log('Updating category:', id, data);
        
        set(state => ({
          categories: state.categories.map(c => 
            c.id === id 
              ? { ...c, ...data }
              : c
          ),
          isLoading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update category',
          isLoading: false 
        });
      }
    },

    deleteCategory: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase soft delete
        console.log('Deleting category:', id);
        
        set(state => ({
          categories: state.categories.map(c => 
            c.id === id 
              ? { ...c, isActive: false }
              : c
          ),
          isLoading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete category',
          isLoading: false 
        });
      }
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },
  })
);
