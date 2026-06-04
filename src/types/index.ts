export type Role = "ADMIN" | "MANAGER" | "USER";
export type ClientStatus = "ACTIVE" | "INACTIVE" | "PROSPECT" | "CHURNED";
export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "CANCELLED"
  | "ON_HOLD";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type InvoiceStatus = "DRAFT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type PaymentMethod = "BANK_TRANSFER" | "CREDIT_CARD" | "PIX" | "BOLETO" | "CHECK";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  role: Role;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  notes?: string;
  status: ClientStatus;
  contractValue?: number;
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];
  invoices?: Invoice[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  clientId: string;
  managerId?: string;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  manager?: User;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date;
  completedAt?: Date;
  projectId: string;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  assignee?: User;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  amount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: Date;
  reference?: string;
  notes?: string;
  createdAt: Date;
}

export interface CampaignMetric {
  id: string;
  projectId: string;
  date: Date;
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
}

export interface KPIData {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: "up" | "down" | "neutral";
}

export interface ChartDataPoint {
  month: string;
  receita: number;
  despesas: number;
  lucro: number;
}
