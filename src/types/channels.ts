export interface ChannelT {
  _id: string;
  channel_name: string;
  phone_number_id: string;
  display_phone_number: string;
  account_id: string;
  is_active: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  __v: number;
}