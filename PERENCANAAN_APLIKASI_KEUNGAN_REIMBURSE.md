# PERENCANAAN LENGKAP APLIKASI KEUNGAN REIMBURSE

## **OVERVIEW APLIKASI**
Aplikasi web keuangan untuk manajemen reimburse dengan fitur utama:
- Input dan tracking pengeluaran reimburse
- Sistem approval workflow
- Laporan pemasukan dan pengeluaran
- Dashboard analytics
- Role-based access (Admin & Agent)

---

## **FASE 1: BACKEND DEVELOPMENT**

### **1.1 Setup & Konfigurasi**
- Setup Firebase project dengan Firestore
- Konfigurasi Firebase Authentication
- Setup Firebase Storage untuk file upload
- Konfigurasi Firebase Security Rules
- Setup Firebase Functions (Node.js)
- Environment variables configuration

### **1.2 Database Schema (Firestore Collections)**

#### **Users Collection**
```javascript
{
  uid: string, // Firebase Auth UID
  email: string,
  name: string,
  role: 'admin' | 'agent',
  department: string,
  avatar?: string, // URL foto profil
  createdAt: timestamp,
  updatedAt: timestamp,
  isActive: boolean,
  lastLoginAt: timestamp
}
```

#### **Categories Collection**
```javascript
{
  id: string,
  name: string,
  description: string,
  icon: string, // icon name untuk UI
  color: string, // hex color untuk UI
  budget?: number, // optional budget limit
  isActive: boolean,
  createdAt: timestamp,
  createdBy: string // user UID
}
```

#### **Reimbursements Collection**
```javascript
{
  id: string,
  agentId: string, // user UID
  categoryId: string,
  title: string,
  description: string,
  amount: number,
  currency: string, // default 'IDR'
  transactionDate: timestamp,
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid',
  attachments: string[], // array of file URLs
  submittedAt: timestamp,
  approvedAt?: timestamp,
  approvedBy?: string, // admin UID
  rejectionReason?: string,
  paymentDate?: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **Approval Workflow Collection**
```javascript
{
  id: string,
  reimbursementId: string,
  approverId: string,
  status: 'pending' | 'approved' | 'rejected',
  comments: string,
  actionDate: timestamp,
  level: number, // untuk multi-level approval
  createdAt: timestamp
}
```

#### **Audit Logs Collection**
```javascript
{
  id: string,
  userId: string,
  action: string, // 'create', 'update', 'approve', 'reject', 'delete'
  entityType: string, // 'reimbursement', 'user', 'category'
  entityId: string,
  oldData?: object,
  newData?: object,
  timestamp: timestamp,
  ipAddress: string,
  userAgent: string
}
```

### **1.3 Firebase Functions**

#### **Authentication Functions**
- `createUser()` - Create new agent/admin
- `updateUserProfile()` - Update user profile
- `deactivateUser()` - Deactivate user account
- `getUserProfile()` - Get user profile data

#### **Reimbursement Functions**
- `createReimbursement()` - Submit new reimbursement
- `updateReimbursement()` - Update reimbursement details
- `deleteReimbursement()` - Delete reimbursement (soft delete)
- `approveReimbursement()` - Approve reimbursement
- `rejectReimbursement()` - Reject reimbursement
- `getReimbursementsByAgent()` - Get agent's reimbursements
- `getReimbursementsByStatus()` - Get reimbursements by status
- `getReimbursementById()` - Get single reimbursement

#### **Category Management**
- `createCategory()` - Create new category
- `updateCategory()` - Update category
- `deleteCategory()` - Soft delete category
- `getActiveCategories()` - Get active categories
- `getAllCategories()` - Get all categories (admin only)

#### **Reporting Functions**
- `generateIncomeReport()` - Generate income reports
- `generateExpenseReport()` - Generate expense reports
- `getDashboardData()` - Get dashboard analytics
- `exportReportToPDF()` - Export reports to PDF
- `getMonthlyReport()` - Get monthly summary
- `getYearlyReport()` - Get yearly summary

#### **Notification Functions**
- `sendApprovalNotification()` - Send approval notifications
- `sendStatusUpdateNotification()` - Send status update notifications
- `scheduleReminderNotifications()` - Schedule reminder notifications
- `sendWelcomeEmail()` - Send welcome email to new users

---

## **FASE 2: FRONTEND DEVELOPMENT**

### **2.1 Setup & Konfigurasi**
- Setup React LATEST VERSION dengan Vite
- Konfigurasi TypeScript
- Setup Firebase SDK
- Setup routing dengan React Router v6
- Setup state management dengan Zustand
- Setup form handling dengan React Hook Form
- Setup UI component library (Material-UI)
- Setup Chart.js untuk grafik
- Setup ESLint + Prettier
- Setup Husky untuk git hooks

### **2.2 Design System & Color Palette**

#### **Color System untuk Dark/Light Mode:**

**Light Mode Colors:**
```css
:root {
  /* Primary Colors - Blue Theme */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;
  
  /* Secondary Colors - Gray Theme */
  --secondary-50: #f8fafc;
  --secondary-100: #f1f5f9;
  --secondary-200: #e2e8f0;
  --secondary-300: #cbd5e1;
  --secondary-400: #94a3b8;
  --secondary-500: #64748b;
  --secondary-600: #475569;
  --secondary-700: #334155;
  --secondary-800: #1e293b;
  --secondary-900: #0f172a;
  
  /* Success Colors - Green */
  --success-50: #f0fdf4;
  --success-100: #dcfce7;
  --success-500: #22c55e;
  --success-600: #16a34a;
  --success-700: #15803d;
  
  /* Warning Colors - Orange */
  --warning-50: #fffbeb;
  --warning-100: #fef3c7;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  --warning-700: #b45309;
  
  /* Error Colors - Red */
  --error-50: #fef2f2;
  --error-100: #fee2e2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  --error-700: #b91c1c;
  
  /* Background Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-sidebar: #ffffff;
  --bg-card: #ffffff;
  
  /* Text Colors */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --text-muted: #94a3b8;
  
  /* Border Colors */
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;
  --border-focus: #3b82f6;
}
```

**Dark Mode Colors:**
```css
[data-theme="dark"] {
  /* Primary Colors (adjusted for dark mode) */
  --primary-50: #1e3a8a;
  --primary-100: #1e40af;
  --primary-200: #1d4ed8;
  --primary-300: #2563eb;
  --primary-400: #3b82f6;
  --primary-500: #60a5fa;
  --primary-600: #93c5fd;
  --primary-700: #bfdbfe;
  --primary-800: #dbeafe;
  --primary-900: #eff6ff;
  
  /* Background Colors */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-sidebar: #1e293b;
  --bg-card: #1e293b;
  
  /* Text Colors */
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --text-muted: #64748b;
  
  /* Border Colors */
  --border-primary: #334155;
  --border-secondary: #475569;
  --border-focus: #60a5fa;
}
```

### **2.3 Sidebar Navigation Structure**

#### **Sidebar Layout Design:**
- **Width:** 280px (expanded), 80px (collapsed)
- **Position:** Fixed left side
- **Background:** White (light) / Dark gray (dark mode)
- **Shadow:** Subtle shadow untuk depth
- **Responsive:** Collapse to hamburger menu on mobile

#### **Sidebar Menu Items:**

**Agent Menu:**
```javascript
const agentMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'DashboardIcon',
    path: '/dashboard',
    badge: null
  },
  {
    id: 'reimbursements',
    label: 'Reimbursements',
    icon: 'ReceiptIcon',
    path: '/reimbursements',
    badge: null,
    submenu: [
      {
        id: 'my-reimbursements',
        label: 'My Reimbursements',
        path: '/reimbursements'
      },
      {
        id: 'new-reimbursement',
        label: 'New Reimbursement',
        path: '/reimbursements/new'
      }
    ]
  },
  {
    id: 'reports',
    label: 'My Reports',
    icon: 'AssessmentIcon',
    path: '/reports',
    badge: null
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'PersonIcon',
    path: '/profile',
    badge: null
  }
];
```

**Admin Menu:**
```javascript
const adminMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'DashboardIcon',
    path: '/admin/dashboard',
    badge: null
  },
  {
    id: 'reimbursements',
    label: 'Reimbursements',
    icon: 'ReceiptIcon',
    path: '/admin/reimbursements',
    badge: 'pending-count', // dynamic badge
    submenu: [
      {
        id: 'all-reimbursements',
        label: 'All Reimbursements',
        path: '/admin/reimbursements'
      },
      {
        id: 'pending-approval',
        label: 'Pending Approval',
        path: '/admin/reimbursements?status=pending',
        badge: 'pending-count'
      },
      {
        id: 'approved',
        label: 'Approved',
        path: '/admin/reimbursements?status=approved'
      },
      {
        id: 'rejected',
        label: 'Rejected',
        path: '/admin/reimbursements?status=rejected'
      }
    ]
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: 'CategoryIcon',
    path: '/admin/categories',
    badge: null
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'PeopleIcon',
    path: '/admin/users',
    badge: null
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'AssessmentIcon',
    path: '/admin/reports',
    badge: null,
    submenu: [
      {
        id: 'income-report',
        label: 'Income Report',
        path: '/admin/reports/income'
      },
      {
        id: 'expense-report',
        label: 'Expense Report',
        path: '/admin/reports/expense'
      },
      {
        id: 'monthly-report',
        label: 'Monthly Report',
        path: '/admin/reports/monthly'
      },
      {
        id: 'yearly-report',
        label: 'Yearly Report',
        path: '/admin/reports/yearly'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'SettingsIcon',
    path: '/admin/settings',
    badge: null
  }
];
```

#### **Sidebar Components:**
- `Sidebar` - Main sidebar container
- `SidebarHeader` - Logo dan toggle button
- `SidebarMenu` - Menu items container
- `SidebarMenuItem` - Individual menu item
- `SidebarSubmenu` - Submenu dropdown
- `SidebarFooter` - User profile dan logout
- `SidebarToggle` - Collapse/expand button

### **2.4 Component Architecture**

#### **Layout Components:**
- `AppLayout` - Main application layout dengan sidebar
- `Sidebar` - Navigation sidebar
- `Header` - Top header (optional, untuk mobile)
- `MainContent` - Main content area
- `PageHeader` - Page title dan breadcrumb

#### **UI Components:**
- `Button` - Customizable button dengan variants
- `Input` - Form input dengan validation
- `Select` - Dropdown select component
- `DatePicker` - Date picker component
- `FileUpload` - Drag & drop file upload
- `Modal` - Modal dialog component
- `Table` - Data table dengan sorting/filtering
- `Card` - Card container component
- `Badge` - Status badge component
- `LoadingSpinner` - Loading indicator
- `EmptyState` - Empty state component
- `Toast` - Notification toast
- `ConfirmDialog` - Confirmation dialog

#### **Feature Components:**
- `ReimbursementForm` - Form input reimburse
- `ReimbursementList` - List reimburse dengan filter
- `ReimbursementCard` - Card item reimburse
- `ReimbursementDetail` - Detail view reimburse
- `ApprovalWorkflow` - Workflow approval
- `DashboardChart` - Chart untuk dashboard
- `ReportTable` - Table untuk laporan
- `CategoryManager` - CRUD kategori
- `UserManager` - CRUD users (admin)
- `FilePreview` - Preview uploaded files

### **2.5 Pages & Routing Structure**

#### **Public Routes:**
- `/login` - Login page
- `/register` - Register page (admin only)

#### **Agent Routes:**
- `/dashboard` - Dashboard agent
- `/reimbursements` - List reimburse agent
- `/reimbursements/new` - Form input reimburse baru
- `/reimbursements/:id` - Detail reimburse
- `/reimbursements/:id/edit` - Edit reimburse
- `/reports` - Laporan agent
- `/profile` - Profile agent

#### **Admin Routes:**
- `/admin/dashboard` - Dashboard admin
- `/admin/reimbursements` - List semua reimburse
- `/admin/reimbursements/:id` - Detail reimburse untuk approval
- `/admin/categories` - Manage kategori
- `/admin/categories/new` - Tambah kategori baru
- `/admin/categories/:id/edit` - Edit kategori
- `/admin/users` - Manage users
- `/admin/users/new` - Tambah user baru
- `/admin/users/:id/edit` - Edit user
- `/admin/reports` - Generate laporan
- `/admin/reports/income` - Laporan pemasukan
- `/admin/reports/expense` - Laporan pengeluaran
- `/admin/reports/monthly` - Laporan bulanan
- `/admin/reports/yearly` - Laporan tahunan
- `/admin/settings` - Application settings

### **2.6 State Management (Zustand Stores)**

#### **Auth Store:**
```javascript
{
  user: User | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  login: (email, password) => Promise<void>,
  logout: () => Promise<void>,
  register: (userData) => Promise<void>,
  updateProfile: (data) => Promise<void>
}
```

#### **Reimbursement Store:**
```javascript
{
  reimbursements: Reimbursement[],
  currentReimbursement: Reimbursement | null,
  isLoading: boolean,
  filters: FilterState,
  fetchReimbursements: () => Promise<void>,
  createReimbursement: (data) => Promise<void>,
  updateReimbursement: (id, data) => Promise<void>,
  deleteReimbursement: (id) => Promise<void>,
  approveReimbursement: (id, comments) => Promise<void>,
  rejectReimbursement: (id, reason) => Promise<void>,
  setFilters: (filters) => void
}
```

#### **Category Store:**
```javascript
{
  categories: Category[],
  isLoading: boolean,
  fetchCategories: () => Promise<void>,
  createCategory: (data) => Promise<void>,
  updateCategory: (id, data) => Promise<void>,
  deleteCategory: (id) => Promise<void>
}
```

#### **UI Store:**
```javascript
{
  theme: 'light' | 'dark',
  sidebarCollapsed: boolean,
  isLoading: boolean,
  notifications: Notification[],
  setTheme: (theme) => void,
  toggleSidebar: () => void,
  setLoading: (loading) => void,
  addNotification: (notification) => void,
  removeNotification: (id) => void
}
```

### **2.7 Features Implementation**

#### **Authentication & Authorization:**
- Firebase Auth integration
- Role-based routing protection
- Auto-logout on token expiry
- Remember me functionality
- Password reset functionality

#### **Reimbursement Management:**
- CRUD operations untuk reimburse
- File upload dengan drag & drop
- Real-time status updates
- Form validation dengan React Hook Form
- Bulk operations (approve/reject multiple)
- Search dan filtering
- Export functionality

#### **Dashboard & Analytics:**
- Chart.js integration untuk grafik
- Real-time data updates
- Responsive charts
- Key metrics cards
- Recent activities feed
- Quick actions

#### **Reporting System:**
- Filter by date range, category, status
- Export to PDF/Excel
- Print functionality
- Scheduled reports
- Email reports
- Custom date ranges

#### **Theme Management:**
- Dark/Light mode toggle
- Persist theme preference di localStorage
- Smooth theme transitions
- System theme detection
- Custom theme colors

#### **File Management:**
- Upload multiple files
- File type validation
- File size limits
- Image preview
- File download
- File deletion

---

## **TEKNOLOGI STACK**

### **Backend:**
- Firebase Authentication
- Firestore Database
- Firebase Storage
- Firebase Functions (Node.js)
- Firebase Security Rules
- Firebase Hosting

### **Frontend:**
- React LATEST VERSION dengan Vite
- TypeScript
- React Router v6
- Zustand untuk state management
- React Hook Form + Yup validation
- Material-UI (MUI) untuk components
- Chart.js untuk grafik
- Firebase SDK
- React Query untuk data fetching

### **Development Tools:**
- ESLint + Prettier
- Husky untuk git hooks
- Jest + React Testing Library
- Storybook untuk component documentation
- Vite untuk build tool
- TypeScript untuk type safety

### **Deployment:**
- Firebase Hosting untuk frontend
- Firebase Functions untuk backend
- GitHub Actions untuk CI/CD
- Environment variables management

---

## **STRUKTUR FOLDER PROYEK**

```
accounting_app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── layout/       # Layout components (Sidebar, Header)
│   │   ├── forms/        # Form components
│   │   └── features/     # Feature-specific components
│   ├── pages/
│   │   ├── auth/         # Login, Register pages
│   │   ├── agent/        # Agent pages
│   │   └── admin/        # Admin pages
│   ├── stores/           # Zustand stores
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   ├── constants/        # App constants
│   ├── styles/           # Global styles, themes
│   └── assets/           # Images, icons
├── firebase/             # Firebase configuration
├── docs/                 # Documentation
└── tests/                # Test files
```

---

## **TIMELINE PENGEMBANGAN**

### **Fase 1 - Backend (2-3 minggu):**
- Minggu 1: Setup Firebase, Database Schema, Basic Functions
- Minggu 2: Authentication, Reimbursement Functions, Security Rules
- Minggu 3: Reporting Functions, Notification System, Testing

### **Fase 2 - Frontend (3-4 minggu):**
- Minggu 1: Setup Project, Design System, Basic Components
- Minggu 2: Authentication Pages, Dashboard, Sidebar Navigation
- Minggu 3: Reimbursement Management, Forms, File Upload
- Minggu 4: Reporting System, Admin Features, Testing & Polish

### **Total Estimasi: 5-7 minggu**

---

## **CATATAN PENTING**

1. **Security:** Pastikan Firebase Security Rules dikonfigurasi dengan benar untuk mencegah unauthorized access
2. **Performance:** Implementasi pagination untuk data yang besar dan lazy loading untuk components
3. **Testing:** Unit tests untuk critical functions dan integration tests untuk user flows
4. **Documentation:** Maintain API documentation dan component documentation dengan Storybook
5. **Monitoring:** Setup error tracking dan performance monitoring
6. **Backup:** Regular backup strategy untuk Firestore data
7. **Scalability:** Design dengan scalability in mind untuk future enhancements

---

*Dokumen ini akan diupdate sesuai dengan perkembangan pengembangan aplikasi.*
