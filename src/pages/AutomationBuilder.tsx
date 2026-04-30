import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
} from "@mui/material";
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
import {
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField
} from "@mui/material";
import CustomEdge from "components/customedge";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { IconButton, Menu, MenuItem } from "@mui/material";


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
    spreadsheet_id: "",
    sheet_name: "",
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

const CustomNode = React.memo(({ data, id }: NodeProps<CustomNodeData>) => {
  const { disconnectRow } = data;
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 3,
        background: "#fff",
        minWidth: 220,
        boxShadow: "none",
        border: "1px solid #eee",
        overflow: "visible"

      }}
    >
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography fontSize={12} fontWeight={600}>
          {data.type}
        </Typography>

        {/* 🔥 3 DOT MENU */}
        {data.type !== "trigger" && (
          <>
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                data.setMenuAnchor?.(e.currentTarget);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>

      {/* MESSAGE */}
      {data.message && (
        <Box
          sx={{
            background: "#dcf8c6",
            p: 0.5,
            borderRadius: 1,
            fontSize: 12,
            maxWidth: 220,
            mb: 1,
          }}
        >
          {data.message}
        </Box>
      )}

      {data.type === "set_contact_attribute" && (
        <Box sx={{ background: "#fef3c7", p: 0.5, borderRadius: 1, fontSize: 11 }}>
          {Array.isArray(data.attribute_name)
            ? data.attribute_name.map((k: any, i: number) => (
              <div key={i}>
                {k || "?"} = {data.attribute_value?.[i] || "?"}
              </div>
            ))
            : `${data.attribute_name || "?"} = ${data.attribute_value || "?"}`}
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
                mt: 1,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                fontSize: 12,
                background: "#f8f8f8", // ✅ light bg
                position: "relative",
              }}
            >
              <Typography fontSize={12}>
                {btn?.title || "Untitled"}
              </Typography>

              {/* ✅ HANDLE */}
              <Handle
                type="source"
                position={Position.Right}
                id={buttonId}
                style={{
                  width: 10,
                  height: 10,
                  background: "#25D366",
                  borderRadius: "50%",
                  position: "absolute",
                  right: -6,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            </Box>
          );
        })
      )}

      {/* 🔥 LIST ITEMS */}
      {Array.isArray(data.list) && data.list.length > 0 &&
        data.list.map((item: any, index: number) => {
          const itemId = item?.id || `list_${index}`;

          return (
            <Box
              onClick={(e) => {
                e.stopPropagation(); // 🔥 MUST
                disconnectRow?.(id, itemId); // ✅ correct
              }}
              key={itemId}
              sx={{
                mt: 1,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                fontSize: 12,
                background: "#eef6ff", // 🔥 different color
                position: "relative",
                border: "1px solid #dbeafe",
                "&:hover": {
                  background: "#dbeafe",
                },
              }}
            >
              <Typography fontSize={12} fontWeight={500}>
                {item?.title || "Untitled"}
              </Typography>

              {item?.description && (
                <Typography fontSize={11} color="#666">
                  {item.description}
                </Typography>
              )}

              {/* 🔥 HANDLE (same as button) */}
              <Handle
                type="source"
                position={Position.Right}
                id={itemId}
                style={{
                  width: 10,
                  height: 10,
                  background: "#2563eb", // 🔥 blue for list
                  borderRadius: "50%",
                  position: "absolute",
                  right: -6,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
            </Box>
          );
        })}
      {/* TARGET HANDLE */}
      {/* 🟢 TRIGGER → ONLY OUTGOING */}
      {data.type === "trigger" && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: 10,
            height: 10,
            background: "#25D366",
            borderRadius: "50%",
            right: -6,
          }}
        />
      )}

      {/* 🟢 NORMAL NODES → INCOMING */}
      {data.type !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: 10,
            height: 10,
            background: "#555",
            borderRadius: "50%",
            left: -6,
          }}
        />
      )}

      {/* 🟢 NORMAL NODES → DEFAULT OUTGOING (no buttons case) */}
      {data.type !== "trigger" &&
        (!Array.isArray(data.buttons) || data.buttons.length === 0) &&
        (!Array.isArray(data.list) || data.list.length === 0) && (
          <Handle
            type="source"
            position={Position.Right}
            style={{
              width: 10,
              height: 10,
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
      call_completed: "Call Completed",   // 🔥 ADD
      call_missed: "Call Missed",         // 🔥 ADD
    };

    return map[trigger] || trigger;
  };



  /* =========================
     CREATE NODE
  ========================= */
  const createNode = (type: string) => {
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

          // 🔥 ADD THIS LINE (IMPORTANT)
          position: n.position,
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
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography color="error" textAlign="center">
        Failed to load automation
      </Typography>
    );
  }


  return (
    <Box
      display="flex"
      flexDirection="column"
      height="calc(100vh - 70px)"
      sx={{
        background: "#f5f5f5",
        position: "relative"   // 🔥 ADD THIS
      }}
    >

      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {/* LEFT SIDE */}
        <Box display="flex" gap={3} alignItems="center">

          <Typography variant="subtitle2">
            <b>Automation:</b> {automation?.name || "Untitled"}
          </Typography>

          <Typography variant="subtitle2">
            <b>Channel:</b> {automation?.channel_name || "-"}
          </Typography>

          <Typography variant="subtitle2">
            <b>Trigger:</b> {getTriggerLabel(automation?.trigger)}
          </Typography>

        </Box>

        {/* RIGHT SIDE */}
        <Button
          variant="contained"
          color="success"
          onClick={saveAutomation}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 600,
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
            borderRadius: 2,
            boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
            p: 1,
            zIndex: 2000,
          }}
        >
          {Object.keys(NODE_CONFIG).map((type) => (
            <Box
              key={type}
              sx={{ p: 1, cursor: "pointer" }}
              onClick={() => {
                createNode(type);
                setCreateNodePos(null);
              }}
            >
              {type}
            </Box>
          ))}
        </Box>
      )}

      {/* POPUP */}
      {selectedNode && !anchorEl && selectedNode.data?.type && selectedNode.data.type !== "trigger" && (
        <NodeOpenPopup
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          updateNodeData={updateNodeData}
          allNodes={nodes}
        />
      )}

      <Dialog
        open={openTriggerPopup}
        onClose={() => setOpenTriggerPopup(false)}
        maxWidth="sm"     // 🔥 add
        fullWidth         // 🔥 add
      >
        <DialogTitle>Trigger Settings</DialogTitle>

        <DialogContent>
          {/* ================= MESSAGE TRIGGER ================= */}
          {automation?.trigger === "new_message_received" && (
            <>
              <RadioGroup
                value={selectedNode?.data?.triggerType || "all"}
                onChange={(e) =>
                  selectedNode &&
                  updateNodeData(selectedNode.id, {
                    triggerType: e.target.value,
                  })
                }
              >
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label="All Messages"
                />

                <FormControlLabel
                  value="keyword"
                  control={<Radio />}
                  label="Match Exact Keywords"
                />
              </RadioGroup>

              {/* 🔥 Keyword input */}
              {selectedNode?.data?.triggerType === "keyword" && (
                <Box>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      placeholder="Enter keyword"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />

                    <Button
                      variant="contained"
                      onClick={() => {
                        if (!input.trim()) return;

                        setKeywords((prev) => [...prev, input.trim()]);
                        setInput("");
                      }}
                    >
                      Add
                    </Button>
                  </Box>

                  <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                    {keywords.map((k, i) => (
                      <Box
                        key={i}
                        px={2}
                        py={0.5}
                        bgcolor="#25D366"
                        color="#fff"
                        borderRadius={2}
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        {k}
                        <span
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setKeywords((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          ✕
                        </span>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* ================= CALL COMPLETED ================= */}
          {automation?.trigger === "call_completed" && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              This automation will run when a call is completed.
            </Typography>
          )}

          {/* ================= CALL MISSED ================= */}
          {automation?.trigger === "call_missed" && (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              This automation will run when a call is missed.
            </Typography>
          )}

          {/* 🔥 Keyword input */}
          {selectedNode?.data?.triggerType === "keyword" && (
            <Box>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  placeholder="Enter keyword"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />

                <Button
                  variant="contained"
                  onClick={() => {
                    if (!input.trim()) return;

                    setKeywords((prev) => [...prev, input.trim()]);
                    setInput("");
                  }}
                >
                  Add
                </Button>
              </Box>

              <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                {keywords.map((k, i) => (
                  <Box
                    key={i}
                    px={2}
                    py={0.5}
                    bgcolor="#25D366"
                    color="#fff"
                    borderRadius={2}
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    {k}
                    <span
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setKeywords((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      ✕
                    </span>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => {
              if (automation?.trigger === "new_message_received") {
                selectedNode &&
                  updateNodeData(selectedNode.id, {
                    keywords: keywords,
                  });
              }

              setOpenTriggerPopup(false);
            }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AutomationBuilder;