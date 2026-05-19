export type UserRole = 'admin' | 'collaborator' | 'client';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  assigned_admin_id?: number;
  user_id?: number; // linked user account
  created_at: string;
}

export interface Project {
  id: number;
  client_id: number;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_at: string;
  client_name?: string;
}

export interface CollaborationAssignment {
  id: number;
  collaborator_id: number;
  project_id: number;
  role_in_project?: string;
  collaborator_name?: string;
}

export interface Task {
  id: number;
  project_id: number;
  assigned_to?: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  due_date?: string;
  created_at: string;
  project_name?: string;
  assigned_name?: string;
}

export type ContentType = 'copy' | 'video' | 'script' | 'creative' | 'campaign_material';
export type ContentStatus = 'draft' | 'review' | 'approved' | 'published';

export interface ContentItem {
  id: number;
  project_id: number;
  title: string;
  type: ContentType;
  link_url?: string;
  description?: string;
  status: ContentStatus;
  scheduled_date?: string;
  created_at: string;
  project_name?: string;
}

export interface CalendarEvent {
  id: number;
  project_id?: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  event_type: 'content' | 'task' | 'meeting' | 'deadline' | 'campaign';
  created_at: string;
  project_name?: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: number;
  client_id: number;
  project_id?: number;
  invoice_number: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  issued_date: string;
  notes?: string;
  client_name?: string;
  project_name?: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount_paid: number;
  payment_date: string;
  method?: string;
  notes?: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuoteItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Quote {
  id: number;
  client_id: number;
  project_id?: number;
  title: string;
  description?: string;
  items_json: string;
  total_amount: number;
  status: QuoteStatus;
  valid_until?: string;
  created_at: string;
  client_name?: string;
  project_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'task' | 'content' | 'invoice' | 'quote' | 'comment' | 'system';
  is_read: number;
  related_entity_type?: string;
  related_entity_id?: number;
  created_at: string;
}

export interface Comment {
  id: number;
  project_id?: number;
  content_item_id?: number;
  author_id: number;
  message: string;
  created_at: string;
  author_name?: string;
  author_role?: string;
}

export interface ModulePermission {
  id: number;
  user_id: number;
  module_name: string;
  is_visible: number;
}

export interface PaymentReminder {
  id: number;
  invoice_id: number;
  triggered_by: number;
  trigger_date: string;
  notes?: string;
  status: 'pending' | 'sent';
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
}
