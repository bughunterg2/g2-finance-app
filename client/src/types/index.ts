// User Types
export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
  division: string;
  phoneNumber?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'agent';
  division: string;
  phoneNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  budget?: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface CreateCategoryData {
  name: string;
  description: string;
  icon: string;
  color: string;
  budget?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  isActive?: boolean;
}

// Reimbursement Types
export type ReimbursementStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';

export interface Reimbursement {
  id: string;
  agentId: string;
  categoryId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  transactionDate: Date;
  status: ReimbursementStatus;
  attachments: string[];
  submittedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReimbursementData {
  categoryId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  transactionDate: Date;
  attachments: string[]; // Changed from File[] to string[] for now
}

export interface UpdateReimbursementData extends Partial<CreateReimbursementData> {
  status?: ReimbursementStatus;
  rejectionReason?: string;
}

// Approval Workflow Types
export interface ApprovalWorkflow {
  id: string;
  reimbursementId: string;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: string;
  actionDate: Date;
  level: number;
  createdAt: Date;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: object;
  newData?: object;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

// Filter Types
export interface FilterState {
  status?: ReimbursementStatus;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

// Dashboard Types
export interface DashboardStats {
  totalReimbursements: number;
  pendingApprovals: number;
  approvedAmount: number;
  rejectedAmount: number;
  monthlySpending: number;
  yearlySpending: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

// Income and Balance Types
export interface Income {
  id: string;
  date: Date;
  amount: number;
  category?: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CreateIncomeData {
  date: Date;
  amount: number;
  category?: string;
  description?: string;
}

export interface UpdateIncomeData extends Partial<CreateIncomeData> {
  isActive?: boolean;
}

export interface BalanceSnapshot {
  openingBalance: number;
  currentBalance: number;
  lastUpdatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: any;
}

// Theme Types
export type ThemeMode = 'light' | 'dark';

// Route Types
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  protected?: boolean;
  roles?: ('admin' | 'agent')[];
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'date';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string | number;
}

export interface TableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
}
