import { FieldDef } from "types/integration";

/* =============================================================
   BUILT-IN NODE SCHEMAS
   -------------------------------------------------------------
   Each entry declares how to render the form for a given
   node type. Fields write into either node.data (root="data")
   or node.data.config (root="config") depending on what the
   backend nodeHandler expects.

   NOTE: complex node types (auto_reply, list, carousel) keep
   their custom editors (AutoReplyEditor) — they're not in
   this registry.
============================================================= */

export interface NodeSchema {
  fields: FieldDef[];
  /** Where the fields are stored on the node:
   *   - "data"   → node.data.<key>            (default)
   *   - "config" → node.data.config.<key>     (api_request, razorpay_payment, etc.)
   */
  root?: "data" | "config";
}

const f = {
  text: (key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef => ({
    key, label, type: "text", required: false, isSecret: false, supportsInterpolation: true, ...opts,
  }),
  textarea: (key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef => ({
    key, label, type: "textarea", required: false, isSecret: false, supportsInterpolation: true, ...opts,
  }),
  number: (key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef => ({
    key, label, type: "number", required: false, isSecret: false, supportsInterpolation: true, ...opts,
  }),
  url: (key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef => ({
    key, label, type: "url", required: false, isSecret: false, supportsInterpolation: true, ...opts,
  }),
  select: (key: string, label: string, options: string[], opts: Partial<FieldDef> = {}): FieldDef => ({
    key, label, type: "select", required: false, isSecret: false, options, ...opts,
  }),
  kv: (key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef => ({
    key, label, type: "key_value", required: false, isSecret: false, supportsInterpolation: true, ...opts,
  }),
  json: (key: string, label: string, opts: Partial<FieldDef> = {}): FieldDef => ({
    key, label, type: "json", required: false, isSecret: false, ...opts,
  }),
};

export const NODE_SCHEMAS: Record<string, NodeSchema> = {
  /* ─── ask_location ─── */
  ask_location: {
    root: "data",
    fields: [
      f.textarea("message", "Prompt Message", {
        required: true,
        defaultValue: "📍 Please share your location",
        helperText: "What we ask the contact to send.",
      }),
      f.text("save_to", "Save As Variable", {
        defaultValue: "address",
        helperText: "Use {{<this>.fullAddress}} / {{<this>.latitude}} downstream.",
        supportsInterpolation: false,
      }),
    ],
  },

  /* ─── address_message (interactive WA address message) ─── */
  address_message: {
    root: "data",
    fields: [
      f.textarea("message", "Prompt Message", {
        required: true,
        defaultValue: "📍 Please enter your delivery address",
      }),
      f.text("save_to", "Save As Variable", {
        defaultValue: "address",
        supportsInterpolation: false,
      }),
    ],
  },

  /* ─── distance_check ─── */
  distance_check: {
    root: "data",
    fields: [
      f.text("reference_lat", "Reference Latitude", {
        required: true,
        placeholder: "e.g. 28.6139",
        supportsInterpolation: false,
      }),
      f.text("reference_lng", "Reference Longitude", {
        required: true,
        placeholder: "e.g. 77.2090",
        supportsInterpolation: false,
      }),
      f.number("max_distance_km", "Max Distance (km)", {
        required: true,
        defaultValue: 10,
        helperText:
          "Routes IN_RANGE if distance ≤ this, else OUT_OF_RANGE. Use these as edge conditions.",
      }),
    ],
  },

  /* ─── call_to_action (URL button message) ─── */
  call_to_action: {
    root: "data",
    fields: [
      f.textarea("message", "Body Message", {
        required: true,
        defaultValue: "Tap the button below 👇",
      }),
      f.text("button_text", "Button Text", { defaultValue: "Open Link" }),
      f.url("url", "URL", {
        required: true,
        placeholder: "https://example.com or {{payment.short_url}}",
      }),
    ],
  },

  /* ─── api_request ─── */
  api_request: {
    root: "config",
    fields: [
      f.url("url", "Request URL", {
        required: true,
        placeholder: "https://api.example.com/endpoint",
      }),
      f.select("method", "HTTP Method", ["GET", "POST", "PUT", "PATCH", "DELETE"], {
        required: true,
        defaultValue: "GET",
      }),
      f.kv("headers", "Headers", {
        helperText: "Header name = value (supports {{variables}}).",
      }),
      f.json("body", "Body", {
        helperText: "JSON body. Supports {{variables}} when serialized.",
      }),
      f.kv("response_map", "Save Response Fields", {
        helperText:
          "Left = variable name to save · Right = JSON path (e.g. data.user.name). Access later via {{<varname>}}.",
      }),
    ],
  },

  /* ─── single_product ─── */
  single_product: {
    root: "data",
    fields: [
      f.text("catalog_id", "Catalog ID", { required: true, supportsInterpolation: false }),
      f.text("product_retailer_id", "Product Retailer ID", {
        required: true,
        placeholder: "e.g. SKU_123 or {{product_id}}",
      }),
      f.textarea("body", "Body Message", { defaultValue: "Check out this product 👇" }),
      f.text("footer", "Footer", { placeholder: "Optional" }),
    ],
  },

  /* ─── product_list ─── */
  product_list: {
    root: "data",
    fields: [
      f.text("catalog_id", "Catalog ID", { required: true, supportsInterpolation: false }),
      f.text("header", "Header", { placeholder: "Optional" }),
      f.textarea("body", "Body Message", {
        required: true,
        defaultValue: "Browse our products 👇",
      }),
      f.text("footer", "Footer", { placeholder: "Optional" }),
      f.json("sections", "Sections (JSON)", {
        helperText:
          'Format: [{"title":"Combo","rows":[{"product_retailer_id":"SKU_1"}]}]',
        defaultValue: [
          { title: "Featured", rows: [{ product_retailer_id: "" }] },
        ],
      }),
    ],
  },

  /* ─── send_flow ─── */
  send_flow: {
    root: "data",
    fields: [
      f.text("flow_id", "Flow ID", { required: true, supportsInterpolation: false }),
      f.text("header", "Header", { defaultValue: "Welcome" }),
      f.textarea("body", "Body", { defaultValue: "Please continue" }),
      f.text("cta", "Button Text", { defaultValue: "Continue" }),
      f.text("startScreen", "Start Screen", {
        placeholder: "Optional — Flow screen ID to start on",
        supportsInterpolation: false,
      }),
      f.text("save_to", "Save Response As", {
        defaultValue: "flow_data",
        supportsInterpolation: false,
      }),
    ],
  },

  /* ─── razorpay_payment (legacy node — uses config.*) ─── */
  razorpay_payment: {
    root: "config",
    fields: [
      f.number("item_amount", "Item Amount (₹)", {
        required: true,
        placeholder: "{{cart_total}} or 499",
      }),
      f.number("delivery_amount", "Delivery Amount (₹)", { defaultValue: 0 }),
      f.text("description", "Description", { defaultValue: "Payment" }),
    ],
  },

  /* ─── payment_summary (legacy — config.title/rows[]/button_text) ─── */
  payment_summary: {
    root: "config",
    fields: [
      f.text("title", "Title", { required: true, defaultValue: "Order Summary" }),
      f.json("rows", "Summary Rows (JSON)", {
        helperText:
          'Format: [{"label":"Subtotal","value":"₹{{cart_total}}"}, …]',
        defaultValue: [
          { label: "Subtotal", value: "₹{{payment.item_amount}}" },
          { label: "Delivery", value: "₹{{payment.delivery_amount}}" },
        ],
      }),
      f.text("button_text", "Pay Button Text", { defaultValue: "Pay Now 💳" }),
    ],
  },

  /* ─── borzo_delivery (legacy — pickup/drop are nested but we flatten) ─── */
  borzo_delivery: {
    root: "data",
    fields: [
      f.select(
        "borzo_action",
        "Action",
        ["calculate", "create", "track", "cancel", "get_order"],
        { required: true, defaultValue: "create" }
      ),
      f.number("vehicle_type_id", "Vehicle Type ID", {
        defaultValue: 7,
        helperText: "1 = Bike, 7 = Auto, 8 = Van",
      }),
      f.text("order_id", "Order ID (track/cancel/get)", {
        placeholder: "{{borzo_order.order_id}}",
        helperText: "Required for track / cancel / get_order.",
      }),
      f.text("save_to", "Save Response As", {
        defaultValue: "borzo_amount",
        supportsInterpolation: false,
      }),
    ],
  },

  /* ─── send_template (basic — name + language) ─── */
  send_template: {
    root: "data",
    fields: [
      f.text("template_name", "Template Name", {
        required: true,
        helperText: "Approved WhatsApp template name on this channel.",
        supportsInterpolation: false,
      }),
      f.text("language", "Language Code", { defaultValue: "en_US", supportsInterpolation: false }),
      f.json("body_params", "Body Variables (JSON array)", {
        helperText: 'e.g. ["{{contact.name}}", "{{order_id}}"] — order matches {{1}}, {{2}} etc.',
        defaultValue: [],
      }),
    ],
  },
};

export const hasBuiltinSchema = (type: string) => Boolean(NODE_SCHEMAS[type]);
