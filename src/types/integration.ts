export interface IntegrationT {
  _id: string;
  slug: string;
  is_active: boolean;
  config: Record<string, any>;
  account_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
