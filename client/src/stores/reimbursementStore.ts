import { create } from 'zustand';
import { useAuthStore } from '@/stores/authStore';
import type { Reimbursement, CreateReimbursementData, UpdateReimbursementData, FilterState } from '@/types';
import { useBalanceStore } from '@/stores/balanceStore';

interface ReimbursementState {
  reimbursements: Reimbursement[];
  currentReimbursement: Reimbursement | null;
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ReimbursementActions {
  fetchReimbursements: () => Promise<void>;
  fetchReimbursementById: (id: string) => Promise<void>;
  createReimbursement: (data: CreateReimbursementData) => Promise<void>;
  updateReimbursement: (id: string, data: UpdateReimbursementData) => Promise<void>;
  deleteReimbursement: (id: string) => Promise<void>;
  approveReimbursement: (id: string, comments: string) => Promise<void>;
  rejectReimbursement: (id: string, reason: string) => Promise<void>;
  payReimbursement: (id: string) => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  setCurrentReimbursement: (reimbursement: Reimbursement | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useReimbursementStore = create<ReimbursementState & ReimbursementActions>()(
  (set, get) => ({
    // State
    reimbursements: [],
    currentReimbursement: null,
    isLoading: false,
    error: null,
    filters: {
      page: 1,
      limit: 10,
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },

    // Actions
    fetchReimbursements: async () => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase data fetching
        console.log('Fetching reimbursements with filters:', get().filters);
        
        // Expanded mock data generation
        const categories = ['cat-1','cat-2','cat-3','cat-4','cat-5','cat-6','cat-7','cat-8','cat-9','cat-10','cat-11'];
        const agents = [
          'agent-ayu','agent-budi','agent-citra','agent-dedi','agent-eka',
          'agent-fajar','agent-gita','agent-hasan','agent-inda','agent-joko',
          'agent-kiki','agent-lia','agent-malik','agent-nina','agent-oka'
        ];
        const titles = [
          'Office Supplies Purchase','Business Travel to Jakarta','Client Dinner Meeting','Taxi to Airport','Software License Renewal',
          'Internet Bill Payment','Printer Maintenance','Team Lunch','Stationery Order','Hotel Accommodation',
          'Conference Registration','Training Course','Equipment Repair','Marketing Materials','Office Rent',
          'Phone Bill','Transportation Cost','Meal Allowance','Document Printing','Parking Fee'
        ];
        const descriptions = [
          'Monthly office supplies for team operations.',
          'Business trip expenses for client meeting.',
          'Client entertainment dinner for project discussion.',
          'Transportation to airport for business travel.',
          'Annual software license renewal for development tools.',
          'Monthly internet service payment.',
          'Printer maintenance and repair service.',
          'Team building lunch meeting.',
          'Office stationery and supplies order.',
          'Hotel accommodation for business trip.',
          'Industry conference registration fee.',
          'Professional development training course.',
          'Equipment repair and maintenance service.',
          'Marketing materials and promotional items.',
          'Monthly office space rental payment.',
          'Mobile phone service bill.',
          'Local transportation expenses.',
          'Daily meal allowance during business trip.',
          'Document printing and binding service.',
          'Parking fees for office visits.'
        ];
        const statuses: Reimbursement['status'][] = ['draft','pending','approved','rejected','paid'];

        const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)];

        const now = new Date();
        const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

        const currentUserUid = useAuthStore.getState().user?.uid;

        const makeItem = (i: number): Reimbursement => {
          const status = pick(statuses);
          const amount = rand(50000, 10000000);
          const createdAt = daysAgo(rand(0, 90));
          const submittedAt = new Date(createdAt.getTime() + rand(0, 2) * 86400000);
          const isApproved = status === 'approved' || status === 'paid';
          const isRejected = status === 'rejected';
          const approvedAt = isApproved ? new Date(submittedAt.getTime() + rand(1, 5) * 86400000) : undefined;
          const approvedBy = isApproved ? pick(['admin-ayu','admin-budi','admin-siti']) : undefined;
          const rejectionReason = isRejected ? pick(['Insufficient documentation','Exceeds budget','Non-business expense']) : undefined;
          const paymentDate = status === 'paid' && approvedAt ? new Date(approvedAt.getTime() + rand(1, 7) * 86400000) : undefined;

          const chosenAgentId = currentUserUid && Math.random() < 0.5 ? currentUserUid : pick(agents);

          return {
            id: `rb-${i}-${Date.now()}`,
            agentId: chosenAgentId,
            categoryId: pick(categories),
            title: pick(titles),
            description: pick(descriptions),
            amount,
            currency: 'IDR',
            transactionDate: daysAgo(rand(0, 90)),
            status,
            attachments: [],
            submittedAt,
            approvedAt,
            approvedBy,
            rejectionReason,
            paymentDate,
            createdAt,
            updatedAt: createdAt,
          };
        };

        const total = 150; // generate ~150 items for more variety
        const generated: Reimbursement[] = Array.from({ length: total }, (_, i) => makeItem(i));
        
        set({ 
          reimbursements: generated, 
          isLoading: false,
          pagination: {
            page: 1,
            limit: 10,
            total: generated.length,
            totalPages: Math.ceil(generated.length / 10),
          }
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch reimbursements',
          isLoading: false 
        });
      }
    },

    fetchReimbursementById: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase data fetching
        console.log('Fetching reimbursement by ID:', id);
        
        const reimbursement = get().reimbursements.find(r => r.id === id);
        set({ 
          currentReimbursement: reimbursement || null, 
          isLoading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch reimbursement',
          isLoading: false 
        });
      }
    },

    createReimbursement: async (data: CreateReimbursementData) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase creation
        console.log('Creating reimbursement:', data);
        
        const newReimbursement: Reimbursement = {
          id: `reimbursement-${Date.now()}`,
          agentId: 'mock-uid',
          categoryId: data.categoryId,
          title: data.title,
          description: data.description,
          amount: data.amount,
          currency: data.currency,
          transactionDate: data.transactionDate,
          status: 'draft',
          attachments: [], // TODO: Handle file uploads
          submittedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set(state => ({
          reimbursements: [newReimbursement, ...state.reimbursements],
          isLoading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create reimbursement',
          isLoading: false 
        });
      }
    },

    updateReimbursement: async (id: string, data: UpdateReimbursementData) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase update
        console.log('Updating reimbursement:', id, data);
        
        set(state => ({
          reimbursements: state.reimbursements.map(r => 
            r.id === id 
              ? { ...r, ...data, updatedAt: new Date() }
              : r
          ),
          currentReimbursement: state.currentReimbursement?.id === id 
            ? { ...state.currentReimbursement, ...data, updatedAt: new Date() }
            : state.currentReimbursement,
          isLoading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update reimbursement',
          isLoading: false 
        });
      }
    },

    deleteReimbursement: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase deletion
        console.log('Deleting reimbursement:', id);
        
        set(state => ({
          reimbursements: state.reimbursements.filter(r => r.id !== id),
          currentReimbursement: state.currentReimbursement?.id === id 
            ? null 
            : state.currentReimbursement,
          isLoading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete reimbursement',
          isLoading: false 
        });
      }
    },

    approveReimbursement: async (id: string, comments: string) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase approval
        console.log('Approving reimbursement:', id, comments);
        
        set(state => ({
          reimbursements: state.reimbursements.map(r => 
            r.id === id 
              ? { 
                  ...r, 
                  status: 'approved' as const,
                  approvedAt: new Date(),
                  approvedBy: 'current-user-id',
                  updatedAt: new Date()
                }
              : r
          ),
          currentReimbursement: state.currentReimbursement?.id === id 
            ? { 
                ...state.currentReimbursement, 
                status: 'approved' as const,
                approvedAt: new Date(),
                approvedBy: 'current-user-id',
                updatedAt: new Date()
              }
            : state.currentReimbursement,
          isLoading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to approve reimbursement',
          isLoading: false 
        });
      }
    },

    rejectReimbursement: async (id: string, reason: string) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Implement Firebase rejection
        console.log('Rejecting reimbursement:', id, reason);
        
        set(state => ({
          reimbursements: state.reimbursements.map(r => 
            r.id === id 
              ? { 
                  ...r, 
                  status: 'rejected' as const,
                  rejectionReason: reason,
                  updatedAt: new Date()
                }
              : r
          ),
          currentReimbursement: state.currentReimbursement?.id === id 
            ? { 
                ...state.currentReimbursement, 
                status: 'rejected' as const,
                rejectionReason: reason,
                updatedAt: new Date()
              }
            : state.currentReimbursement,
          isLoading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to reject reimbursement',
          isLoading: false 
        });
      }
    },

    payReimbursement: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        let paidAmount = 0;
        set(state => ({
          reimbursements: state.reimbursements.map(r => {
            if (r.id === id) {
              paidAmount = r.amount;
              return { ...r, status: 'paid' as const, paymentDate: new Date(), updatedAt: new Date() };
            }
            return r;
          }),
          currentReimbursement: state.currentReimbursement?.id === id
            ? { ...state.currentReimbursement, status: 'paid' as const, paymentDate: new Date(), updatedAt: new Date() }
            : state.currentReimbursement,
          isLoading: false
        }));
        // Deduct balance by paid amount
        if (paidAmount > 0) {
          useBalanceStore.getState().applyReimbursementDelta(-paidAmount);
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to pay reimbursement',
          isLoading: false 
        });
      }
    },

    setFilters: (filters: Partial<FilterState>) => {
      set(state => ({
        filters: { ...state.filters, ...filters }
      }));
    },

    setCurrentReimbursement: (reimbursement: Reimbursement | null) => {
      set({ currentReimbursement: reimbursement });
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
