export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  message_type: 'text';
  read_at?: string;
  edited_at?: string;
  deleted_at?: string;
  deleted_for_all?: boolean;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  receiver?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}