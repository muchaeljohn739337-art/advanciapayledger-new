export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FACILITY_ADMIN = 'FACILITY_ADMIN',
  FACILITY_STAFF = 'FACILITY_STAFF',
  BILLING_MANAGER = 'BILLING_MANAGER',
  PATIENT = 'PATIENT',
  SUPPORT_AGENT = 'SUPPORT_AGENT'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  totpEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}
