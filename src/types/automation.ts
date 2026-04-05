export interface AutomationT {
  _id: string;

  name: string;
  channel_name: string;

  status: "active" | "paused";

  channel_id: {
    _id: string;
    name: string;
    phone_number?: string;
  };

  account_id: string;

  trigger: "new_message_received";

  is_fallback_automation: boolean;

  automation_type: "builder";

  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
