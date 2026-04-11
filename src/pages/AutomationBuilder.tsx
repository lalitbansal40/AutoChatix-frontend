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

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [nodeType, setNodeType] = useState("");
  const [fromNode, setFromNode] = useState("");
  const [toNode, setToNode] = useState("");
  const [condition, setCondition] = useState("");

  /* =========================
     CREATE NODE
  ========================= */
  const createNode = (type: string) => {
    if (!type) return;

    const config = NODE_CONFIG[type] || {};
    const nodeId = `${type}_${Date.now()}`;

    const newNode: Node<CustomNodeData> = {
      id: nodeId,
      type: "default",
      position: { x: 200, y: 200 },
      data: {
        id: nodeId,
        type,
        label: type,
        ...config,
      },
    };

    setNodes((prev) => [...prev, newNode]);
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
        <Select
          size="small"
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value)}
          displayEmpty
        >
          <MenuItem value="">Select Node</MenuItem>
          <MenuItem value="trigger">Trigger</MenuItem>
          <MenuItem value="auto_reply">Auto Reply</MenuItem>
          <MenuItem value="ask_location">Ask Location</MenuItem>
          <MenuItem value="address_message">Address</MenuItem>
          <MenuItem value="distance_check">Distance Check</MenuItem>
          <MenuItem value="send_flow">Send Flow</MenuItem>
          <MenuItem value="google_sheet">Google Sheet</MenuItem>
          <MenuItem value="razorpay_payment">Payment</MenuItem>
          <MenuItem value="borzo_delivery">Delivery</MenuItem>
        </Select>

        <Button onClick={() => createNode(nodeType)} variant="contained">
          + Node
        </Button>

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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(e, node) => setSelectedNode(node)}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>

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