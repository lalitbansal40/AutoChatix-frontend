import {
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";

/* ── Available API reference shown inside the editor ── */
const API_ITEMS = [
  { label: "vars.key",                               desc: "Read session variable (read-only)"              },
  { label: "setVar('key', value)",                   desc: "Save/update a session variable"                 },
  { label: "getVar('key')",                          desc: "Read session variable (alias for vars.key)"     },
  { label: "await send.text(msg)",                   desc: "Send a plain text message"                      },
  { label: "await send.buttons(msg, [{id,title}])",  desc: "Send message with up to 3 reply buttons"        },
  { label: "await send.list(body, btnText, sections)", desc: "Send interactive list (sections + rows)"      },
  { label: "await send.listFromArray(body, btn, arr, mapper, sectionTitle?)", desc: "Build list dynamically from any array" },
  { label: "await send.carouselFromArray(body, arr, mapper, header?)", desc: "Build carousel dynamically from any array" },
  { label: "await send.image(url, caption?)",        desc: "Send an image"                                  },
  { label: "await send.video(url, caption?)",        desc: "Send a video"                                   },
  { label: "await send.document(url, caption?)",     desc: "Send a document/PDF"                            },
  { label: "goto('nodeId')",                         desc: "Jump to a specific node, bypassing next edge"   },
  { label: "await fetch(url, opts?)",                desc: "HTTP request — only http/https URLs allowed"    },
];

const EXAMPLES = [
  {
    title: "Calculate & reply",
    code: `const total = parseFloat(vars.qty) * parseFloat(vars.price);
setVar('total', total);
await send.text(\`Your total is $\${total.toFixed(2)}\`);`,
  },
  {
    title: "Conditional goto",
    code: `if (parseInt(vars.age) >= 18) {
  goto('adult_node_id');
} else {
  await send.text("You must be 18+ to proceed.");
}`,
  },
  {
    title: "API → dynamic list",
    code: `const res = await fetch('https://api.example.com/products');
const { products } = await res.json();
setVar('product_count', products.length);
await send.listFromArray(
  "Pick a product:",
  "View Products",
  products,
  (p, i) => ({ id: p.id, title: p.name, description: \`$\${p.price}\` }),
  "Available Products"
);`,
  },
  {
    title: "API → dynamic carousel",
    code: `const res = await fetch('https://api.example.com/items');
const { items } = await res.json();
await send.carouselFromArray(
  "Browse our collection:",
  items,
  (item, i) => ({
    id: item.id,
    title: item.name,
    description: item.description,
    image: item.imageUrl,
    buttons: [{ id: 'select_' + item.id, title: 'Select' }],
  })
);`,
  },
  {
    title: "Send buttons",
    code: `await send.buttons("Choose a plan:", [
  { id: "basic",      title: "Basic  – $9/mo"  },
  { id: "pro",        title: "Pro    – $29/mo" },
  { id: "enterprise", title: "Enterprise"      },
]);`,
  },
];

const EvalNodeEditor = ({
  node,
  updateNodeData,
}: {
  node: any;
  updateNodeData: (id: string, data: any) => void;
}) => {
  const data = node.data || {};
  const code: string = data.code ?? "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: "#f5f3ff", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          ⚡️
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Eval Node</Typography>
          <Typography sx={{ fontSize: 11, color: "#6b7280" }}>Run custom JavaScript inside the automation</Typography>
        </Box>
      </Box>

      {/* ── Code editor ── */}
      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 0.75 }}>
          Code
        </Typography>
        <Box
          component="textarea"
          value={code}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            updateNodeData(node.id, { code: e.target.value })
          }
          spellCheck={false}
          placeholder={"// Write JavaScript here\nawait send.text('Hello ' + vars.name);"}
          sx={{
            width: "100%",
            minHeight: 240,
            resize: "vertical",
            fontFamily: "'Fira Mono', 'Cascadia Code', 'JetBrains Mono', 'Courier New', monospace",
            fontSize: 12.5,
            lineHeight: 1.7,
            color: "#1e1b4b",
            bgcolor: "#1e1b4b0a",
            border: "1.5px solid #ddd6fe",
            borderRadius: "8px",
            px: 1.5,
            py: 1.25,
            outline: "none",
            boxSizing: "border-box",
            "&:focus": {
              border: "1.5px solid #7c3aed",
              bgcolor: "#fff",
            },
          }}
        />
        <Typography sx={{ fontSize: 10.5, color: "#9ca3af", mt: 0.5 }}>
          Top-level <code>await</code> is supported. All errors are caught and logged.
        </Typography>
      </Box>

      {/* ── Quick-insert examples ── */}
      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 0.75 }}>
          Quick Examples
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {EXAMPLES.map((ex) => (
            <Tooltip key={ex.title} title={`Insert: ${ex.title}`} arrow placement="top">
              <Chip
                label={ex.title}
                size="small"
                onClick={() => updateNodeData(node.id, { code: ex.code })}
                sx={{
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  bgcolor: "#f5f3ff", color: "#5b21b6",
                  border: "1px solid #ddd6fe",
                  "&:hover": { bgcolor: "#ede9fe", borderColor: "#7c3aed" },
                }}
              />
            </Tooltip>
          ))}
        </Stack>
      </Box>

      {/* ── API Reference ── */}
      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, mb: 0.75 }}>
          Available Functions
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, bgcolor: "#fafafa", border: "1px solid #f3f4f6", borderRadius: "8px", p: 1.25 }}>
          {API_ITEMS.map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "baseline", gap: 1, py: 0.25 }}>
              <Typography
                sx={{
                  fontFamily: "monospace", fontSize: 11, color: "#5b21b6", fontWeight: 600,
                  flexShrink: 0, minWidth: 200, whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                — {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Variable hint ── */}
      <Box sx={{ bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", px: 1.5, py: 1.25 }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#92400e", mb: 0.5 }}>
          💡 Session Variables
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#78350f", lineHeight: 1.6 }}>
          All contact attributes are available under <code>vars</code>.<br />
          Use <code>setVar('key', value)</code> to save data that subsequent nodes can read.<br />
          Example: <code>setVar('discount', 15)</code> → next node reads <code>{`{{discount}}`}</code>
        </Typography>
      </Box>

    </Box>
  );
};

export default EvalNodeEditor;
