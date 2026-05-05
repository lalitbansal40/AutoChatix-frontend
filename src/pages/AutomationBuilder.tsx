import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SaveIcon from "@mui/icons-material/Save";
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
import { useQuery } from "@tanstack/react-query";
import automationService from "service/automation.service";
import * as dagre from "dagre";
import NodeOpenPopup from "components/NodeOpenPopup";
import { MarkerType } from "reactflow";
import { Dialog, DialogContent, TextField, Avatar, Divider } from "@mui/material";
import CustomEdge from "components/customedge";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useIntegrationCatalog } from "hooks/useIntegrationCatalog";
import { IntegrationDefinition } from "types/integration";


type CustomNodeData = {
  id: string;
  type: string;
  label?: string;
  message?: string;
  buttons?: any[];
  [key: string]: any;
};

const edgeTypes = {
  custom: CustomEdge,
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

  razorpay_payment: {
    config: {
      item_amount: "",
      delivery_amount: "",
    },
  },

  borzo_delivery: {
    borzo_action: "calculate",
    pickup: {},
    drop: {},
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
  borzo_delivery: { color: "#dc2626", bg: "#fef2f2", icon: "🚚", label: "Borzo" },
  distance_check: { color: "#6366f1", bg: "#eef2ff", icon: "📏", label: "Distance" },
  integration_action: { color: "#0891b2", bg: "#ecfeff", icon: "🔌", label: "Integration" },
};
const DEFAULT_STYLE = { color: "#6b7280", bg: "#f9fafb", icon: "⚙️", label: "Node" };

const CustomNode = React.memo(({ data, id }: NodeProps<CustomNodeData>) => {
  const { disconnectRow } = data;
  const ns = NODE_STYLE[data.type] || DEFAULT_STYLE;

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
        (!Array.isArray(data.list) || data.list.length === 0) && (
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
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [createNodePos, setCreateNodePos] = useState<any>(null);
  const [openTriggerPopup, setOpenTriggerPopup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [input, setInput] = useState("");

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
    const nodeId = `${type}_${Date.now()}`;

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

    setNodes((prev) => {
      const updated = [...prev, newNode];
      return updated;
    });

    setCreateNodePos(null);
    setSelectedNode(newNode);

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
          sections.length > 0
            ? "list"
            : n.data?.type || "auto_reply";

        return {
          ...n.data,
          id: n.id,
          type: nodeType,
          sections,
          position: n.position,

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

  const integrationWebhookUrl = useMemo(() => {
    if (!integrationTriggerInfo) return "";
    const slug = integrationTriggerInfo.app.slug;
    const accountId = automation?.account_id;
    const ch = channelId;
    const base = apiBase || `${window.location.protocol}//${window.location.host}`;
    return `${base.replace(/\/+$/, "")}/api/integrations/webhook/${slug}?account_id=${accountId}&channel_id=${ch}`;
  }, [integrationTriggerInfo, automation?.account_id, channelId, apiBase]);

  /* =========================
     LOAD FLOW
  ========================= */
  useEffect(() => {
    if (!data) return;

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
    if (nodes.length === 0) {
      const triggerNode: Node<CustomNodeData> = {
        id: "trigger",
        type: "custom",
        position: { x: 200, y: 200 },
        data: {
          id: "trigger",
          type: "trigger",
          label: "trigger",

          // 🔥 THIS WAS MISSING
          triggerType: "all",
          keywords: []
        },
      };

      setNodes([triggerNode]);
    }
  }, []);


  useEffect(() => {
    const handleClick = (e: any) => {
      const target = e.target as HTMLElement;

      // ✅ Node create popup pe click → ignore
      if (target.closest("[data-node-popup]")) return;

      // 🔥 ADD THIS (VERY IMPORTANT)
      if (target.closest(".MuiDialog-root")) return;

      // 🔥 ADD THIS (ReactFlow nodes pe click ignore)
      if (target.closest(".react-flow__node")) return;

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
        >
          <MenuItem
            onClick={() => {
              closeMenu();
              if (selectedNode) {
                setAnchorEl(null); // menu close
                setSelectedNode(selectedNode); // popup open already handled
              }
            }}
          >
            ✏️ Edit
          </MenuItem>

          <MenuItem
            onClick={() => {
              if (!selectedNode) return;
              const id = selectedNode.id;

              setNodes((nds) =>
                nds.filter((n) => n.id !== id)
              );

              setEdges((eds) =>
                eds.filter(
                  (e) => e.source !== id && e.target !== id
                )
              );

              setSelectedNode(null);
              closeMenu();
            }}
          >
            🗑 Delete
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
          {automation?.trigger === "new_message_received" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 1.25 }}>
                  Trigger On
                </Typography>
                <Stack spacing={1}>
                  {[
                    { value: "all", icon: "📩", title: "All Messages", desc: "Fire for every incoming message" },
                    { value: "keyword", icon: "🔑", title: "Keyword Match", desc: "Only fire when message matches a keyword" },
                  ].map((opt) => {
                    const active = (selectedNode?.data?.triggerType || "all") === opt.value;
                    return (
                      <Box
                        key={opt.value}
                        onClick={() => selectedNode && updateNodeData(selectedNode.id, { triggerType: opt.value })}
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

              {selectedNode?.data?.triggerType === "keyword" && (
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
            </Box>
          )}

          {automation?.trigger === "call_completed" && (
            <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <Typography fontSize={13} color="#166534">
                📞 This automation fires when a call is completed.
              </Typography>
            </Box>
          )}

          {automation?.trigger === "call_missed" && (
            <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
              <Typography fontSize={13} color="#991b1b">
                📵 This automation fires when a call is missed.
              </Typography>
            </Box>
          )}

          {automation?.trigger === "outgoing_message" && (
            <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <Typography fontSize={13} color="#1e40af">
                📤 This automation fires whenever an agent sends a message on this channel.
              </Typography>
            </Box>
          )}

          {automation?.trigger === "webhook_received" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                <Typography fontSize={13} color="#5b21b6">
                  🔗 This automation fires when a custom webhook is invoked.
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 0.75 }}>
                  Webhook URL
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth size="small" InputProps={{ readOnly: true }}
                    value={`${(apiBase || `${typeof window !== "undefined" ? window.location.origin : ""}`).replace(/\/+$/, "")}/webhook/custom?automation_id=${automation?._id}`}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontFamily: "monospace", fontSize: 11.5 } }}
                  />
                </Box>
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
            onClick={() => {
              if (automation?.trigger === "new_message_received") {
                selectedNode && updateNodeData(selectedNode.id, { keywords });
              }
              setOpenTriggerPopup(false);
            }}
            sx={{ borderRadius: "8px", fontWeight: 600, fontSize: 13, px: 2.5, bgcolor: "#f97316", "&:hover": { bgcolor: "#ea580c" }, boxShadow: "none" }}
          >
            Save Settings
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default AutomationBuilder;