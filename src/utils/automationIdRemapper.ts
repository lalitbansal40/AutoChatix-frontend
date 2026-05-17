/**
 * Client-side automation ID remapper.
 * Remaps ALL IDs (nodes, buttons, list rows, carousel cards/buttons, branches)
 * and updates edge references. Used before importing any automation
 * to prevent ID collisions with existing automations.
 */

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const genId = (len = 16): string =>
  Array.from({ length: len }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join("");

export interface AutomationData {
  nodes: any[];
  edges: any[];
  trigger_config?: any;
}

export function remapAutomationIds(data: AutomationData): AutomationData {
  const nodeMap = new Map<string, string>();
  const condMap = new Map<string, string>();

  // Pass 1: build node ID map
  for (const node of data.nodes) {
    if (node.id) nodeMap.set(node.id, genId(16));
  }

  // Pass 2: remap all internal IDs within each node
  const nodes = data.nodes.map((node: any) => {
    const remapped: any = { ...node, id: nodeMap.get(node.id) ?? genId(16) };

    // buttons[] (auto_reply, call_to_action, list cta, etc.)
    if (Array.isArray(node.buttons)) {
      remapped.buttons = node.buttons.map((btn: any) => {
        if (!btn?.id) return btn;
        const nid = genId(16);
        condMap.set(btn.id, nid);
        return { ...btn, id: nid };
      });
    }

    // sections[].rows[] (list node)
    if (Array.isArray(node.sections)) {
      remapped.sections = node.sections.map((sec: any) => ({
        ...sec,
        rows: Array.isArray(sec.rows)
          ? sec.rows.map((row: any) => {
              if (!row?.id) return row;
              const nid = genId(16);
              condMap.set(row.id, nid);
              return { ...row, id: nid };
            })
          : sec.rows,
      }));
    }

    // items[] (send_flow items / razorpay items)
    if (Array.isArray(node.items)) {
      remapped.items = node.items.map((item: any) => {
        if (!item?.id) return item;
        const nid = genId(16);
        condMap.set(item.id, nid);
        return { ...item, id: nid };
      });
    }

    // cards[] + cards[].buttons[] (carousel)
    if (Array.isArray(node.cards)) {
      remapped.cards = node.cards.map((card: any) => {
        const cardId = genId(16);
        if (card.id) condMap.set(card.id, cardId);
        const buttons = Array.isArray(card.buttons)
          ? card.buttons.map((btn: any) => {
              if (!btn?.id) return btn;
              const nid = genId(16);
              condMap.set(btn.id, nid);
              return { ...btn, id: nid };
            })
          : card.buttons;
        return { ...card, id: cardId, buttons };
      });
    }

    // branches[] (condition_router)
    if (Array.isArray(node.branches)) {
      remapped.branches = node.branches.map((branch: any) => {
        if (!branch?.id) return branch;
        const nid = genId(16);
        condMap.set(branch.id, nid);
        return { ...branch, id: nid };
      });
    }

    return remapped;
  });

  // Pass 3: remap edges (from, to, condition)
  const edges = data.edges.map((edge: any) => ({
    from: nodeMap.get(edge.from) ?? edge.from,
    to: nodeMap.get(edge.to) ?? edge.to,
    condition: edge.condition
      ? (condMap.get(edge.condition) ?? edge.condition)
      : edge.condition,
  }));

  return { nodes, edges, trigger_config: data.trigger_config };
}

/** Export a clean JSON string from automation data (strips account/channel-specific fields) */
export function exportAutomationJson(automation: any): string {
  const exportData = {
    _autochatix_export: "1.0",
    name: automation.name || "Unnamed Automation",
    trigger: automation.trigger || "new_message_received",
    trigger_config: automation.trigger_config || undefined,
    keywords: automation.keywords || [],
    nodes: (automation.nodes || []).map((n: any) => {
      // Strip position so import auto-layouts cleanly
      const { position, ...rest } = n;
      return rest;
    }),
    edges: automation.edges || [],
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Clone selected ReactFlow nodes + their internal edges.
 * Remaps all node IDs, button/row/branch IDs, and edge source/target/sourceHandle.
 * Returns cloned nodes (offset by offsetX/offsetY) and edges — ready to add to canvas.
 */
export function cloneReactFlowNodes(
  selectedNodes: any[],
  allEdges: any[],
  offsetX = 320,
  offsetY = 200,
): { nodes: any[]; edges: any[] } {
  const selectedIds = new Set(selectedNodes.map((n) => n.id));
  const relevantEdges = allEdges.filter(
    (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
  );

  const nodeMap = new Map<string, string>();
  const condMap = new Map<string, string>();

  // Pass 1: build node ID map
  for (const node of selectedNodes) {
    nodeMap.set(node.id, genId(16));
  }

  // Pass 2: remap node data (ReactFlow: properties live in node.data)
  const nodes = selectedNodes.map((node: any) => {
    const newId = nodeMap.get(node.id)!;
    const data = { ...(node.data || {}) };

    if (Array.isArray(data.buttons)) {
      data.buttons = data.buttons.map((btn: any) => {
        if (!btn?.id) return btn;
        const nid = genId(16);
        condMap.set(btn.id, nid);
        return { ...btn, id: nid };
      });
    }

    if (Array.isArray(data.sections)) {
      data.sections = data.sections.map((sec: any) => ({
        ...sec,
        rows: Array.isArray(sec.rows)
          ? sec.rows.map((row: any) => {
              if (!row?.id) return row;
              const nid = genId(16);
              condMap.set(row.id, nid);
              return { ...row, id: nid };
            })
          : sec.rows,
      }));
    }

    if (Array.isArray(data.items)) {
      data.items = data.items.map((item: any) => {
        if (!item?.id) return item;
        const nid = genId(16);
        condMap.set(item.id, nid);
        return { ...item, id: nid };
      });
    }

    if (Array.isArray(data.cards)) {
      data.cards = data.cards.map((card: any) => {
        const cardId = genId(16);
        if (card.id) condMap.set(card.id, cardId);
        const buttons = Array.isArray(card.buttons)
          ? card.buttons.map((btn: any) => {
              if (!btn?.id) return btn;
              const nid = genId(16);
              condMap.set(btn.id, nid);
              return { ...btn, id: nid };
            })
          : card.buttons;
        return { ...card, id: cardId, buttons };
      });
    }

    if (Array.isArray(data.branches)) {
      data.branches = data.branches.map((branch: any) => {
        if (!branch?.id) return branch;
        const nid = genId(16);
        condMap.set(branch.id, nid);
        return { ...branch, id: nid };
      });
    }

    return {
      ...node,
      id: newId,
      selected: false,
      position: {
        x: (node.position?.x ?? 0) + offsetX,
        y: (node.position?.y ?? 0) + offsetY,
      },
      data,
    };
  });

  // Pass 3: remap edges
  const edges = relevantEdges.map((edge: any) => ({
    ...edge,
    id: genId(16),
    source: nodeMap.get(edge.source) ?? edge.source,
    target: nodeMap.get(edge.target) ?? edge.target,
    sourceHandle: edge.sourceHandle
      ? (condMap.get(edge.sourceHandle) ?? edge.sourceHandle)
      : edge.sourceHandle,
    selected: false,
  }));

  return { nodes, edges };
}

/** Validate that a JSON string is a valid AutoChatix export */
export function parseAutomationJson(json: string): { ok: true; data: any } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed._autochatix_export) {
      return { ok: false, error: "Not a valid AutoChatix export file. Missing _autochatix_export marker." };
    }
    if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      return { ok: false, error: "Export file has no nodes." };
    }
    if (!Array.isArray(parsed.edges)) {
      return { ok: false, error: "Export file has no edges array." };
    }
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, error: "Invalid JSON format." };
  }
}
