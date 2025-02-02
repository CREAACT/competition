export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  message_type: 'text' | 'voice';
  voice_url?: string;
  voice_duration?: number;
  waveform?: number[];
  created_at: string;
  read_at?: string | null;
  edited_at?: string | null;
  deleted_at?: string | null;
  deleted_for_all?: boolean | null;
}