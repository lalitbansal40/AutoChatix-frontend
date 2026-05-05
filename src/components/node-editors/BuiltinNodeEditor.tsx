import { Box, Typography, Stack, Avatar, Alert } from "@mui/material";
import { useEffect } from "react";
import { DynamicFieldForm } from "components/integrations/DynamicFieldRenderer";
import { NODE_SCHEMAS } from "./node-schemas";

const NODE_META: Record<string, { color: string; bg: string; icon: string; label: string; desc?: string }> = {
  ask_location:    { color: "#0ea5e9", bg: "#f0f9ff", icon: "📍", label: "Ask Location",    desc: "Request the contact's live location." },
  address_message: { color: "#0ea5e9", bg: "#f0f9ff", icon: "🏠", label: "Address Message", desc: "Native WhatsApp address form." },
  distance_check:  { color: "#6366f1", bg: "#eef2ff", icon: "📏", label: "Distance Check",  desc: "Branch flow by distance from a reference point." },
  call_to_action:  { color: "#0891b2", bg: "#ecfeff", icon: "🔗", label: "Call To Action",  desc: "Send a message with a URL button." },
  api_request:     { color: "#7c3aed", bg: "#f5f3ff", icon: "🌐", label: "API Request",     desc: "Call an external API and store the response." },
  single_product:  { color: "#db2777", bg: "#fdf2f8", icon: "🛒", label: "Single Product",  desc: "Send one product card from your catalog." },
  product_list:    { color: "#db2777", bg: "#fdf2f8", icon: "🛍️", label: "Product List",    desc: "Send a multi-product message from your catalog." },
  send_flow:       { color: "#0d9488", bg: "#f0fdfa", icon: "🌊", label: "Send Flow",       desc: "Trigger a WhatsApp Flow." },
  razorpay_payment:{ color: "#2563eb", bg: "#eff6ff", icon: "💳", label: "Razorpay Payment",desc: "Generate a Razorpay payment link." },
  payment_summary: { color: "#2563eb", bg: "#eff6ff", icon: "🧾", label: "Payment Summary", desc: "Show order summary + Pay button." },
  borzo_delivery:  { color: "#dc2626", bg: "#fef2f2", icon: "🚚", label: "Borzo Delivery",  desc: "Calculate, create or track a Borzo order." },
  send_template:   { color: "#16a34a", bg: "#f0fdf4", icon: "📨", label: "Send Template",   desc: "Send an approved WhatsApp template." },
};

const BuiltinNodeEditor = ({
  node,
  updateNodeData,
}: {
  node: any;
  updateNodeData: (id: string, data: any) => void;
}) => {
  const data = node.data || {};
  const type: string = data.type;
  const schema = NODE_SCHEMAS[type];
  const meta = NODE_META[type];

  // Hydrate defaults on first open
  useEffect(() => {
    if (!schema) return;
    const root = schema.root || "data";
    const current = root === "config" ? data.config || {} : data;
    let touched = false;
    const next: Record<string, any> = { ...current };
    for (const f of schema.fields) {
      if (next[f.key] === undefined && f.defaultValue !== undefined) {
        next[f.key] = f.defaultValue;
        touched = true;
      }
    }
    if (touched) {
      if (root === "config") updateNodeData(node.id, { config: next });
      else updateNodeData(node.id, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  if (!schema) {
    return (
      <Alert severity="info" sx={{ borderRadius: "8px" }}>
        No editor available for node type <strong>{type}</strong>.
      </Alert>
    );
  }

  const root = schema.root || "data";
  const values: Record<string, any> = root === "config" ? data.config || {} : data;

  const handleChange = (next: Record<string, any>) => {
    if (root === "config") {
      updateNodeData(node.id, { config: next });
    } else {
      // Prevent the form from clobbering React-Flow-injected internals.
      const { setMenuAnchor, onDelete, disconnectRow, _updatedAt, ...rest } = next;
      updateNodeData(node.id, rest);
    }
  };

  return (
    <Stack spacing={2}>
      {meta && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Avatar
            sx={{
              bgcolor: meta.bg,
              color: meta.color,
              width: 38,
              height: 38,
              borderRadius: 2,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {meta.icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography fontSize={14} fontWeight={700}>{meta.label}</Typography>
            {meta.desc && (
              <Typography fontSize={11.5} color="text.secondary">{meta.desc}</Typography>
            )}
          </Box>
        </Box>
      )}

      <DynamicFieldForm schema={schema.fields} values={values} onChange={handleChange} />
    </Stack>
  );
};

export default BuiltinNodeEditor;
