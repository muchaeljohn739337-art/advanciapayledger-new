export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  subdomain: string;
  status: TenantStatus;
  plan: BillingPlan;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  joinedAt: Date;
  tenant?: Tenant;
  user?: any;
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL'
}

export enum BillingPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

export enum TenantRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export interface CreateTenantRequest {
  name: string;
  subdomain: string;
  domain?: string;
  plan?: BillingPlan;
  settings?: Record<string, any>;
}

export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  status?: TenantStatus;
  plan?: BillingPlan;
  settings?: Record<string, any>;
}

export interface AddTenantUserRequest {
  userId: string;
  role: TenantRole;
}

export interface UpdateTenantUserRequest {
  role?: TenantRole;
}
