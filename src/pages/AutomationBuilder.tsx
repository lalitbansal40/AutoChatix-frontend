import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Chip,
  Stack,
  Tooltip,
  Alert,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SaveIcon from "@mui/icons-material/Save";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  addEdge, Connection, Handle, Position, NodeProps
} from "reactflow";
import "reactflow/dist/style.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import automationService from "service/automation.service";
import { contactAttributeService, ContactAttribute } from "service/contactAttribute.service";
import * as dagre from "dagre";
import NodeOpenPopup from "components/NodeOpenPopup";
import { MarkerType } from "reactflow";
import {
  Dialog, DialogContent, DialogTitle, DialogActions,
  TextField, Avatar, Divider, Select, FormControl, InputLabel,
} from "@mui/material";
import CustomEdge from "components/customedge";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useIntegrationCatalog } from "hooks/useIntegrationCatalog";
import { IntegrationDefinition } from "types/integration";
import ImportAutomationModal from "components/ImportAutomationModal";
import automationLibraryService from "service/automationLibrary.service";
import useAuth from "hooks/useAuth";
import { cloneReactFlowNodes } from "utils/automationIdRemapper";


type CustomNodeData = {
  id: string;
  type: string;
  label?: string;
  message?: string;
  buttons?: any[];
  [key: string]: any;
};

type WebhookMapping = {
  source_path: string;
  attribute_key: string;
};

const flattenPayloadPaths = (value: any, prefix = ""): string[] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      const nested = flattenPayloadPaths(child, next);
      return nested.length ? nested : [next];
    }
    return [next];
  });
};

const edgeTypes = {
  custom: CustomEdge,
};

const getCarouselButtonHandles = (data: any) => {
  if (data?.type !== "carousel" || !Array.isArray(data.cards)) return [];

  return data.cards.flatMap((card: any, cardIndex: number) =>
    (Array.isArray(card.buttons) ? card.buttons : [])
      .filter((button: any) => button?.id && button?.title)
      .map((button: any, buttonIndex: number) => ({
        ...button,
        cardId: card.id,
        cardIndex,
        buttonIndex,
        cardBody: card.body,
      })),
  );
};

const getConditionBranchHandles = (data: any) => {
  if (data?.type !== "condition_router" || !Array.isArray(data.branches)) return [];
  return data.branches;
};

const getPaymentStatusHandles = (data: any) => {
  if (data?.type !== "whatsapp_payment") return [];
  return [
    { id: "PAYMENT_SUCCESS", title: "Paid", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { id: "PAYMENT_FAILED", title: "Failed", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  ];
};

/* =========================
   NODE CONFIG
========================= */
const NODE_CONFIG: any = {
  trigger: {
    conditions: {
      match_type: "contains",
      keywords: [],
    },
  },
  condition_router: {
    branches: [
      { id: "branch_if_1", label: "Branch 1", logic: "AND", is_default: false, conditions: [{ variable: "", operator: "==", value: "" }] },
      { id: "branch_else", label: "Else",     logic: "AND", is_default: true,  conditions: [] },
    ],
  },

  set_contact_attribute: {
    attribute_name: "",
    attribute_value: "",
  },

  auto_reply: {
    message: "",
    buttons: [],
    list: [],
  },

  ask_input: {
    message: "Please enter your response 👇",
    input_type: "text",
    save_to: "response",
  },

  ask_location: {
    message: "",
    save_to: "address",
  },

  address_message: {
    message: "",
  },

  distance_check: {
    reference_lat: "",
    reference_lng: "",
    max_distance_km: 10,
  },

  google_sheet: {
    integration_slug: "google_sheet",
    spreadsheet_id: "",
    sheet_name: "",
    action: "create",
    map: {},
  },

  api_request: {
    config: {
      method: "GET",
      url: "",
      headers: {},
      params: {},
      body: {},
      response_map: {},
    },
  },

  ai_response: {
    config: {
      ai_config_id: "",
      input_variable: "last_message",
      save_to: "ai_response",
      send_to_user: true,
    },
  },

  send_template: {
    template_name: "",
    language: "en_US",
    body_params: [],
  },

  broadcast_message: {
    send_mode: "text",
    numbers: "",
    message: "",
    template_name: "",
    language: "en_US",
    body_params: [],
  },

  razorpay_payment: {
    config: {
      use_last_order: false,
      manual_items: [{ name: "Item", qty: "1", price: "" }],
      additional_rows: [],
      manual_message: "Please complete your payment below.",
      button_text: "Pay Now",
      summary_key: "payment_summary",
      description: "Payment",
    },
  },

  whatsapp_payment: {
    config: {
      use_last_order: false,
      manual_items: [{ name: "Item", qty: "1", price: "" }],
      additional_rows: [],
      currency: "INR",
      payment_type: "digital-goods",
      payment_method: "razorpay",
      razorpay_config_name: "",
      razorpay_receipt: "",
      tax_mode: "percent",
      tax_amount: "",
      tax_description: "Tax",
      discount_mode: "amount",
      discount_amount: "",
      discount_description: "Discount",
      reference_id: "",
      body: "Here is your order summary. Tap to review and pay. 💳",
      footer: "",
      save_to: "wa_payment",
    },
  },

  update_order: {
    config: {
      order_id: "",
      order_status: "",
      payment_status: "",
      payment_type: "",
      delivery_name: "",
      delivery_phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      shipping_method: "",
      shipping_fee: "",
      courier_name: "",
      tracking_id: "",
      payment_reference: "",
      customer_note: "",
      internal_note: "",
      save_to: "updated_order",
    },
  },

  borzo_delivery: {
    borzo_action: "calculate",
    pickup: {},
    drop: {},
  },

  single_product: {
    catalog_id: "",
    product_retailer_id: "",
    body: "Check out this product 👇",
  },

  product_list: {
    catalog_id: "",
    header: "",
    body: "Browse our products 👇",
    sections: [{ title: "Featured", rows: [{ product_retailer_id: "" }] }],
  },

  eval: {
    code: "// Write JavaScript here.\n// Available: vars, setVar(key, val), getVar(key)\n// send.text(msg)  send.buttons(msg, [{id,title}])\n// send.list(body, btnText, sections)  send.image(url, caption)\n// fetch(url)  goto(nodeId)  Math  JSON\n",
  },

  delay: {
    delay_duration: { value: 1, unit: "hours" },
  },
};

/* =========================
   DAGRE LAYOUT
========================= */
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR" });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    node.position = {
      x: pos.x - 110,
      y: pos.y - 50,
    };
  });

  return { nodes, edges };
};

/* ── per-node-type visual config ── */
const NODE_STYLE: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  trigger: { color: "#f97316", bg: "#fff7ed", icon: "⚡", label: "Trigger" },
  auto_reply: { color: "#25D366", bg: "#f0fdf4", icon: "💬", label: "Auto Reply" },
  list: { color: "#2563eb", bg: "#eff6ff", icon: "📋", label: "List" },
  carousel: { color: "#ec4899", bg: "#fdf2f8", icon: "🎠", label: "Carousel" },
  ask_input: { color: "#8b5cf6", bg: "#f5f3ff", icon: "✏️", label: "Ask Input" },
  ask_location: { color: "#0ea5e9", bg: "#f0f9ff", icon: "📍", label: "Ask Location" },
  address_message: { color: "#0ea5e9", bg: "#f0f9ff", icon: "🏠", label: "Address" },
  set_contact_attribute: { color: "#f59e0b", bg: "#fffbeb", icon: "🏷️", label: "Set Attribute" },
  google_sheet: { color: "#16a34a", bg: "#f0fdf4", icon: "📊", label: "Google Sheets" },
  razorpay_payment: { color: "#2563eb", bg: "#eff6ff", icon: "💳", label: "Razorpay" },
  whatsapp_payment: { color: "#25D366", bg: "#f0fdf4", icon: "💰", label: "WA Payment" },
  update_order: { color: "#0f766e", bg: "#f0fdfa", icon: "📦", label: "Update Order" },
  borzo_delivery: { color: "#dc2626", bg: "#fef2f2", icon: "🚚", label: "Borzo" },
  distance_check: { color: "#6366f1", bg: "#eef2ff", icon: "📏", label: "Distance" },
  integration_action: { color: "#0891b2", bg: "#ecfeff", icon: "🔌", label: "Integration" },
  api_request: { color: "#7c3aed", bg: "#f5f3ff", icon: "🌐", label: "API Request" },
  ai_response: { color: "#f59e0b", bg: "#fffbeb", icon: "🤖", label: "AI Response" },
  send_template: { color: "#16a34a", bg: "#f0fdf4", icon: "📨", label: "Send Template" },
  broadcast_message: { color: "#0f766e", bg: "#f0fdfa", icon: "📣", label: "Send WhatsApp Notification" },
  single_product:     { color: "#db2777", bg: "#fdf2f8", icon: "🛒", label: "Single Product" },
  product_list:       { color: "#db2777", bg: "#fdf2f8", icon: "🛍️", label: "Product List" },
  condition_router:   { color: "#d97706", bg: "#fffbeb", icon: "🔀", label: "Condition Router" },
  eval:               { color: "#7c3aed", bg: "#f5f3ff", icon: "⚡️", label: "Eval (Code)" },
  delay:              { color: "#0891b2", bg: "#ecfeff", icon: "⏱️", label: "Delay" },
};
const DEFAULT_STYLE = { color: "#6b7280", bg: "#f9fafb", icon: "⚙️", label: "Node" };

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const genId = (len = 16) =>
  Array.from({ length: len }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join("");

const CustomNode = React.memo(({ data, id }: NodeProps<CustomNodeData>) => {
  const { disconnectRow } = data;
  const ns = NODE_STYLE[data.type] || DEFAULT_STYLE;
  const carouselButtons = getCarouselButtonHandles(data);
  const paymentStatusHandles = getPaymentStatusHandles(data);
  const conditionBranches = getConditionBranchHandles(data);
  const BRANCH_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#0ea5e9"];

  return (
    <Box
      sx={{
        borderRadius: "10px",
        background: "#fff",
        minWidth: 240,
        maxWidth: 280,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        border: "1px solid #e5e7eb",
        borderLeft: `4px solid ${ns.color}`,
        overflow: "visible",
      }}
    >
      {/* ── HEADER ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 1.5,
          pt: 1.25,
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box sx={{
            width: 22, height: 22, borderRadius: "6px",
            bgcolor: ns.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12,
          }}>
            {ns.icon}
          </Box>
          <Typography
            sx={{ fontSize: 11, fontWeight: 700, color: ns.color, letterSpacing: 0.4, textTransform: "uppercase" }}
          >
            {ns.label}
          </Typography>
        </Box>

        {data.type !== "trigger" && (
          <IconButton
            size="small"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); data.setMenuAnchor?.(e.currentTarget); }}
            sx={{ p: 0.25, color: "#9ca3af", "&:hover": { color: "#374151" } }}
          >
            <MoreVertIcon sx={{ fontSize: 15 }} />
          </IconButton>
        )}
      </Box>

      {/* ── DIVIDER ── */}
      <Box sx={{ height: "1px", bgcolor: "#f3f4f6", mx: 1.5 }} />

      {/* ── BODY ── */}
      <Box sx={{ px: 1.5, py: 1 }}>

        {/* TRIGGER META (integration trigger) */}
        {data.type === "trigger" && data.trigger_meta?.slug && (
          <Box sx={{ bgcolor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 1.5, px: 1, py: 0.5 }}>
            <Typography fontSize={10.5} color="#c2410c" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
              {data.trigger_meta.slug}
            </Typography>
            <Typography fontSize={11} color="#9a3412" sx={{ mt: 0.25 }}>
              {data.trigger_meta.trigger_key}
            </Typography>
          </Box>
        )}

        {/* MESSAGE PREVIEW */}
        {data.message && (
          <Typography
            sx={{
              fontSize: 11.5,
              color: "#374151",
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mb: 1,
              whiteSpace: "pre-line",
            }}
          >
            {data.message}
          </Typography>
        )}

        {/* SET CONTACT ATTRIBUTE */}
        {data.type === "set_contact_attribute" && (
          <Box sx={{ bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 1.5, px: 1, py: 0.5 }}>
            {(Array.isArray(data.attribute_name) ? data.attribute_name : [data.attribute_name]).map((k: any, i: number) => (
              <Typography key={i} fontSize={10.5} color="#92400e" fontFamily="monospace">
                {k || "?"} = {Array.isArray(data.attribute_value) ? data.attribute_value[i] : data.attribute_value || "?"}
              </Typography>
            ))}
          </Box>
        )}

        {/* EVAL CODE PREVIEW */}
        {data.type === "eval" && (
          <Box sx={{ bgcolor: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 1.5, px: 1, py: 0.75 }}>
            <Typography
              sx={{
                fontSize: 10.5, color: "#5b21b6", fontFamily: "monospace",
                display: "-webkit-box", WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical", overflow: "hidden",
                whiteSpace: "pre", lineHeight: 1.6,
              }}
            >
              {(data.code || "// empty").split("\n").filter((l: string) => l.trim() && !l.trim().startsWith("//"))[0] || "// empty"}
            </Typography>
          </Box>
        )}

        {/* DELAY */}
        {data.type === "delay" && (
          <Box sx={{ bgcolor: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 1.5, px: 1, py: 0.75, textAlign: "center" }}>
            <Typography fontSize={20} lineHeight={1}>⏱️</Typography>
            <Typography fontSize={12} color="#0e7490" fontWeight={700} sx={{ mt: 0.25 }}>
              {data.delay_duration?.value ?? "?"} {data.delay_duration?.unit ?? ""}
            </Typography>
          </Box>
        )}

        {/* INTEGRATION ACTION */}
        {data.type === "integration_action" && (
          <Box sx={{ bgcolor: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 1.5, px: 1, py: 0.75 }}>
            <Typography fontSize={10.5} color="#0e7490" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
              {data.integration_slug || "?"}
            </Typography>
            <Typography fontSize={11} color="#155e75" sx={{ mt: 0.25 }}>
              {data.action_label || data.action_key || "Pick action"}
            </Typography>
            {data.config?.save_to && (
              <Typography fontSize={10} color="#6b7280" sx={{ fontFamily: "monospace", mt: 0.25 }}>
                → {`{{${data.config.save_to}}}`}
              </Typography>
            )}
          </Box>
        )}

        {/* GOOGLE SHEET */}
        {data.type === "google_sheet" && (
          <Box sx={{ bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 1.5, px: 1, py: 0.75 }}>
            {data.sheet_name && <Typography fontSize={10.5} color="#166534">📋 {data.sheet_name}</Typography>}
            {data.action && <Typography fontSize={10.5} color="#166534" sx={{ textTransform: "capitalize" }}>⚡ {data.action}</Typography>}
            {data.map && Object.keys(data.map).length > 0 && (
              <Typography fontSize={10} color="#6b7280">{Object.keys(data.map).length} column(s) mapped</Typography>
            )}
          </Box>
        )}

        {/* BUTTONS */}
        {Array.isArray(data.buttons) && data.buttons.length > 0 && (
          data.buttons.map((btn: any, index: number) => {
            const buttonId = btn?.id || `btn_${index}`;
            return (
              <Box
                key={buttonId}
                sx={{
                  mt: 0.75,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: "8px",
                  background: "#f8fffe",
                  border: "1px solid #d1fae5",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#25D366", flexShrink: 0 }} />
                <Typography fontSize={11} color="#065f46" fontWeight={500} noWrap sx={{ flex: 1 }}>
                  {btn?.title || "Untitled"}
                </Typography>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={buttonId}
                  style={{ width: 10, height: 10, background: "#25D366", borderRadius: "50%", position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)" }}
                />
              </Box>
            );
          })
        )}

        {/* CAROUSEL BUTTONS */}
        {carouselButtons.length > 0 && (
          <Box sx={{ mt: 0.75 }}>
            <Typography fontSize={10} color="#6b7280" sx={{ mb: 0.5 }}>
              Carousel Buttons
            </Typography>
            {carouselButtons.map((btn: any) => {
              const buttonId = btn.id;
              return (
                <Box
                  onClick={(e) => { e.stopPropagation(); disconnectRow?.(id, buttonId); }}
                  key={`${btn.cardId}_${buttonId}`}
                  sx={{
                    mt: 0.75,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: "8px",
                    background: "#f8fffe",
                    border: "1px solid #d1fae5",
                    position: "relative",
                    cursor: "pointer",
                    "&:hover": { background: "#ecfdf5" },
                  }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#25D366", flexShrink: 0 }} />
                    <Typography fontSize={11} color="#065f46" fontWeight={600} noWrap sx={{ flex: 1 }}>
                      {btn.title || "Button"}
                    </Typography>
                  </Stack>
                  <Typography fontSize={9.5} color="#6b7280" noWrap sx={{ pl: 1.75, mt: 0.1 }}>
                    Card {btn.cardIndex + 1}{btn.cardBody ? ` · ${btn.cardBody}` : ""}
                  </Typography>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={buttonId}
                    style={{ width: 10, height: 10, background: "#25D366", borderRadius: "50%", position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)" }}
                  />
                </Box>
              );
            })}
          </Box>
        )}

        {/* PAYMENT STATUS BRANCHES */}
        {paymentStatusHandles.length > 0 && (
          <Box sx={{ mt: 0.75 }}>
            <Typography fontSize={10} color="#6b7280" sx={{ mb: 0.5 }}>
              Payment Result
            </Typography>
            {paymentStatusHandles.map((handle) => (
              <Box
                onClick={(e) => { e.stopPropagation(); disconnectRow?.(id, handle.id); }}
                key={handle.id}
                sx={{
                  mt: 0.75,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: "8px",
                  background: handle.bg,
                  border: `1px solid ${handle.border}`,
                  position: "relative",
                  cursor: "pointer",
                  "&:hover": { filter: "brightness(0.98)" },
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: handle.color, flexShrink: 0 }} />
                  <Typography fontSize={11} color={handle.color} fontWeight={600} noWrap sx={{ flex: 1 }}>
                    {handle.title}
                  </Typography>
                </Stack>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={handle.id}
                  style={{ width: 10, height: 10, background: handle.color, borderRadius: "50%", position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)" }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* CONDITION BRANCHES */}
        {conditionBranches.length > 0 && (
          <Box sx={{ mt: 0.75 }}>
            <Typography fontSize={10} color="#6b7280" sx={{ mb: 0.5 }}>Branches</Typography>
            {conditionBranches.map((branch: any, idx: number) => {
              const color = branch.is_default ? "#6b7280" : BRANCH_COLORS[idx % BRANCH_COLORS.length];
              const bg    = branch.is_default ? "#f9fafb" : `${color}11`;
              return (
                <Box
                  key={branch.id}
                  onClick={(e) => { e.stopPropagation(); disconnectRow?.(id, branch.id); }}
                  sx={{
                    mt: 0.75, px: 1.25, py: 0.75, borderRadius: "8px",
                    background: bg, border: `1.5px solid ${color}44`,
                    position: "relative", cursor: "pointer",
                    "&:hover": { borderColor: color },
                  }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ px: 0.75, py: 0.1, borderRadius: "4px", bgcolor: color, flexShrink: 0 }}>
                      <Typography sx={{ fontSize: 9, color: "#fff", fontWeight: 700, lineHeight: 1.4 }}>
                        {branch.is_default ? "ELSE" : `IF ${idx + 1}`}
                      </Typography>
                    </Box>
                    <Typography fontSize={11} fontWeight={600} color={color} noWrap sx={{ flex: 1 }}>
                      {branch.label || (branch.is_default ? "Else" : `Branch ${idx + 1}`)}
                    </Typography>
                  </Stack>
                  {!branch.is_default && (branch.conditions || []).length > 0 && (
                    <Typography fontSize={9.5} color="#6b7280" noWrap sx={{ pl: 3.5, mt: 0.1 }}>
                      {branch.conditions.slice(0, 2).map((c: any) =>
                        `${c.variable} ${c.operator}${c.value ? ` ${c.value}` : ""}`
                      ).join(` ${branch.logic} `)}
                      {branch.conditions.length > 2 ? " …" : ""}
                    </Typography>
                  )}
                  <Handle
                    type="source" position={Position.Right} id={branch.id}
                    style={{ width: 10, height: 10, background: color, borderRadius: "50%", position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)" }}
                  />
                </Box>
              );
            })}
          </Box>
        )}

        {/* LIST ITEMS */}
        {Array.isArray(data.list) && data.list.length > 0 &&
          data.list.map((item: any, index: number) => {
            const itemId = item?.id || `list_${index}`;
            return (
              <Box
                onClick={(e) => { e.stopPropagation(); disconnectRow?.(id, itemId); }}
                key={itemId}
                sx={{
                  mt: 0.75,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: "8px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  position: "relative",
                  cursor: "pointer",
                  "&:hover": { background: "#dbeafe" },
                }}
              >
                <Typography fontSize={11} fontWeight={500} color="#1e40af" noWrap>
                  {item?.title || "Untitled"}
                </Typography>
                {item?.description && (
                  <Typography fontSize={10} color="#6b7280" noWrap>{item.description}</Typography>
                )}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={itemId}
                  style={{ width: 10, height: 10, background: "#2563eb", borderRadius: "50%", position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)" }}
                />
              </Box>
            );
          })
        }
      </Box>

      {/* ── HANDLES ── */}
      {data.type === "trigger" && (
        <Handle type="source" position={Position.Right}
          style={{ width: 10, height: 10, background: "#25D366", borderRadius: "50%", right: -6 }}
        />
      )}
      {data.type !== "trigger" && (
        <Handle type="target" position={Position.Left}
          style={{ width: 10, height: 10, background: "#9ca3af", border: "2px solid #fff", borderRadius: "50%", left: -6 }}
        />
      )}
      {data.type !== "trigger" &&
        (!Array.isArray(data.buttons) || data.buttons.length === 0) &&
        (!Array.isArray(data.list) || data.list.length === 0) &&
        paymentStatusHandles.length === 0 &&
        carouselButtons.length === 0 &&
        conditionBranches.length === 0 && (
          <Handle type="source" position={Position.Right}
            style={{
              width: 10, height: 10,
              background: "#25D366",
              borderRadius: "50%",
              right: -6,
            }}
          />
        )}
    </Box>
  );
});

const nodeTypes = {
  custom: CustomNode,
};

const AutomationBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [createNodePos, setCreateNodePos] = useState<any>(null);
  const [openTriggerPopup, setOpenTriggerPopup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingTriggerSettings, setSavingTriggerSettings] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [callbackIds, setCallbackIds] = useState<string[]>([]);
  const [callbackInput, setCallbackInput] = useState("");
  const [callbackMatchType, setCallbackMatchType] = useState<"exact" | "prefix" | "contains">("exact");
  const [pendingTriggerType, setPendingTriggerType] = useState<string>("new_message_received");
  const [webhookMappings, setWebhookMappings] = useState<WebhookMapping[]>([]);

  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.role === "superadmin";

  // Import / Export / Save-to-Library state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [saveToLibOpen, setSaveToLibOpen] = useState(false);
  const [saveToLibForm, setSaveToLibForm] = useState({
    title: "", description: "", category: "general", tags: "", preview_message: "",
  });
  const [savingToLib, setSavingToLib] = useState(false);

  const connectingNodeRef = useRef<{ nodeId: string | null; handleId: string | null }>({ nodeId: null, handleId: null });
  const pendingEdgeRef = useRef<{ sourceNodeId: string; sourceHandleId: string | null } | null>(null);
  const suppressNextClickRef = useRef(false);

  const closeMenu = () => setAnchorEl(null);

  const disconnectRow = (nodeId: string, rowId: string) => {
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !(
            e.source === nodeId &&
            e.sourceHandle === rowId
          )
      )
    );
  };

  /* ── Load template nodes/edges into builder (replaces current state) ── */
  const loadFromTemplate = useCallback(
    (templateNodes: any[], templateEdges: any[], triggerConfig?: any) => {
      const flowNodes: Node<CustomNodeData>[] = templateNodes.map((node: any) => {
        let list: any[] = [];
        if (node.type === "list" && node.sections?.length) {
          list = node.sections.flatMap((section: any) =>
            section.rows.map((row: any) => ({
              id: row.id, title: row.title, description: row.description,
            }))
          );
        }
        const isTriggerNode = node.type === "trigger";
        const triggerMeta =
          isTriggerNode && triggerConfig?.slug
            ? { slug: triggerConfig.slug, trigger_key: triggerConfig.trigger_key }
            : undefined;

        return {
          id: node.id,
          type: "custom",
          position: node.position || { x: 0, y: 0 },
          data: {
            ...node,
            list,
            label: node.type,
            attribute_name: node.config?.key || "",
            attribute_value: node.config?.value || "",
            ...(triggerMeta && { trigger_meta: triggerMeta }),
            disconnectRow,
            setMenuAnchor: (el: HTMLElement) => {
              setSelectedNode({ id: node.id, type: "custom", position: node.position || { x: 0, y: 0 }, data: node } as any);
              setAnchorEl(el);
            },
          },
        };
      });

      const flowEdges: Edge[] = templateEdges.map((edge: any, i: number) => ({
        id: `${edge.from}-${edge.to}-${i}`,
        source: edge.from,
        target: edge.to,
        label: edge.condition || "",
        sourceHandle: edge.condition || "",
        type: "custom" as any,
        animated: true,
        style: { stroke: "#25D366", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed },
      }));

      const hasSavedPositions = flowNodes.some(
        (n) => n.position && (n.position.x !== 0 || n.position.y !== 0)
      );
      if (hasSavedPositions) {
        setNodes(flowNodes);
        setEdges(flowEdges);
      } else {
        const { nodes: ln, edges: le } = getLayoutedElements(flowNodes, flowEdges);
        setNodes(ln);
        setEdges(le);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disconnectRow]
  );

  /* ── Export current automation as JSON file ── */
  const handleExport = () => {
    const exportData = {
      _autochatix_export: "1.0",
      name: automation?.name || "Automation Export",
      trigger: automation?.trigger || "new_message_received",
      trigger_config: automation?.trigger_config,
      keywords: automation?.keywords || [],
      nodes: nodes.map((n) => {
        // Strip React Flow / UI-only fields
        const {
          disconnectRow: _dr, setMenuAnchor: _sma, label: _lbl,
          list: _list, attribute_name: _an, attribute_value: _av,
          trigger_meta: _tm, _updatedAt: _ua,
          ...rest
        } = n.data as any;
        return rest;
      }),
      edges: edges.map((e) => ({
        from: e.source,
        to: e.target,
        condition: typeof e.label === "string" ? e.label : (e as any).sourceHandle || "",
      })),
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(automation?.name || "automation").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Clone selected nodes (with all IDs remapped to avoid collisions) ── */
  const handleCloneNodes = useCallback(() => {
    const selected = nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    const { nodes: cloned, edges: clonedEdges } = cloneReactFlowNodes(selected, edges);
    setNodes((prev) => [...prev.map((n) => ({ ...n, selected: false })), ...cloned]);
    setEdges((prev) => [...prev, ...clonedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  /* ── Save current automation to the library (SuperAdmin only) ── */
  const handleSaveToLibrary = async () => {
    try {
      setSavingToLib(true);
      const formattedNodes = nodes.map((n) => {
        const {
          disconnectRow: _dr, setMenuAnchor: _sma, label: _lbl,
          list: _list, attribute_name: _an, attribute_value: _av,
          trigger_meta: _tm, _updatedAt: _ua,
          ...rest
        } = n.data as any;
        return rest;
      });
      const formattedEdges = edges.map((e) => ({
        from: e.source,
        to: e.target,
        condition: typeof e.label === "string" ? e.label : (e as any).sourceHandle || "",
      }));

      await automationLibraryService.create({
        title: saveToLibForm.title || automation?.name || "Untitled",
        description: saveToLibForm.description,
        category: saveToLibForm.category as any,
        tags: saveToLibForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        preview_message: saveToLibForm.preview_message,
        trigger: automation?.trigger || "new_message_received",
        trigger_config: automation?.trigger_config,
        keywords: automation?.keywords || [],
        nodes: formattedNodes,
        edges: formattedEdges,
        is_active: true,
      });

      setSaveToLibOpen(false);
      setSaveToLibForm({ title: "", description: "", category: "general", tags: "", preview_message: "" });
      alert("✅ Automation saved to library!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save to library");
    } finally {
      setSavingToLib(false);
    }
  };

  useEffect(() => {
    if (selectedNode?.data?.keywords) {
      setKeywords(selectedNode.data.keywords);
    } else {
      setKeywords([]);
    }
  }, [selectedNode]);

  const getTriggerLabel = (trigger: string) => {
    const map: any = {
      new_message_received: "Incoming Message",
      outgoing_message: "Outgoing Message",
      webhook_received: "Webhook",
      call_completed: "Call Completed",
      call_missed: "Call Missed",
      order_received: "Order Received",
      integration_trigger: "Integration",
    };

    return map[trigger] || trigger;
  };

  /* =========================
     CREATE NODE
     `extras` lets the palette inject integration_action defaults.
  ========================= */
  const createNode = (type: string, extras: Record<string, any> = {}) => {
    if (!type || !createNodePos) return;

    const config = NODE_CONFIG[type] || {};
    const nodeId = genId();

    const newNode: Node<CustomNodeData> = {
      id: nodeId,
      type: "custom",
      position: {
        x: createNodePos.x - 100,
        y: createNodePos.y - 50,
      },
      data: {
        id: nodeId,
        type,
        label: type,
        ...config,
        ...extras, // 🔥 integration_slug + action_key + initial config

        messageType:
          config.messageType || (type === "auto_reply" ? "text" : ""),

        // 🔥 ADD THIS (only for trigger)
        ...(type === "trigger" && {
          triggerType: "all",
          keywords: [], // 🔥 array
        }),

        setMenuAnchor: (el: HTMLElement) => {
          setAnchorEl(el);
        },
        onDelete: (id: string) => {
          setNodes((nds) => nds.filter((n) => n.id !== id));
          setEdges((eds) =>
            eds.filter((e) => e.source !== id && e.target !== id)
          );
        },
      }
    };

    setNodes((prev) => [...prev, newNode]);

    // Auto-connect if this node was created by dragging from an existing handle
    if (pendingEdgeRef.current) {
      const { sourceNodeId, sourceHandleId } = pendingEdgeRef.current;
      pendingEdgeRef.current = null;
      setEdges((eds) => {
        const exists = eds.find(
          (e) => e.source === sourceNodeId && e.sourceHandle === (sourceHandleId || null)
        );
        if (exists) return eds;
        return [
          ...eds,
          {
            id: genId(),
            source: sourceNodeId,
            target: nodeId,
            sourceHandle: sourceHandleId || null,
            label: sourceHandleId || "",
            type: "custom" as any,
            animated: true,
            style: { stroke: "#25D366", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed },
          },
        ];
      });
    }

    setCreateNodePos(null);
    setSelectedNode(newNode);

  };


  const onConnectStart = (_event: any, { nodeId, handleId }: { nodeId: string | null; handleId: string | null }) => {
    connectingNodeRef.current = { nodeId, handleId };
  };

  const onConnectEnd = (event: any) => {
    const { nodeId, handleId } = connectingNodeRef.current;
    connectingNodeRef.current = { nodeId: null, handleId: null };
    if (!nodeId) return;

    const target = event.target as HTMLElement;
    // Dropped on a node/handle → connection handled by onConnect, nothing to do
    if (target.closest(".react-flow__node") || target.closest(".react-flow__handle")) return;

    // Dropped on empty canvas → show node picker and auto-connect when node is chosen
    const reactFlowEl = document.querySelector(".react-flow");
    const bounds = reactFlowEl?.getBoundingClientRect();
    if (!bounds) return;

    pendingEdgeRef.current = { sourceNodeId: nodeId, sourceHandleId: handleId };
    suppressNextClickRef.current = true;
    setCreateNodePos({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  };

  const onConnect = (params: Connection) => {
    setEdges((eds) => {
      const exists = eds.find(
        (e) =>
          e.source === params.source &&
          e.sourceHandle === params.sourceHandle
      );

      if (exists) return eds;

      return addEdge(
        {
          ...params,
          type: "custom" as any,
          label: params.sourceHandle || "",
          animated: true,
          style: {
            stroke: "#25D366",
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        },
        eds
      );
    });
  };


  const handleCanvasClick = (event: any) => {
    const target = event.target as HTMLElement;

    if (target.closest(".react-flow__node")) return;

    const bounds = event.currentTarget.getBoundingClientRect();

    setCreateNodePos({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  };

  /* =========================
     SAVE
  ========================= */
  const saveAutomation = async () => {
    try {
      // 🔒 BASIC VALIDATION
      if (!nodes || nodes.length === 0) {
        alert("⚠️ Please add at least one node");
        return;
      }

      // 🔒 TRIGGER VALIDATION
      const triggerNodes = nodes.filter(
        (n) => n.data?.type === "trigger"
      );

      if (triggerNodes.length === 0) {
        alert("⚠️ Trigger node is required");
        return;
      }

      if (triggerNodes.length > 1) {
        alert("⚠️ Only one trigger node allowed");
        return;
      }

      const normalizeCards = (cards: any[]) => {
        return cards?.map((card) => {
          let buttons = card.buttons;

          // ❌ agar string hai → force empty array
          if (typeof buttons === "string") {
            buttons = [];
          }

          // ❌ agar array nahi hai → empty
          if (!Array.isArray(buttons)) {
            buttons = [];
          }

          return {
            ...card,
            buttons,
          };
        });
      };

      // 🔒 NODE DATA FORMAT
      const formattedNodes = nodes.map((n) => {
        let sections = n.data.sections || [];

        // 🔥 convert list → sections (existing logic)
        if (!sections.length && n.data?.list?.length) {
          sections = [
            {
              title: n.data.sectionTitle || "Options",
              rows: n.data.list.map((item: any) => ({
                id: item.id,
                title: item.title,
                description: item.description,
              })),
            },
          ];
        }

        // 🔥 AUTO TYPE DETECT
        const nodeType =
          sections.length > 0 && n.data?.type !== "product_list"
            ? "list"
            : n.data?.type || "auto_reply";

        return {
          ...n.data,
          id: n.id,
          type: nodeType,
          sections,
          position: n.position,
          ...(nodeType === "broadcast_message" && {
            send_mode:
              n.data.send_mode ||
              (n.data.template?.name || n.data.template_name
                ? "template"
                : "text"),
            numbers:
              n.data.numbers ||
              n.data.phone_numbers ||
              n.data.recipients ||
              "",
            template_name:
              n.data.template_name || n.data.template?.name || "",
            language:
              n.data.language || n.data.template?.language || "en_US",
            body_params:
              n.data.body_params || n.data.template?.body || [],
          }),

          // 🔥 THIS LINE ADD KAR (IMPORTANT)
          cards: n.data.cards
            ? normalizeCards(n.data.cards)
            : n.data.cards,
          ...(n.data.type === "set_contact_attribute" && {
            config: {
              key: n.data.attribute_name,
              value: n.data.attribute_value,
            },
          }),

          body:
            nodeType === "list"
              ? n.data.message
              : n.data.body,

          button_text:
            nodeType === "list"
              ? n.data.button_text || n.data.cta || "Select"
              : n.data.button_text,

          cta: undefined,
        };
      });

      // 🔒 EDGE FORMAT
      const formattedEdges = edges.map((e) => ({
        from: e.source,
        to: e.target,
        condition:
          typeof e.label === "string"
            ? e.label
            : e.sourceHandle || "",
      }));

      // 🔥 LOADING START
      setSaving(true);



      await automationService.updateAutomation(id!, {
        nodes: formattedNodes,
        edges: formattedEdges,
      });

    } catch (err: any) {
      console.error("❌ Save Error:", err);

      alert(
        err?.response?.data?.message ||
        "❌ Failed to save automation"
      );
    } finally {
      setSaving(false);
    }
  };


  const onEdgeContextMenu = (event: any, edge: Edge) => {
    event.preventDefault();

    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
  };
  /* =========================
     FETCH
  ========================= */
  const { data, isLoading, isError } = useQuery({
    queryKey: ["automation", id],
    queryFn: () => automationService.getAutomationById(id!),
    enabled: !!id,
  });

  const automation = data?.data || data;

  useEffect(() => {
    const mappings = automation?.trigger_config?.webhook_mappings;
    setWebhookMappings(
      Array.isArray(mappings) && mappings.length
        ? mappings.map((m: any) => ({
            source_path: m.source_path || "",
            attribute_key: m.attribute_key || "",
          }))
        : [],
    );
  }, [automation?.trigger_config?.webhook_mappings]);

  useEffect(() => {
    if (automation?.trigger === "callback_id") {
      setCallbackIds(automation.trigger_config?.callback_ids || []);
      setCallbackMatchType(automation.trigger_config?.match_type || "exact");
    }
  }, [automation?.trigger, automation?.trigger_config?.callback_ids, automation?.trigger_config?.match_type]);

  // Sync pendingTriggerType when popup opens or automation changes
  useEffect(() => {
    if (openTriggerPopup) {
      setPendingTriggerType(automation?.trigger || "new_message_received");
      if (automation?.trigger === "callback_id") {
        setCallbackIds(automation.trigger_config?.callback_ids || []);
        setCallbackMatchType(automation.trigger_config?.match_type || "exact");
      }
    }
  }, [openTriggerPopup]);

  // ── channel id (handles populated object or string) ──
  const channelId: string | undefined =
    typeof automation?.channel_id === "object"
      ? automation?.channel_id?._id
      : automation?.channel_id;

  // ── integration catalog (palette source) ──
  const { data: catalogResp } = useIntegrationCatalog(channelId);
  const catalog: IntegrationDefinition[] = useMemo(
    () => catalogResp?.catalog || [],
    [catalogResp]
  );
  const connectedApps: IntegrationDefinition[] = useMemo(
    () => catalog.filter((a) => a.connected),
    [catalog]
  );

  // 🔥 Resolve the connected app + trigger meta for integration_trigger
  const integrationTriggerInfo = useMemo(() => {
    if (automation?.trigger !== "integration_trigger") return null;
    const slug = automation?.trigger_config?.slug;
    const triggerKey = automation?.trigger_config?.trigger_key;
    if (!slug || !triggerKey) return null;
    const app = catalog.find((a) => a.slug === slug);
    const trg = app?.triggers.find((t) => t.key === triggerKey);
    return app && trg ? { app, trg } : null;
  }, [
    automation?.trigger,
    automation?.trigger_config?.slug,
    automation?.trigger_config?.trigger_key,
    catalog,
  ]);

  const apiBase: string =
    (typeof window !== "undefined" && (window as any).__API_BASE__) ||
    process.env.REACT_APP_API_URL ||
    "";

  const publicApiBase = useMemo(() => {
    const fallback =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:5005`
        : "";
    const raw = (apiBase || fallback).replace(/\/+$/, "");
    return raw.replace(/\/api$/, "");
  }, [apiBase]);

  const customWebhookUrl = useMemo(() => {
    if (!automation?._id) return "";
    return `${publicApiBase}/api/automations/${automation._id}/webhook`;
  }, [automation?._id, publicApiBase]);

  const integrationWebhookUrl = useMemo(() => {
    if (!integrationTriggerInfo) return "";
    const slug = integrationTriggerInfo.app.slug;
    const accountId = automation?.account_id;
    const ch = channelId;
    return `${publicApiBase}/api/integrations/webhook/${slug}?account_id=${accountId}&channel_id=${ch}`;
  }, [integrationTriggerInfo, automation?.account_id, channelId, publicApiBase]);

  const {
    data: webhookLogs = [],
    refetch: refetchWebhookLogs,
    isFetching: webhookLogsLoading,
  } = useQuery({
    queryKey: ["automation-webhook-logs", automation?._id],
    queryFn: () => automationService.getWebhookLogs(automation._id),
    enabled: !!automation?._id && automation?.trigger === "webhook_received",
    refetchInterval: automation?.trigger === "webhook_received" ? 5000 : false,
  });

  const { data: contactAttributes = [] } = useQuery<ContactAttribute[]>({
    queryKey: ["contact-attributes"],
    queryFn: async () => {
      const res = await contactAttributeService.getAttributes();
      return res.data || [];
    },
    staleTime: 60_000,
  });

  const webhookDestinationFields = useMemo(
    () => [
      { id: "contact.name", name: "Contact Name" },
      { id: "contact.phone", name: "Contact Phone" },
      ...contactAttributes,
    ],
    [contactAttributes],
  );

  const webhookSourcePaths = useMemo(
    () => flattenPayloadPaths(webhookLogs?.[0]?.payload || {}),
    [webhookLogs],
  );

  const addWebhookMapping = () => {
    setWebhookMappings((prev) => [
      ...prev,
      { source_path: webhookSourcePaths[0] || "", attribute_key: "" },
    ]);
  };

  const updateWebhookMapping = (
    index: number,
    patch: Partial<WebhookMapping>,
  ) => {
    setWebhookMappings((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const removeWebhookMapping = (index: number) => {
    setWebhookMappings((prev) => prev.filter((_, i) => i !== index));
  };

  const saveTriggerSettings = async () => {
    try {
      setSavingTriggerSettings(true);

      if (automation?.trigger === "new_message_received") {
        selectedNode && updateNodeData(selectedNode.id, { keywords });
      }

      // Handle callback_id — including switching trigger type
      if (pendingTriggerType === "callback_id") {
        await automationService.updateAutomation(automation._id, {
          ...(automation?.trigger !== "callback_id" ? { trigger: "callback_id" } : {}),
          trigger_config: {
            callback_ids: callbackIds,
            match_type: callbackMatchType,
          },
        });
        queryClient.invalidateQueries({ queryKey: ["automation", id] });
      }

      // Switching back FROM callback_id → new_message_received
      if (automation?.trigger === "callback_id" && pendingTriggerType !== "callback_id") {
        await automationService.updateAutomation(automation._id, {
          trigger: "new_message_received",
          trigger_config: {},
        });
        queryClient.invalidateQueries({ queryKey: ["automation", id] });
      }

      if (automation?.trigger === "webhook_received") {
        const cleanMappings = webhookMappings
          .map((m) => ({
            source_path: m.source_path.trim(),
            attribute_key: m.attribute_key.trim(),
          }))
          .filter((m) => m.source_path && m.attribute_key);

        await automationService.updateAutomation(automation._id, {
          trigger_config: {
            ...(automation.trigger_config || {}),
            webhook_mappings: cleanMappings,
          },
        });
        queryClient.invalidateQueries({ queryKey: ["automation", id] });
      }

      setOpenTriggerPopup(false);
    } catch (err) {
      console.error("❌ saveTriggerSettings error:", err);
      alert("Failed to save trigger settings");
    } finally {
      setSavingTriggerSettings(false);
    }
  };

  /* =========================
     LOAD FLOW
  ========================= */
  const makeTriggerNode = (): Node<CustomNodeData> => ({
    id: "trigger",
    type: "custom",
    position: { x: 200, y: 200 },
    data: {
      id: "trigger",
      type: "trigger",
      label: "trigger",
      triggerType: "all",
      keywords: [],
      disconnectRow,
    },
  });

  useEffect(() => {
    if (!data) return;

    // New automation — no nodes saved yet
    if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
      setNodes([makeTriggerNode()]);
      setEdges([]);
      return;
    }

    const flowNodes: Node<CustomNodeData>[] = data.nodes.map((node: any) => {

      let list: any[] = [];

      // ✅ convert sections → flat list
      if (node.type === "list" && node.sections?.length) {
        list = node.sections.flatMap((section: any) =>
          section.rows.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
          }))
        );
      }

      // For integration_trigger automations, decorate the start trigger
      // node with the source app/trigger meta so the canvas shows it.
      const isTriggerNode = node.type === "trigger";
      const triggerMeta =
        isTriggerNode && data.trigger === "integration_trigger" && data.trigger_config
          ? {
              slug: data.trigger_config.slug,
              trigger_key: data.trigger_config.trigger_key,
            }
          : undefined;

      return {
        id: node.id,
        type: "custom",
        position: node.position || { x: 0, y: 0 },
        data: {
          ...node,
          list, // 🔥 IMPORTANT
          label: node.type,
          // 🔥 ADD THIS
          attribute_name: node.config?.key || "",
          attribute_value: node.config?.value || "",
          ...(triggerMeta && { trigger_meta: triggerMeta }),
          disconnectRow,
          setMenuAnchor: (el: HTMLElement) => {
            setSelectedNode({
              id: node.id,
              type: "custom",
              position: node.position || { x: 0, y: 0 },
              data: node, // 🔥 FULL DATA
            } as any);

            setAnchorEl(el);
          },
        },
      };
    });
    const flowEdges: Edge[] = data.edges.map((edge: any, i: number) => ({
      id: `${edge.from}-${edge.to}-${i}`,
      source: edge.from,
      target: edge.to,
      label: edge.condition || "",
      sourceHandle: edge.condition || "", // 🔥 ADD THIS
      type: "custom" as any,
      animated: true,
      style: {
        stroke: "#25D366",
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));

    const hasSavedPositions = flowNodes.some(
      (n) =>
        n.position &&
        (n.position.x !== 0 || n.position.y !== 0)
    );

    if (hasSavedPositions) {
      // ✅ USE DB POSITIONS
      setNodes(flowNodes);
      setEdges(flowEdges);
    } else {
      // ✅ FIRST TIME AUTO LAYOUT
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(flowNodes, flowEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const handleClick = (e: any) => {
      // Skip the click that fires immediately after a connection drag ends
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }

      const target = e.target as HTMLElement;

      // ✅ Node create popup pe click → ignore
      if (target.closest("[data-node-popup]")) return;

      // 🔥 ADD THIS (VERY IMPORTANT)
      if (target.closest(".MuiDialog-root")) return;

      // 🔥 ADD THIS (ReactFlow nodes pe click ignore)
      if (target.closest(".react-flow__node")) return;

      pendingEdgeRef.current = null;
      setCreateNodePos(null);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);


  /* =========================
     UPDATE NODE
  ========================= */
  const updateNodeData = (id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
            ...node,
            data: {
              ...node.data,
              ...newData,
              _updatedAt: Date.now(),
            },
          }
          : node
      )
    );

    setSelectedNode((prev) =>
      prev && prev.id === id
        ? {
          ...prev,
          data: {
            ...prev.data,
            ...newData,
            _updatedAt: Date.now(),
          },
        }
        : prev
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" gap={2}>
        <CircularProgress sx={{ color: "#25D366" }} />
        <Typography color="text.secondary" fontSize={14}>Loading automation…</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" gap={1.5}>
        <Typography fontSize={36}>⚠️</Typography>
        <Typography color="error" fontSize={14} fontWeight={600}>Failed to load automation</Typography>
        <Typography color="text.secondary" fontSize={12}>Please check your connection and try again</Typography>
      </Box>
    );
  }


  return (
    <Box
      display="flex"
      flexDirection="column"
      height="calc(100vh - 70px)"
      sx={{
        background: "#f8fafc",
        position: "relative",
      }}
    >

      {/* ── HEADER ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2.5,
          py: 1.25,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 10,
          minHeight: 56,
        }}
      >
        {/* LEFT */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Tooltip title="Back to Automations">
            <Button
              size="small"
              startIcon={<ArrowBackIosNewIcon sx={{ fontSize: "13px !important" }} />}
              onClick={() => navigate("/automations")}
              sx={{ color: "#6b7280", minWidth: 0, px: 1, py: 0.5, fontSize: 12, "&:hover": { bgcolor: "#f3f4f6" } }}
            >
              Back
            </Button>
          </Tooltip>

          <Box sx={{ width: "1px", height: 20, bgcolor: "#e5e7eb" }} />

          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} sx={{ fontSize: 14 }}>
              {automation?.name || "Untitled Automation"}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            {automation?.channel_name && (
              <Chip
                label={automation.channel_name}
                size="small"
                sx={{ fontSize: 11, height: 22, bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}
              />
            )}
            {automation?.trigger && (
              <Chip
                label={`⚡ ${getTriggerLabel(automation.trigger)}`}
                size="small"
                sx={{ fontSize: 11, height: 22, bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 600 }}
              />
            )}
            {automation?.status && (
              <Chip
                label={automation.status}
                size="small"
                sx={{
                  fontSize: 11, height: 22, fontWeight: 600,
                  bgcolor: automation.status === "active" ? "#f0fdf4" : "#f9fafb",
                  color: automation.status === "active" ? "#16a34a" : "#6b7280",
                }}
              />
            )}
          </Stack>
        </Stack>

        {/* RIGHT */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Import */}
          <Tooltip title="Import from Library or JSON">
            <Button
              size="small"
              startIcon={<FileUploadIcon sx={{ fontSize: 15 }} />}
              onClick={() => setImportModalOpen(true)}
              sx={{
                color: "#4b5563", fontSize: 12, px: 1.5, py: 0.5, borderRadius: "7px",
                border: "1px solid #e5e7eb", bgcolor: "#fff",
                "&:hover": { bgcolor: "#f3f4f6", borderColor: "#d1d5db" },
              }}
            >
              Import
            </Button>
          </Tooltip>

          {/* Export */}
          <Tooltip title="Export as JSON file">
            <Button
              size="small"
              startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />}
              onClick={handleExport}
              sx={{
                color: "#4b5563", fontSize: 12, px: 1.5, py: 0.5, borderRadius: "7px",
                border: "1px solid #e5e7eb", bgcolor: "#fff",
                "&:hover": { bgcolor: "#f3f4f6", borderColor: "#d1d5db" },
              }}
            >
              Export
            </Button>
          </Tooltip>

          {/* Clone Selected Nodes */}
          <Tooltip title={nodes.some(n => n.selected) ? "Clone selected nodes (IDs remapped)" : "Select nodes on canvas to clone"}>
            <span>
              <Button
                size="small"
                startIcon={<ContentCopyIcon sx={{ fontSize: 15 }} />}
                onClick={handleCloneNodes}
                disabled={!nodes.some(n => n.selected)}
                sx={{
                  color: "#6366f1", fontSize: 12, px: 1.5, py: 0.5, borderRadius: "7px",
                  border: "1px solid #c7d2fe", bgcolor: "#eef2ff",
                  "&:hover": { bgcolor: "#e0e7ff", borderColor: "#a5b4fc" },
                  "&:disabled": { opacity: 0.45 },
                }}
              >
                Clone Nodes
              </Button>
            </span>
          </Tooltip>

          {/* Save to Library (SuperAdmin only) */}
          {isSuperAdmin && (
            <Tooltip title="Save to Automation Library">
              <Button
                size="small"
                startIcon={<LibraryBooksIcon sx={{ fontSize: 15 }} />}
                onClick={() => {
                  setSaveToLibForm(f => ({ ...f, title: automation?.name || "" }));
                  setSaveToLibOpen(true);
                }}
                sx={{
                  color: "#1d4ed8", fontSize: 12, px: 1.5, py: 0.5, borderRadius: "7px",
                  border: "1px solid #bfdbfe", bgcolor: "#eff6ff",
                  "&:hover": { bgcolor: "#dbeafe", borderColor: "#93c5fd" },
                }}
              >
                Save to Library
              </Button>
            </Tooltip>
          )}

          <Box sx={{ width: "1px", height: 20, bgcolor: "#e5e7eb" }} />

          {/* Save */}
          <Button
            variant="contained"
            startIcon={saving ? undefined : <SaveIcon sx={{ fontSize: 16 }} />}
            onClick={saveAutomation}
            disabled={saving}
            sx={{
              borderRadius: "8px",
              px: 2.5,
              py: 0.75,
              fontWeight: 600,
              fontSize: 13,
              bgcolor: "#16a34a",
              "&:hover": { bgcolor: "#15803d" },
              boxShadow: "0 1px 4px rgba(22,163,74,0.3)",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Stack>
      </Box>

      {/* FLOW */}
      <Box
        sx={{ flex: 1 }}
        onClick={handleCanvasClick}
        onContextMenu={(e) => {
          e.preventDefault();

          const target = e.target as HTMLElement;

          if (target.closest(".react-flow__node")) return;

          handleCanvasClick(e);
        }}
      >
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodeDragStop={(e, node) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id
                  ? { ...n, position: node.position }
                  : n
              )
            );
          }}

          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          nodeOrigin={[0.5, 0.5]}

          deleteKeyCode={["Backspace", "Delete"]}

          onNodesDelete={(deleted) => {
            const filtered = deleted.filter((n) => n.data?.type !== "trigger");

            if (filtered.length !== deleted.length) {
              alert("Trigger node cannot be deleted");
              return;
            }

            const deletedIds = deleted.map((n) => n.id);

            setEdges((eds) =>
              eds.filter(
                (e) =>
                  !deletedIds.includes(e.source) &&
                  !deletedIds.includes(e.target)
              )
            );
          }}

          onNodeClick={(e, node) => {
            e.stopPropagation();

            if (node.data.type === "trigger") {
              setSelectedNode(node); // ✅ needed for update
              setOpenTriggerPopup(true);
              return; // 🔥 VERY IMPORTANT
            }

            setSelectedNode(node);
          }}

          onEdgeContextMenu={onEdgeContextMenu}

          elementsSelectable
          nodesDraggable
          edgesFocusable

          fitView

          /* 🔥 MAIN FIX (LINES PROBLEM SOLVED HERE) */
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: "custom", // 🔥 THIS IS IMPORTANT
          }}
        >
          <MiniMap />
          <Controls />
          <Background gap={20} size={1} />
        </ReactFlow>

        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={closeMenu}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            elevation: 0,
            sx: {
              minWidth: 168,
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
              py: 0.5,
              overflow: "visible",
              "& .MuiMenuItem-root": {
                mx: 0.5,
                borderRadius: "6px",
                fontSize: 13,
                fontWeight: 500,
                py: 0.9,
                px: 1.25,
                gap: 1,
                transition: "background 0.12s",
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {/* Edit */}
          <MenuItem
            onClick={() => {
              closeMenu();
              if (selectedNode) setSelectedNode(selectedNode);
            }}
            sx={{ color: "#374151", "&:hover": { bgcolor: "#f3f4f6" } }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <EditOutlinedIcon sx={{ fontSize: 16, color: "#6b7280" }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}>
              Edit Node
            </ListItemText>
          </MenuItem>

          {/* Clone */}
          <MenuItem
            onClick={() => {
              if (!selectedNode) return;
              const { nodes: cloned, edges: clonedEdges } = cloneReactFlowNodes([selectedNode], edges);
              setNodes((prev) => [...prev.map((n) => ({ ...n, selected: false })), ...cloned]);
              setEdges((prev) => [...prev, ...clonedEdges]);
              closeMenu();
            }}
            sx={{ color: "#374151", "&:hover": { bgcolor: "#f3f4f6" } }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <ContentCopyIcon sx={{ fontSize: 16, color: "#6366f1" }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}>
              Clone Node
            </ListItemText>
          </MenuItem>

          <Divider sx={{ my: 0.5, mx: 1 }} />

          {/* Delete */}
          <MenuItem
            onClick={() => {
              if (!selectedNode) return;
              const id = selectedNode.id;
              setNodes((nds) => nds.filter((n) => n.id !== id));
              setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
              setSelectedNode(null);
              closeMenu();
            }}
            sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <DeleteOutlineIcon sx={{ fontSize: 16, color: "#ef4444" }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: "#ef4444" }}>
              Delete Node
            </ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {createNodePos && (
        <Box
          data-node-popup
          sx={{
            position: "absolute",
            top: createNodePos.y,
            left: createNodePos.x,
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
            p: 1.5,
            zIndex: 2000,
            minWidth: 320,
            maxHeight: 480,
            overflowY: "auto",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* ─── BUILT-IN ─── */}
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", px: 0.5, pb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Built-in Nodes
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
            {Object.keys(NODE_CONFIG)
              .filter((type) => type !== "trigger")
              .map((type) => {
                const ns = NODE_STYLE[type] || DEFAULT_STYLE;
                return (
                  <Box
                    key={type}
                    onClick={() => { createNode(type); setCreateNodePos(null); }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.25,
                      py: 1,
                      borderRadius: "8px",
                      cursor: "pointer",
                      border: "1px solid #f3f4f6",
                      transition: "all 0.15s",
                      "&:hover": { bgcolor: ns.bg, borderColor: ns.color, "& .node-label": { color: ns.color } },
                    }}
                  >
                    <Box sx={{ width: 28, height: 28, borderRadius: "7px", bgcolor: ns.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                      {ns.icon}
                    </Box>
                    <Typography className="node-label" sx={{ fontSize: 12, fontWeight: 600, color: "#374151", lineHeight: 1.2 }}>
                      {ns.label}
                    </Typography>
                  </Box>
                );
              })}
          </Box>

          {/* ─── INTEGRATIONS ─── */}
          <Divider sx={{ my: 1.5, borderColor: "#f3f4f6" }} />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.5, pb: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Integrations
            </Typography>
            {connectedApps.length === 0 && (
              <Typography
                component="a"
                href="/integrations"
                target="_blank"
                sx={{ fontSize: 10.5, color: "#0891b2", fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                + Connect apps
              </Typography>
            )}
          </Box>

          {connectedApps.length === 0 ? (
            <Typography sx={{ fontSize: 11.5, color: "#9ca3af", px: 0.5, py: 1, fontStyle: "italic" }}>
              No connected integrations on this channel yet.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {connectedApps.map((app) => (
                <Box key={app.slug}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 0.5, mb: 0.5 }}>
                    <Avatar sx={{ width: 20, height: 20, bgcolor: app.bgColor, color: app.color, fontSize: 11, fontWeight: 800 }}>
                      {app.icon || app.name[0]}
                    </Avatar>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#374151" }}>{app.name}</Typography>
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 0.5, pl: 0.25 }}>
                    {app.actions.map((act) => (
                      <Box
                        key={`${app.slug}_${act.key}`}
                        onClick={() => {
                          // Initialise node with default config from action schema
                          const initialConfig: Record<string, any> = {};
                          for (const f of act.configSchema || []) {
                            if (f.defaultValue !== undefined) initialConfig[f.key] = f.defaultValue;
                          }
                          createNode("integration_action", {
                            integration_slug: app.slug,
                            action_key: act.key,
                            action_label: act.label,
                            label: `${app.name}: ${act.label}`,
                            config: initialConfig,
                          });
                          setCreateNodePos(null);
                        }}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          px: 1.25,
                          py: 0.75,
                          borderRadius: "8px",
                          cursor: "pointer",
                          border: "1px solid #f3f4f6",
                          "&:hover": { bgcolor: app.bgColor, borderColor: app.color },
                        }}
                      >
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: app.color, flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#1f2937", lineHeight: 1.25 }} noWrap>
                            {act.label}
                          </Typography>
                          {act.description && (
                            <Typography sx={{ fontSize: 10.5, color: "#6b7280", lineHeight: 1.3 }} noWrap>
                              {act.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* POPUP */}
      {selectedNode && !anchorEl && selectedNode.data?.type && selectedNode.data.type !== "trigger" && (
        <NodeOpenPopup
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          updateNodeData={updateNodeData}
          allNodes={nodes}
          channelId={channelId}
        />
      )}

      <Dialog
        open={openTriggerPopup}
        onClose={() => setOpenTriggerPopup(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" } }}
        BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.4)" } }}
      >
        {/* ── HEADER ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.75, bgcolor: "#fff7ed", borderBottom: "1px solid #fed7aa" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#fff", border: "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              ⚡
            </Box>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Trigger Settings</Typography>
              <Typography variant="caption" color="text.secondary">Configure when this automation fires</Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setOpenTriggerPopup(false)} sx={{ color: "#9ca3af", "&:hover": { color: "#374151", bgcolor: "#f3f4f6" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* ── CONTENT ── */}
        <DialogContent sx={{ p: 2.5 }}>
          {(automation?.trigger === "new_message_received" || automation?.trigger === "callback_id") && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 1.25 }}>
                  Trigger On
                </Typography>
                <Stack spacing={1}>
                  {[
                    { value: "all",         icon: "📩", title: "All Messages",  desc: "Fire for every incoming message" },
                    { value: "keyword",     icon: "🔑", title: "Keyword Match", desc: "Only fire when message matches a keyword" },
                    { value: "callback_id", icon: "🔘", title: "Callback ID",   desc: "Fire when a button or list reply ID matches" },
                  ].map((opt) => {
                    const currentMode = pendingTriggerType === "callback_id"
                      ? "callback_id"
                      : (selectedNode?.data?.triggerType || "all");
                    const active = currentMode === opt.value;
                    return (
                      <Box
                        key={opt.value}
                        onClick={() => {
                          if (opt.value === "callback_id") {
                            setPendingTriggerType("callback_id");
                          } else {
                            setPendingTriggerType("new_message_received");
                            selectedNode && updateNodeData(selectedNode.id, { triggerType: opt.value });
                          }
                        }}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px",
                          border: "2px solid", borderColor: active ? "#f97316" : "#e5e7eb",
                          bgcolor: active ? "#fff7ed" : "#f9fafb",
                          cursor: "pointer", transition: "all 0.15s", userSelect: "none",
                          "&:hover": { borderColor: "#f97316", bgcolor: "#fff7ed" },
                        }}
                      >
                        <Typography fontSize={22}>{opt.icon}</Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontSize={13} fontWeight={700} color={active ? "#c2410c" : "#374151"}>{opt.title}</Typography>
                          <Typography fontSize={11} color="text.secondary">{opt.desc}</Typography>
                        </Box>
                        <Box sx={{
                          width: 18, height: 18, borderRadius: "50%",
                          border: "2px solid", borderColor: active ? "#f97316" : "#d1d5db",
                          bgcolor: active ? "#f97316" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {active && <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#fff" }} />}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {pendingTriggerType !== "callback_id" && selectedNode?.data?.triggerType === "keyword" && (
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 1 }}>
                    Keywords
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                    <TextField
                      fullWidth size="small"
                      placeholder="e.g. hello, order, menu…"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e: any) => {
                        if (e.key === "Enter" && input.trim()) {
                          setKeywords((prev) => [...prev, input.trim()]);
                          setInput("");
                        }
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (!input.trim()) return;
                        setKeywords((prev) => [...prev, input.trim()]);
                        setInput("");
                      }}
                      sx={{ borderRadius: "8px", bgcolor: "#f97316", "&:hover": { bgcolor: "#ea580c" }, fontWeight: 600, px: 2.5, flexShrink: 0, boxShadow: "none" }}
                    >
                      Add
                    </Button>
                  </Box>
                  {keywords.length > 0 ? (
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      {keywords.map((k, i) => (
                        <Box
                          key={i}
                          sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.4, borderRadius: "20px", bgcolor: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12, fontWeight: 600, color: "#c2410c" }}
                        >
                          {k}
                          <Box
                            component="span"
                            onClick={() => setKeywords((prev) => prev.filter((_, idx) => idx !== i))}
                            sx={{ ml: 0.5, cursor: "pointer", fontSize: 10, lineHeight: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
                          >
                            ✕
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography fontSize={12} color="text.secondary" sx={{ fontStyle: "italic" }}>
                      Type a keyword and press Enter or click Add
                    </Typography>
                  )}
                </Box>
              )}

              {/* ── CALLBACK ID CONFIG (inline, shown when callback_id mode selected) ── */}
              {pendingTriggerType === "callback_id" && (
                <>
                  {/* Match type */}
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 1 }}>
                      Match Mode
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0.75 }}>
                      {[
                        { value: "exact",    label: "Exact",    desc: "ID must match exactly",        icon: "🎯" },
                        { value: "prefix",   label: "Prefix",   desc: "ID must start with the value", icon: "▶️" },
                        { value: "contains", label: "Contains", desc: "ID must contain the value",     icon: "🔍" },
                      ].map((opt) => {
                        const active = callbackMatchType === opt.value;
                        return (
                          <Box
                            key={opt.value}
                            onClick={() => setCallbackMatchType(opt.value as any)}
                            sx={{
                              p: 1.25, borderRadius: "10px", cursor: "pointer", userSelect: "none",
                              border: "2px solid", borderColor: active ? "#3b82f6" : "#e5e7eb",
                              bgcolor: active ? "#eff6ff" : "#f9fafb",
                              transition: "all 0.15s",
                              "&:hover": { borderColor: "#3b82f6", bgcolor: "#eff6ff" },
                            }}
                          >
                            <Typography fontSize={16} mb={0.25}>{opt.icon}</Typography>
                            <Typography fontSize={12} fontWeight={700} color={active ? "#1d4ed8" : "#374151"} lineHeight={1.2}>{opt.label}</Typography>
                            <Typography fontSize={10} color="text.secondary" lineHeight={1.3}>{opt.desc}</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Callback IDs input */}
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 1 }}>
                      Callback IDs
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                      <TextField
                        fullWidth size="small"
                        placeholder={callbackMatchType === "exact" ? "e.g. book_slot_1, confirm_order" : callbackMatchType === "prefix" ? "e.g. slot_, book_" : "e.g. appointment, slot"}
                        value={callbackInput}
                        onChange={(e) => setCallbackInput(e.target.value)}
                        onKeyDown={(e: any) => {
                          if (e.key === "Enter" && callbackInput.trim()) {
                            setCallbackIds((prev) => [...prev, callbackInput.trim()]);
                            setCallbackInput("");
                          }
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13, fontFamily: "monospace" } }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => {
                          if (!callbackInput.trim()) return;
                          setCallbackIds((prev) => [...prev, callbackInput.trim()]);
                          setCallbackInput("");
                        }}
                        sx={{ borderRadius: "8px", bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" }, fontWeight: 600, px: 2.5, flexShrink: 0, boxShadow: "none" }}
                      >
                        Add
                      </Button>
                    </Box>
                    {callbackIds.length > 0 ? (
                      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                        {callbackIds.map((k, i) => (
                          <Box
                            key={i}
                            sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.4, borderRadius: "20px", bgcolor: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 12, fontWeight: 600, color: "#1d4ed8", fontFamily: "monospace" }}
                          >
                            {k}
                            <Box
                              component="span"
                              onClick={() => setCallbackIds((prev) => prev.filter((_, idx) => idx !== i))}
                              sx={{ ml: 0.5, cursor: "pointer", fontSize: 10, lineHeight: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
                            >
                              ✕
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography fontSize={12} color="text.secondary" sx={{ fontStyle: "italic" }}>
                        Add at least one ID then click Save Settings
                      </Typography>
                    )}
                  </Box>

                  {/* Variable hint */}
                  <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <Typography fontSize={11} fontWeight={700} color="#166534" mb={0.5}>💡 Available in this automation</Typography>
                    <Box component="span" sx={{ display: "inline-block", mr: 0.75, px: 1, py: 0.25, borderRadius: "6px", bgcolor: "#dcfce7", color: "#166534", fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>
                      {`{{trigger_callback_id}}`}
                    </Box>
                    <Typography fontSize={11} color="#166534" sx={{ mt: 0.5 }}>
                      The exact button/list ID that fired this automation — use it in messages or Eval nodes.
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}

          {automation?.trigger === "call_completed" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, borderRadius: "12px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#dcfce7", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  📞
                </Box>
                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#166534">Call Completed</Typography>
                  <Typography fontSize={12} color="#166534" sx={{ mt: 0.4, lineHeight: 1.5 }}>
                    Fires automatically when a WhatsApp voice call ends successfully. Use this to send a follow-up message, log data, or trigger a workflow after every completed call.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <Typography fontSize={11} fontWeight={700} color="#374151" mb={0.75}>Available variables</Typography>
                {["{{contact.name}}", "{{contact.phone}}", "{{call.status}}", "{{call.direction}}"].map((v) => (
                  <Box key={v} component="span" sx={{ display: "inline-block", mr: 0.75, mb: 0.5, px: 1, py: 0.25, borderRadius: "6px", bgcolor: "#e0f2fe", color: "#0369a1", fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>{v}</Box>
                ))}
              </Box>
            </Box>
          )}

          {automation?.trigger === "call_missed" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, borderRadius: "12px", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#fee2e2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  📵
                </Box>
                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#991b1b">Missed Call</Typography>
                  <Typography fontSize={12} color="#991b1b" sx={{ mt: 0.4, lineHeight: 1.5 }}>
                    Fires when a WhatsApp call goes unanswered, busy, rejected, or fails. Perfect for sending an automatic "Sorry we missed you" message to re-engage the contact.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <Typography fontSize={11} fontWeight={700} color="#374151" mb={0.75}>Triggered when call status is</Typography>
                {["NO_ANSWER", "BUSY", "REJECTED", "FAILED"].map((s) => (
                  <Box key={s} component="span" sx={{ display: "inline-block", mr: 0.75, mb: 0.5, px: 1, py: 0.25, borderRadius: "6px", bgcolor: "#fee2e2", color: "#991b1b", fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>{s}</Box>
                ))}
              </Box>
            </Box>
          )}

          {automation?.trigger === "outgoing_message" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, borderRadius: "12px", bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#dbeafe", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  📤
                </Box>
                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#1e40af">Outgoing Message</Typography>
                  <Typography fontSize={12} color="#1e40af" sx={{ mt: 0.4, lineHeight: 1.5 }}>
                    Fires whenever an agent sends a message from this channel. Useful for post-message follow-ups, CRM logging, or triggering workflows based on agent activity.
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {automation?.trigger === "order_received" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2, borderRadius: "12px", bgcolor: "#ecfdf5", border: "1px solid #6ee7b7" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#d1fae5", border: "1px solid #6ee7b7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  🛒
                </Box>
                <Box>
                  <Typography fontSize={13} fontWeight={700} color="#065f46">Order Received</Typography>
                  <Typography fontSize={12} color="#065f46" sx={{ mt: 0.4, lineHeight: 1.5 }}>
                    Fires when a customer submits a product cart from your WhatsApp catalog. Use this to send an order confirmation, request payment, or kick off a fulfillment workflow automatically.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <Typography fontSize={11} fontWeight={700} color="#374151" mb={0.75}>Available variables</Typography>
                {["{{contact.name}}", "{{contact.phone}}", "{{order.total}}", "{{order.item_count}}", "{{order.catalog_id}}", "{{order.note}}"].map((v) => (
                  <Box key={v} component="span" sx={{ display: "inline-block", mr: 0.75, mb: 0.5, px: 1, py: 0.25, borderRadius: "6px", bgcolor: "#d1fae5", color: "#065f46", fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>{v}</Box>
                ))}
              </Box>
              <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
                <Typography fontSize={12} color="#92400e" fontWeight={600} mb={0.5}>💡 Pro tip</Typography>
                <Typography fontSize={11.5} color="#78350f" lineHeight={1.6}>
                  Use a <strong>product_list</strong> or <strong>single_product</strong> node before this trigger to first show the catalog to the customer — the automation will advance here automatically when they submit the cart.
                </Typography>
              </Box>
            </Box>
          )}

          {automation?.trigger === "webhook_received" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                <Typography fontSize={13} color="#5b21b6">
                  🔗 This automation fires when a custom webhook receives a POST request.
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 0.75 }}>
                  Webhook URL
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: "#6b7280", mb: 0.75 }}>
                  Send JSON here with a phone field like <strong>phone</strong>, <strong>phone_number</strong>, <strong>contact_phone</strong>, <strong>mobile</strong>, or <strong>to</strong> to run this automation for a contact.
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth size="small" InputProps={{ readOnly: true }}
                    value={customWebhookUrl}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontFamily: "monospace", fontSize: 11.5 } }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigator.clipboard.writeText(customWebhookUrl)}
                    sx={{ borderRadius: "8px", flexShrink: 0, fontWeight: 600 }}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>

              <Alert severity="info" sx={{ borderRadius: "8px", fontSize: 12 }}>
                Incoming payload fields are sources. Map them below to destination contact fields; every new webhook value will be saved before the automation continues.
              </Alert>

              <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#fff", border: "1px solid #e5e7eb" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box>
                    <Typography fontSize={11} fontWeight={700} color="#374151">
                      Source → Contact Field
                    </Typography>
                    <Typography fontSize={11} color="#6b7280">
                      Pick source keys from the latest test payload and save them into contact fields.
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={addWebhookMapping}
                    sx={{ fontSize: 11, minWidth: 0, px: 1, color: "#7c3aed", fontWeight: 700 }}
                  >
                    + Add
                  </Button>
                </Stack>

                {webhookMappings.length === 0 ? (
                  <Typography fontSize={11.5} color="#9ca3af">
                    No mappings yet. Send a test payload, then add the fields you want to keep.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {webhookMappings.map((mapping, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 32px",
                          gap: 1,
                          alignItems: "center",
                        }}
                      >
                        <TextField
                          select={webhookSourcePaths.length > 0}
                          size="small"
                          label="Source"
                          value={mapping.source_path}
                          onChange={(e) => updateWebhookMapping(index, { source_path: e.target.value })}
                          placeholder="data.item_name"
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                          InputLabelProps={{ shrink: true }}
                        >
                          {webhookSourcePaths.map((path) => (
                            <MenuItem key={path} value={path} sx={{ fontSize: 12, fontFamily: "monospace" }}>
                              {path}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select={webhookDestinationFields.length > 0}
                          size="small"
                          label="Destination Contact Field"
                          value={mapping.attribute_key}
                          onChange={(e) => updateWebhookMapping(index, { attribute_key: e.target.value })}
                          placeholder="item_name"
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12 } }}
                          InputLabelProps={{ shrink: true }}
                        >
                          {webhookDestinationFields.map((attr) => (
                            <MenuItem key={attr.id} value={attr.id} sx={{ fontSize: 12 }}>
                              {attr.name} ({attr.id})
                            </MenuItem>
                          ))}
                        </TextField>

                        <IconButton
                          size="small"
                          onClick={() => removeWebhookMapping(index)}
                          sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}

                {contactAttributes.length === 0 && (
                  <Typography fontSize={11} color="#dc2626" sx={{ mt: 1 }}>
                    No contact fields found. Create destination fields from Contact Fields first, or type a field key after a field exists.
                  </Typography>
                )}
              </Box>

              <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography fontSize={11} fontWeight={700} color="#374151">
                    Recent Test Payloads
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => refetchWebhookLogs()}
                    disabled={webhookLogsLoading}
                    sx={{ fontSize: 11, minWidth: 0, px: 1, color: "#7c3aed", fontWeight: 700 }}
                  >
                    {webhookLogsLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                </Stack>

                {webhookLogs.length === 0 ? (
                  <Typography fontSize={11.5} color="#9ca3af">
                    No webhook payload received yet. Send a POST request to the URL above and it will appear here.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {webhookLogs.slice(0, 3).map((log: any) => (
                      <Box key={log._id} sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                        <Box sx={{ px: 1.25, py: 0.75, borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", gap: 1 }}>
                          <Typography fontSize={10.5} color="#6b7280" fontFamily="monospace">
                            {log.method || "POST"}
                          </Typography>
                          <Typography fontSize={10.5} color="#6b7280">
                            {log.received_at ? new Date(log.received_at).toLocaleString() : ""}
                          </Typography>
                        </Box>
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            p: 1.25,
                            maxHeight: 160,
                            overflow: "auto",
                            fontSize: 10.5,
                            lineHeight: 1.5,
                            fontFamily: "monospace",
                            color: "#374151",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {JSON.stringify(log.payload || {}, null, 2)}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          )}

          {automation?.trigger === "integration_trigger" && !integrationTriggerInfo && (
            <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#fef3c7", border: "1px solid #fde68a" }}>
              <Typography fontSize={13} color="#92400e" fontWeight={600}>
                ⚠️ Integration not connected
              </Typography>
              <Typography fontSize={12} color="#78350f" sx={{ mt: 0.5 }}>
                The integration <strong>{automation?.trigger_config?.slug || "(unknown)"}</strong> isn't connected on this channel anymore.
                Reconnect it from the Integrations page or create a new automation.
              </Typography>
            </Box>
          )}

          {automation?.trigger === "integration_trigger" && integrationTriggerInfo && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ p: 2, borderRadius: "10px", bgcolor: integrationTriggerInfo.app.bgColor, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 1.25 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: integrationTriggerInfo.app.color }}>
                  {integrationTriggerInfo.app.icon || integrationTriggerInfo.app.name[0]}
                </Box>
                <Box>
                  <Typography fontSize={13} fontWeight={700} color={integrationTriggerInfo.app.color}>
                    {integrationTriggerInfo.app.name} → {integrationTriggerInfo.trg.label}
                  </Typography>
                  <Typography fontSize={11.5} color="text.secondary">
                    {integrationTriggerInfo.trg.description}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 0.75 }}>
                  Webhook URL
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: "#6b7280", mb: 0.75 }}>
                  Paste this URL into your <strong>{integrationTriggerInfo.app.name}</strong> dashboard to subscribe to events.
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth size="small" value={integrationWebhookUrl} InputProps={{ readOnly: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontFamily: "monospace", fontSize: 11.5 } }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigator.clipboard.writeText(integrationWebhookUrl)}
                    sx={{ borderRadius: "8px", flexShrink: 0, fontWeight: 600 }}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>

              {integrationTriggerInfo.trg.webhookEvent && (
                <Box sx={{ p: 1.25, borderRadius: "8px", bgcolor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                  <Typography fontSize={11} color="#6b7280">
                    Webhook event:{" "}
                    <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#374151" }}>
                      {integrationTriggerInfo.trg.webhookEvent}
                    </Box>
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        {/* ── FOOTER ── */}
        <Box sx={{ px: 2.5, py: 1.75, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setOpenTriggerPopup(false)}
            sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 13, px: 2.5, color: "#374151", borderColor: "#e5e7eb", "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveTriggerSettings}
            disabled={savingTriggerSettings}
            sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 13, px: 2.5, bgcolor: "#f97316", "&:hover": { bgcolor: "#ea580c" }, boxShadow: "none" }}
          >
            {savingTriggerSettings ? "Saving..." : "Save Settings"}
          </Button>
        </Box>
      </Dialog>

      {/* ── IMPORT AUTOMATION MODAL ── */}
      <ImportAutomationModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        isSuperAdmin={isSuperAdmin}
        onImport={({ nodes: tplNodes, edges: tplEdges, trigger_config }) => {
          loadFromTemplate(tplNodes, tplEdges, trigger_config);
        }}
      />

      {/* ── SAVE TO LIBRARY DIALOG (SuperAdmin only) ── */}
      {isSuperAdmin && (
        <Dialog open={saveToLibOpen} onClose={() => setSaveToLibOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 1 }}>
            <LibraryBooksIcon sx={{ color: "#1d4ed8", fontSize: 20 }} />
            Save to Automation Library
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} mt={0.5}>
              <TextField
                label="Template Title *"
                value={saveToLibForm.title}
                onChange={e => setSaveToLibForm(f => ({ ...f, title: e.target.value }))}
                size="small" fullWidth autoFocus
                helperText="Name displayed in the library"
              />
              <TextField
                label="Description"
                value={saveToLibForm.description}
                onChange={e => setSaveToLibForm(f => ({ ...f, description: e.target.value }))}
                size="small" fullWidth multiline rows={2}
              />
              <TextField
                label="Preview Message (shown on card)"
                value={saveToLibForm.preview_message}
                onChange={e => setSaveToLibForm(f => ({ ...f, preview_message: e.target.value }))}
                size="small" fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={saveToLibForm.category}
                  label="Category"
                  onChange={e => setSaveToLibForm(f => ({ ...f, category: e.target.value }))}
                >
                  {[
                    { value: "hotel_hospitality", label: "🏨 Hotel & Hospitality" },
                    { value: "tours_travel", label: "✈️ Tours & Travel" },
                    { value: "ecommerce", label: "🛍️ E-Commerce & Orders" },
                    { value: "real_estate", label: "🏠 Real Estate" },
                    { value: "salon_spa", label: "💅 Salon & Spa" },
                    { value: "clinic_healthcare", label: "🏥 Clinic & Healthcare" },
                    { value: "whatsapp_forms", label: "📝 WhatsApp Forms" },
                    { value: "education", label: "📚 Education" },
                    { value: "restaurant", label: "🍽️ Restaurant & Food" },
                    { value: "general", label: "⚙️ General" },
                  ].map(c => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Tags (comma separated)"
                value={saveToLibForm.tags}
                onChange={e => setSaveToLibForm(f => ({ ...f, tags: e.target.value }))}
                size="small" fullWidth
                helperText="e.g. demo, booking, hotel"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSaveToLibOpen(false)} disabled={savingToLib}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveToLibrary}
              disabled={savingToLib || !saveToLibForm.title.trim()}
              sx={{ bgcolor: "#1d4ed8", "&:hover": { bgcolor: "#1e40af" } }}
            >
              {savingToLib ? <CircularProgress size={14} sx={{ mr: 1, color: "#fff" }} /> : null}
              Save to Library
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default AutomationBuilder;
