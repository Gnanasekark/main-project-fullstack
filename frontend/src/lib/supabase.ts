
export type AppRole = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  mobile_number: string | null;
  reg_no: string | null;
  degree: string | null;
  branch: string | null;
  year: string | null;
  section: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Form {
  id: string;
  title: string;
  description: string | null;
  config: {
    fields: FormField[];
  };
  original_filename: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'textarea' | 'date' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface FormAssignment {
  id: string;
  form_id: string;
  assigned_to_user_id: string | null;
  assigned_to_group_id: string | null;
  due_date: string | null;
  reminder_interval_hours: number;
  reminder_trigger_time: string;
  last_reminder_sent_at: string | null;
  assigned_by: string;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  user_id: string;
  submission_data: Record<string, unknown>;
  submitted_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  degree: string | null;
  branch: string | null;
  year: string | null;
  section: string | null;
  is_auto_generated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  channel: 'email' | 'whatsapp' | 'in_app';
  status: 'pending' | 'sent' | 'failed';
  related_form_id: string | null;
  is_read: boolean;
  sent_at: string | null;
  created_at: string;
}
