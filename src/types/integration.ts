export type FieldType =
  | "text"
  | "password"
  | "select"
  | "url"
  | "email"
  | "textarea"
  | "number"
  | "boolean"
  | "json"
  | "key_value";

export type IntegrationCategory =
  | "payments"
  | "logistics"
  | "crm"
  | "productivity"
  | "ecommerce"
  | "communication"
  | "other";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  isSecret?: boolean;
  options?: string[];
  placeholder?: string;
  helperText?: string;
  defaultValue?: any;
  supportsInterpolation?: boolean;
  fixedKeys?: string[];
  visibleWhen?: { field: string; equals: any | any[] };
}

export interface OutputDef {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
}

export interface ActionDef {
  key: string;
  label: string;
  description: string;
  configSchema: FieldDef[];
  outputSchema?: OutputDef[];
  channelTypes?: string[];
}

export interface TriggerDef {
  key: string;
  label: string;
  description: string;
  configSchema?: FieldDef[];
  outputSchema?: OutputDef[];
  webhookEvent?: string;
}

export interface IntegrationDefinition {
  slug: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  color: string;
  bgColor: string;
  icon?: string;
  available: boolean;
  fields: FieldDef[];
  actions: ActionDef[];
  triggers: TriggerDef[];
  order?: number;
  connectInfo?: string;
  docsUrl?: string;
  /** Added by /catalog endpoint when channel_id is supplied */
  connected?: boolean;
}

export interface BuiltinTriggerDef {
  key: string;
  label: string;
  description: string;
  icon: string;
  channelTypes: string[];
  configSchema?: FieldDef[];
}

export interface IntegrationT {
  _id: string;
  slug: string;
  channel_id: string;
  is_active: boolean;
  config: Record<string, any>;
  account_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
