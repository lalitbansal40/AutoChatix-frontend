import React, { useState, useRef } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tab, Tabs, Box, TextField, Typography,
  Grid, Card, CardContent, CardActions, Chip, Stack,
  InputAdornment, CircularProgress, Alert, IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery } from "@tanstack/react-query";
import automationLibraryService, { LibraryItem } from "service/automationLibrary.service";
import { remapAutomationIds, parseAutomationJson } from "utils/automationIdRemapper";

const CATEGORIES = [
  { value: "all", label: "All", emoji: "🌐" },
  { value: "hotel_hospitality", label: "Hotel", emoji: "🏨" },
  { value: "tours_travel", label: "Travel", emoji: "✈️" },
  { value: "ecommerce", label: "E-Commerce", emoji: "🛍️" },
  { value: "real_estate", label: "Real Estate", emoji: "🏠" },
  { value: "salon_spa", label: "Salon", emoji: "💅" },
  { value: "clinic_healthcare", label: "Clinic", emoji: "🏥" },
  { value: "whatsapp_forms", label: "WA Forms", emoji: "📝" },
  { value: "education", label: "Education", emoji: "📚" },
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "general", label: "General", emoji: "⚙️" },
];

const TRIGGERS: Record<string, string> = {
  new_message_received: "Incoming Message",
  webhook_received: "Webhook",
  call_completed: "Call Completed",
  call_missed: "Call Missed",
  integration_trigger: "Integration",
};

interface ImportResult {
  nodes: any[];
  edges: any[];
  trigger?: string;
  trigger_config?: any;
  keywords?: string[];
  name?: string;
}

interface ImportAutomationModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with remapped nodes/edges ready to inject into builder */
  onImport: (result: ImportResult) => void;
  isSuperAdmin?: boolean;
}

/* ─────────────────────────────────────────────
   LIBRARY TAB
───────────────────────────────────────────── */
function LibraryTab({ onImport }: { onImport: (result: ImportResult) => void }) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["library-for-import", category, debouncedSearch],
    queryFn: async () => {
      const res = await automationLibraryService.list({
        category: category === "all" ? undefined : category,
        search: debouncedSearch || undefined,
        active_only: true,
      });
      return res.data.data;
    },
  });

  const handleUse = async (item: LibraryItem) => {
    try {
      setLoadingId(item._id);
      const res = await automationLibraryService.getForImport(item._id);
      const d = res.data.data;
      onImport({
        nodes: d.nodes,
        edges: d.edges,
        trigger: d.trigger,
        trigger_config: d.trigger_config,
        keywords: d.keywords,
        name: d.title,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to load template");
    } finally {
      setLoadingId(null);
    }
  };

  const items: LibraryItem[] = data || [];

  return (
    <Box>
      {/* Search + Category filter */}
      <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap" gap={1}>
        <TextField
          size="small" placeholder="Search templates..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: "#9ca3af" }} /></InputAdornment> }}
          sx={{ width: 220 }}
        />
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          {CATEGORIES.map(c => (
            <Chip
              key={c.value} label={`${c.emoji} ${c.label}`}
              onClick={() => setCategory(c.value)}
              variant={category === c.value ? "filled" : "outlined"}
              size="small"
              sx={{
                cursor: "pointer", fontSize: 11,
                bgcolor: category === c.value ? "#16a34a" : "transparent",
                color: category === c.value ? "#fff" : "inherit",
                borderColor: category === c.value ? "#16a34a" : "#e5e7eb",
              }}
            />
          ))}
        </Stack>
      </Stack>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} sx={{ color: "#16a34a" }} /></Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={4}>
          <LibraryBooksIcon sx={{ fontSize: 40, color: "#d1d5db", mb: 1 }} />
          <Typography color="text.secondary" fontSize={13}>No templates found</Typography>
        </Box>
      ) : (
        <Grid container spacing={1.5} sx={{ maxHeight: 400, overflowY: "auto", pr: 0.5 }}>
          {items.map(item => {
            const cat = CATEGORIES.find(c => c.value === item.category);
            return (
              <Grid item xs={12} sm={6} key={item._id}>
                <Card
                  sx={{
                    border: "1px solid #e5e7eb", borderRadius: 2,
                    boxShadow: "none",
                    "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderColor: "#16a34a" },
                  }}
                >
                  <CardContent sx={{ pb: "8px !important", pt: 1.5, px: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Chip
                        label={`${cat?.emoji || "⚙️"} ${cat?.label || item.category}`}
                        size="small"
                        sx={{ fontSize: 10, height: 18, bgcolor: "#f3f4f6" }}
                      />
                      <Chip
                        label={TRIGGERS[item.trigger] || item.trigger}
                        size="small"
                        sx={{ fontSize: 10, height: 18, bgcolor: "#fff7ed", color: "#c2410c" }}
                      />
                    </Stack>
                    <Typography fontWeight={700} fontSize={13} mb={0.25}>{item.title}</Typography>
                    {item.preview_message && (
                      <Typography fontSize={11.5} color="text.secondary" sx={{
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {item.preview_message}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 1.5, pt: 0 }}>
                    <Button
                      size="small" variant="contained"
                      onClick={() => handleUse(item)}
                      disabled={loadingId === item._id}
                      sx={{
                        fontSize: 11, py: 0.3, borderRadius: 1.5,
                        bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" },
                      }}
                    >
                      {loadingId === item._id ? <CircularProgress size={12} sx={{ mr: 0.5, color: "#fff" }} /> : null}
                      Import to Builder
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important" }}>
                      {item.import_count} uses
                    </Typography>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

/* ─────────────────────────────────────────────
   JSON TAB
───────────────────────────────────────────── */
function JsonTab({ onImport }: { onImport: (result: ImportResult) => void }) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setJsonText((ev.target?.result as string) || "");
      setError("");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = () => {
    const result = parseAutomationJson(jsonText);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Client-side remap (JSON import path)
    const remapped = remapAutomationIds({ nodes: result.data.nodes, edges: result.data.edges, trigger_config: result.data.trigger_config });
    onImport({
      nodes: remapped.nodes,
      edges: remapped.edges,
      trigger: result.data.trigger,
      trigger_config: remapped.trigger_config,
      keywords: result.data.keywords,
      name: result.data.name,
    });
  };

  return (
    <Box>
      <Alert severity="info" sx={{ fontSize: 12, mb: 2 }}>
        Paste a JSON exported from AutoChatix or upload the .json file. All IDs will be automatically remapped.
      </Alert>

      <Stack direction="row" spacing={1} mb={1.5}>
        <Button
          variant="outlined" size="small" startIcon={<UploadFileIcon />}
          onClick={() => fileRef.current?.click()}
          sx={{ fontSize: 12 }}
        >
          Upload .json File
        </Button>
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={handleFile} />
      </Stack>

      <TextField
        multiline rows={10} fullWidth size="small"
        placeholder='{"_autochatix_export":"1.0","name":"My Automation","trigger":"new_message_received","nodes":[...],"edges":[]}'
        value={jsonText}
        onChange={e => { setJsonText(e.target.value); setError(""); }}
        error={!!error}
        helperText={error}
        sx={{ "& textarea": { fontFamily: "monospace", fontSize: 12 } }}
      />

      <Button
        variant="contained" size="small"
        onClick={handleImport}
        disabled={!jsonText.trim()}
        sx={{
          mt: 1.5, bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" },
          fontSize: 12, borderRadius: 1.5,
        }}
      >
        Parse & Import to Builder
      </Button>
    </Box>
  );
}

/* ─────────────────────────────────────────────
   MAIN MODAL
───────────────────────────────────────────── */
export default function ImportAutomationModal({
  open, onClose, onImport, isSuperAdmin = false,
}: ImportAutomationModalProps) {
  const [tab, setTab] = useState(0);

  const handleImport = (result: ImportResult) => {
    onImport(result);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LibraryBooksIcon sx={{ color: "#16a34a", fontSize: 20 }} />
          <span>Import Automation</span>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: "#6b7280" }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: "1px solid #e5e7eb", px: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40, "& .MuiTab-root": { fontSize: 13, py: 1, minHeight: 40 } }}>
          <Tab label="📚 From Library" />
          <Tab label="📋 From JSON" />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        {tab === 0 && <LibraryTab onImport={handleImport} />}
        {tab === 1 && <JsonTab onImport={handleImport} />}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Importing will replace current nodes & edges in the builder. Save after importing.
        </Typography>
        <Button onClick={onClose} size="small">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
