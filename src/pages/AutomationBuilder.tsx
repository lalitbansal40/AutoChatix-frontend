import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Stack,
  Typography,
  Button,
  MenuItem,
  Select
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


type CustomNodeData = {
  id: string;
  type: string;
  label?: string;
  message?: string;
  buttons?: any[];
  [key: string]: any;
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

  auto_reply: {
    message: "",
    buttons: [],
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
    node.position = { x: pos.x, y: pos.y };
  });

  return { nodes, edges };
};

const AutomationBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const [contextMenu, setContextMenu] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [fromNode, setFromNode] = useState("");
  const [toNode, setToNode] = useState("");
  const [condition, setCondition] = useState("");

  /* =========================
     CREATE NODE
  ========================= */
  const createNode = (type: string) => {
    if (!type || !contextMenu) return;

    const config = NODE_CONFIG[type] || {};
    const nodeId = `${type}_${Date.now()}`;

    const newNode: Node<CustomNodeData> = {
      id: nodeId,
      type: "default",
      position: {
        x: contextMenu.x,
        y: contextMenu.y,
      },
      data: {
        id: nodeId,
        type,
        label: type,
        ...config,
      },
    };

    setNodes((prev) => [...prev, newNode]);

    // 🔥 AUTO CONNECT
    if (selectedNode) {
      setEdges((prev) => [
        ...prev,
        {
          id: `${selectedNode.id}-${nodeId}`,
          source: selectedNode.id,
          target: nodeId,
          animated: true,
        },
      ]);
    }

    setContextMenu(null);
  };

  const CustomNode = ({ data }: NodeProps<CustomNodeData>) => {
    return (
      <Box sx={{ p: 1, border: "1px solid #ddd", borderRadius: 2 }}>
        <div>{data.label}</div>

        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </Box>
    );
  };

  const nodeTypes = {
    default: CustomNode,
  };

  const onConnect = (params: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...params,
          animated: true,
        },
        eds
      )
    );
  };

  const onEdgeClick = (_: any, edge: Edge) => {
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
  };
  /* =========================
     CREATE EDGE
  ========================= */
  const createEdge = () => {
    if (!fromNode || !toNode) return;

    setEdges((prev) => [
      ...prev,
      {
        id: `${fromNode}-${toNode}-${Date.now()}`,
        source: fromNode,
        target: toNode,
        label: condition,
        animated: true,
      },
    ]);

    setCondition("");
  };

  const handleCanvasClick = (event: any) => {
    setSelectedNode(null); // ✅ close popup
    const bounds = event.currentTarget.getBoundingClientRect();

    setContextMenu({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  };

  /* =========================
     SAVE
  ========================= */
  const saveAutomation = async () => {
    try {
      const formattedNodes = nodes.map((n) => {
        return {
          ...n.data,        // ✅ already typed
          id: n.id,         // override safe
          type: n.data.type // ensure exists
        };
      });

      const formattedEdges = edges.map((e) => ({
        from: e.source,
        to: e.target,
        condition:
          typeof e.label === "string" ? e.label : "", // ✅ strict fix
      }));

      await automationService.updateAutomation(id!, {
        nodes: formattedNodes,
        edges: formattedEdges,
      });

      alert("✅ Saved");
    } catch (err) {
      console.error(err);
      alert("❌ Save failed");
    }
  };


  const onEdgeContextMenu = (event: any, edge: Edge) => {
    event.preventDefault();

    if (window.confirm("Delete this connection?")) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
  };
  /* =========================
     FETCH
  ========================= */
  const { data, isLoading, isError } = useQuery({
    queryKey: ["automation", id],
    queryFn: () => automationService.getAutomationById(id!),
    enabled: !!id,
  });

  /* =========================
     LOAD FLOW
  ========================= */
  useEffect(() => {
    if (!data) return;

    const flowNodes: Node<CustomNodeData>[] = data.nodes.map((node: any) => ({
      id: node.id,
      type: "default",
      position: { x: 0, y: 0 },
      data: { ...node, label: node.type },
    }));

    const flowEdges: Edge[] = data.edges.map((edge: any, i: number) => ({
      id: `${edge.from}-${edge.to}-${i}`,
      source: edge.from,
      target: edge.to,
      label: edge.condition || "",
      animated: true,
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } =
      getLayoutedElements(flowNodes, flowEdges);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  /* =========================
     UPDATE NODE
  ========================= */
  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, [key]: value } }
          : n
      )
    );

    setSelectedNode((prev) =>
      prev ? { ...prev, data: { ...prev.data, [key]: value } } : prev
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
      height="calc(100vh - 70px)"
      sx={{
        background: "#f5f5f5",
        position: "relative"   // 🔥 ADD THIS
      }}
    >
      {/* HEADER */}
      <Stack direction="row" spacing={2} p={2} flexWrap="wrap">
        {contextMenu && (
          <Box
            sx={{
              position: "absolute",
              top: contextMenu.y,
              left: contextMenu.x,
              background: "#fff",
              borderRadius: 2,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              zIndex: 2000,
              p: 1,
              minWidth: 180,
            }}
          >
            <MenuItem onClick={() => createNode("trigger")}>
              Trigger
            </MenuItem>

            <MenuItem onClick={() => createNode("auto_reply")}>
              Auto Reply
            </MenuItem>

            <MenuItem onClick={() => createNode("ask_location")}>
              Ask Location
            </MenuItem>

            <MenuItem onClick={() => createNode("address_message")}>
              Address Message
            </MenuItem>

            <MenuItem onClick={() => createNode("distance_check")}>
              Distance Check
            </MenuItem>

            <MenuItem onClick={() => createNode("google_sheet")}>
              Google Sheet
            </MenuItem>

            <MenuItem onClick={() => createNode("razorpay_payment")}>
              Payment
            </MenuItem>

            <MenuItem onClick={() => createNode("borzo_delivery")}>
              Delivery
            </MenuItem>
          </Box>
        )}

        <Select size="small" value={fromNode} onChange={(e) => setFromNode(e.target.value)}>
          <MenuItem value="">From</MenuItem>
          {nodes.map((n) => (
            <MenuItem key={n.id} value={n.id}>
              {n.data?.label || n.data?.type}
            </MenuItem>
          ))}
        </Select>

        <Select size="small" value={toNode} onChange={(e) => setToNode(e.target.value)}>
          <MenuItem value="">To</MenuItem>
          {nodes.map((n) => (
            <MenuItem key={n.id} value={n.id}>
              {n.data?.label || n.data?.type}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <MenuItem value="">Condition</MenuItem>

          {nodes
            .find((n) => n.id === fromNode)
            ?.data?.buttons?.map((btn: any) => (
              <MenuItem key={btn.id} value={btn.id}>
                {btn.title}
              </MenuItem>
            ))}
        </Select>

        <Button variant="outlined" onClick={createEdge}>
          + Edge
        </Button>

        <Button variant="contained" color="success" onClick={saveAutomation}>
          Save
        </Button>
      </Stack>

      {/* FLOW */}
      <Box
        sx={{ width: "100%", height: "100%" }}
        onClick={(e) => {
          const target = e.target as HTMLElement;

          // 🔥 if clicked inside node → ignore
          if (target.closest(".react-flow__node")) return;

          // 🔥 otherwise it's canvas
          handleCanvasClick(e);
        }}
        onContextMenu={(e) => {
          e.preventDefault();

          const target = e.target as HTMLElement;

          if (target.closest(".react-flow__node")) return;

          handleCanvasClick(e);
        }}
      >
        <ReactFlow
          nodeTypes={nodeTypes}
          deleteKeyCode={["Backspace", "Delete"]}
          onNodesDelete={(deleted) => {
            const deletedIds = deleted.map((n) => n.id);

            setEdges((eds) =>
              eds.filter(
                (e) =>
                  !deletedIds.includes(e.source) &&
                  !deletedIds.includes(e.target)
              )
            );
          }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(e, node) => {
            e.stopPropagation(); // 🔥 VERY IMPORTANT
            setSelectedNode(node);
          }}
          onConnect={onConnect}
          elementsSelectable={true}
          nodesDraggable={true}
          edgesFocusable={true}
          onEdgeClick={onEdgeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </Box>

      {/* POPUP */}
      {selectedNode && (
        <NodeOpenPopup
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          updateNodeData={updateNodeData}
        />
      )}
    </Box>
  );
};

export default AutomationBuilder;