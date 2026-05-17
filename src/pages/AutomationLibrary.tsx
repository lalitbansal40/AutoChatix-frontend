import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Card, CardContent, CardActions,
  Chip, Button, TextField, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Stack, Tooltip, Switch, FormControlLabel,
  CircularProgress, Divider, Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import automationLibraryService, {
  LibraryItem,
  CreateLibraryPayload,
} from "service/automationLibrary.service";
import automationService from "service/automation.service";
import useAuth from "hooks/useAuth";

const CATEGORIES = [
  { value: "all", label: "All Categories", emoji: "🌐" },
  { value: "hotel_hospitality", label: "Hotel & Hospitality", emoji: "🏨" },
  { value: "tours_travel", label: "Tours & Travel", emoji: "✈️" },
  { value: "ecommerce", label: "E-Commerce & Orders", emoji: "🛍️" },
  { value: "real_estate", label: "Real Estate", emoji: "🏠" },
  { value: "salon_spa", label: "Salon & Spa", emoji: "💅" },
  { value: "clinic_healthcare", label: "Clinic & Healthcare", emoji: "🏥" },
  { value: "whatsapp_forms", label: "WhatsApp Forms", emoji: "📝" },
  { value: "education", label: "Education", emoji: "📚" },
  { value: "restaurant", label: "Restaurant & Food", emoji: "🍽️" },
  { value: "general", label: "General", emoji: "⚙️" },
];

const TRIGGERS = [
  { value: "new_message_received", label: "Incoming Message" },
  { value: "webhook_received", label: "Webhook" },
  { value: "call_completed", label: "Call Completed" },
  { value: "call_missed", label: "Call Missed" },
  { value: "integration_trigger", label: "Integration Trigger" },
];

const EMPTY_FORM: CreateLibraryPayload = {
  title: "",
  description: "",
  category: "general",
  tags: [],
  thumbnail: "",
  preview_message: "",
  trigger: "new_message_received",
  keywords: [],
  nodes: [],
  edges: [],
  is_active: true,
};

/* ───────────────────────────────────────────────
   SUPERADMIN FORM DIALOG
─────────────────────────────────────────────── */
interface AdminFormDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: LibraryItem | null;
  onSave: (payload: CreateLibraryPayload, id?: string) => void;
  saving: boolean;
}

function AdminFormDialog({ open, onClose, initial, onSave, saving }: AdminFormDialogProps) {
  const [form, setForm] = useState<CreateLibraryPayload>(
    initial
      ? {
          title: initial.title,
          description: initial.description,
          category: initial.category,
          tags: initial.tags,
          thumbnail: initial.thumbnail || "",
          preview_message: initial.preview_message || "",
          trigger: initial.trigger,
          keywords: initial.keywords,
          nodes: initial.nodes || [],
          edges: initial.edges || [],
          is_active: initial.is_active,
        }
      : EMPTY_FORM
  );
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  React.useEffect(() => {
    if (open) {
      setForm(initial ? {
        title: initial.title,
        description: initial.description,
        category: initial.category,
        tags: initial.tags,
        thumbnail: initial.thumbnail || "",
        preview_message: initial.preview_message || "",
        trigger: initial.trigger,
        keywords: initial.keywords,
        nodes: initial.nodes || [],
        edges: initial.edges || [],
        is_active: initial.is_active,
      } : EMPTY_FORM);
      setJsonText("");
      setJsonError("");
    }
  }, [open, initial]);

  const parseJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed.nodes)) { setJsonError("Missing nodes array"); return; }
      if (!Array.isArray(parsed.edges)) { setJsonError("Missing edges array"); return; }
      setForm(f => ({
        ...f,
        nodes: parsed.nodes,
        edges: parsed.edges,
        trigger: parsed.trigger || f.trigger,
        trigger_config: parsed.trigger_config,
        keywords: parsed.keywords || f.keywords,
        title: f.title || parsed.name || "",
      }));
      setJsonError("");
      setJsonText("");
    } catch {
      setJsonError("Invalid JSON");
    }
  };

  const set = (key: keyof CreateLibraryPayload, val: any) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
        {initial ? "Edit Library Template" : "Add Library Template"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} mt={0.5}>
          <TextField label="Title *" value={form.title} onChange={e => set("title", e.target.value)} size="small" fullWidth />
          <TextField label="Description" value={form.description} onChange={e => set("description", e.target.value)} size="small" fullWidth multiline rows={2} />
          <TextField label="Preview Message (shown on card)" value={form.preview_message} onChange={e => set("preview_message", e.target.value)} size="small" fullWidth />

          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={e => set("category", e.target.value)}>
                {CATEGORIES.filter(c => c.value !== "all").map(c => (
                  <MenuItem key={c.value} value={c.value}>{c.emoji} {c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Trigger</InputLabel>
              <Select value={form.trigger} label="Trigger" onChange={e => set("trigger", e.target.value)}>
                {TRIGGERS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          <TextField
            label="Tags (comma separated)"
            value={form.tags?.join(", ") || ""}
            onChange={e => set("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
            size="small" fullWidth
            helperText="e.g. demo, booking, hotel"
          />
          <TextField
            label="Keywords (comma separated, for trigger matching)"
            value={form.keywords?.join(", ") || ""}
            onChange={e => set("keywords", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
            size="small" fullWidth
          />

          <FormControlLabel
            control={<Switch checked={form.is_active} onChange={e => set("is_active", e.target.checked)} />}
            label="Active (visible to all users)"
          />

          <Divider />

          {/* JSON Import Section */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              📋 Paste Automation JSON (from export or builder)
            </Typography>
            <TextField
              multiline rows={6} fullWidth size="small"
              placeholder='{"_autochatix_export":"1.0","nodes":[...],"edges":[...]}'
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); setJsonError(""); }}
              error={!!jsonError}
              helperText={jsonError}
              sx={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <Button
              variant="outlined" size="small" sx={{ mt: 1 }}
              onClick={parseJson} disabled={!jsonText.trim()}
            >
              Parse & Load Nodes
            </Button>
            {form.nodes.length > 0 && (
              <Chip
                label={`✅ ${form.nodes.length} nodes loaded`}
                color="success" size="small" sx={{ ml: 1 }}
              />
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained" onClick={() => onSave(form, initial?._id)}
          disabled={saving || !form.title || form.nodes.length === 0}
          sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
        >
          {saving ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
          {initial ? "Update Template" : "Save Template"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ───────────────────────────────────────────────
   USE TEMPLATE DIALOG
─────────────────────────────────────────────── */
interface UseTemplateDialogProps {
  open: boolean;
  item: LibraryItem | null;
  onClose: () => void;
}

function UseTemplateDialog({ open, item, onClose }: UseTemplateDialogProps) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [automationName, setAutomationName] = useState("");
  const [channelId, setChannelId] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: channelsData } = useQuery({
    queryKey: ["channels-for-library"],
    queryFn: async () => {
      const res = await (await import("service/channel.service")).channelService.getChannels();
      return res.data?.data || res.data || [];
    },
    enabled: open,
  });
  const channels: any[] = useMemo(() => channelsData || [], [channelsData]);

  React.useEffect(() => {
    if (open && item) {
      setAutomationName(item.title);
      setChannelId(channels[0]?._id || "");
    }
  }, [open, item, channels]);

  const handleCreate = async () => {
    if (!automationName.trim() || !channelId) return;
    try {
      setCreating(true);
      // Fetch remapped nodes/edges from backend
      const importRes = await automationLibraryService.getForImport(item!._id);
      const importData = importRes.data.data;

      const channel = channels.find((c: any) => c._id === channelId);

      const createRes = await automationService.createAutomation({
        name: automationName.trim(),
        channel_id: channelId,
        channel_name: channel?.channel_name || channel?.display_phone_number || "Channel",
        trigger: importData.trigger || "new_message_received",
        trigger_config: importData.trigger_config,
        nodes: importData.nodes,
        edges: importData.edges,
      } as any);

      const newId = createRes.data?.data?._id || createRes.data?._id;
      enqueueSnackbar("Automation created from template!", { variant: "success" });
      onClose();
      navigate(`/automations/${newId}`);
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || "Failed to create automation", { variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
        Use Template: {item?.title}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} mt={0.5}>
          <TextField
            label="Automation Name *"
            value={automationName}
            onChange={e => setAutomationName(e.target.value)}
            size="small" fullWidth autoFocus
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Select Channel *</InputLabel>
            <Select
              value={channelId}
              label="Select Channel *"
              onChange={e => setChannelId(e.target.value)}
            >
              {channels.map((ch: any) => (
                <MenuItem key={ch._id} value={ch._id}>
                  {ch.channel_name || ch.display_phone_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ fontSize: 12 }}>
            All node & button IDs will be automatically remapped — no conflicts with existing automations.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={creating}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={creating || !automationName.trim() || !channelId}
          sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
        >
          {creating ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
          Create Automation
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ───────────────────────────────────────────────
   LIBRARY CARD
─────────────────────────────────────────────── */
interface LibraryCardProps {
  item: LibraryItem;
  isSuperAdmin: boolean;
  onUse: (item: LibraryItem) => void;
  onEdit: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

function LibraryCard({ item, isSuperAdmin, onUse, onEdit, onDelete, onToggle }: LibraryCardProps) {
  const cat = CATEGORIES.find(c => c.value === item.category);

  return (
    <Card
      sx={{
        height: "100%", display: "flex", flexDirection: "column",
        border: "1px solid #e5e7eb", borderRadius: 2.5,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        opacity: item.is_active ? 1 : 0.55,
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.1)" },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Chip
            label={`${cat?.emoji || "⚙️"} ${cat?.label || item.category}`}
            size="small"
            sx={{ fontSize: 10.5, height: 20, bgcolor: "#f3f4f6", color: "#374151", fontWeight: 600 }}
          />
          {!item.is_active && (
            <Chip label="Hidden" size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#fef2f2", color: "#b91c1c" }} />
          )}
        </Stack>

        <Typography variant="subtitle1" fontWeight={700} fontSize={14} mb={0.5} sx={{ lineHeight: 1.3 }}>
          {item.title}
        </Typography>

        {item.preview_message && (
          <Typography variant="body2" color="text.secondary" fontSize={12} sx={{
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", mb: 1,
          }}>
            {item.preview_message}
          </Typography>
        )}

        <Stack direction="row" flexWrap="wrap" gap={0.5} mt={1}>
          {item.tags?.slice(0, 3).map(tag => (
            <Chip key={tag} label={tag} size="small"
              sx={{ fontSize: 10, height: 18, bgcolor: "#eff6ff", color: "#1d4ed8" }} />
          ))}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} mt={1.5}>
          <Chip
            label={`⚡ ${TRIGGERS.find(t => t.value === item.trigger)?.label || item.trigger}`}
            size="small"
            sx={{ fontSize: 10, height: 18, bgcolor: "#fff7ed", color: "#c2410c" }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important" }}>
            {item.import_count} uses
          </Typography>
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 1.5, pt: 0, justifyContent: "space-between" }}>
        <Button
          variant="contained" size="small"
          onClick={() => onUse(item)}
          sx={{
            fontSize: 12, py: 0.5, px: 2, borderRadius: 1.5,
            bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" },
          }}
        >
          Use Template
        </Button>

        {isSuperAdmin && (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={item.is_active ? "Hide from users" : "Show to users"}>
              <Switch
                size="small" checked={item.is_active}
                onChange={() => onToggle(item._id)}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: "#6b7280" }}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(item._id)} sx={{ color: "#ef4444" }}>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </CardActions>
    </Card>
  );
}

/* ───────────────────────────────────────────────
   MAIN PAGE
─────────────────────────────────────────────── */
export default function AutomationLibrary() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<LibraryItem | null>(null);
  const [useItem, setUseItem] = useState<LibraryItem | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["automation-library", category, debouncedSearch, isSuperAdmin],
    queryFn: async () => {
      const res = await automationLibraryService.list({
        category: category === "all" ? undefined : category,
        search: debouncedSearch || undefined,
        active_only: !isSuperAdmin,
      });
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => automationLibraryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-library"] });
      enqueueSnackbar("Template deleted", { variant: "success" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => automationLibraryService.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-library"] }),
  });

  const handleSave = async (payload: CreateLibraryPayload, id?: string) => {
    try {
      setSavingForm(true);
      if (id) {
        await automationLibraryService.update(id, payload);
        enqueueSnackbar("Template updated!", { variant: "success" });
      } else {
        await automationLibraryService.create(payload);
        enqueueSnackbar("Template added to library!", { variant: "success" });
      }
      queryClient.invalidateQueries({ queryKey: ["automation-library"] });
      setFormOpen(false);
      setEditItem(null);
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || "Failed to save", { variant: "error" });
    } finally {
      setSavingForm(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this template from the library?")) return;
    deleteMutation.mutate(id);
  };

  const items: LibraryItem[] = data || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <LibraryBooksIcon sx={{ color: "#16a34a", fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={800} fontSize={20}>Automation Library</Typography>
            <Typography variant="body2" color="text.secondary" fontSize={12}>
              Pre-built automation templates for every industry
            </Typography>
          </Box>
        </Stack>

        {isSuperAdmin && (
          <Button
            variant="contained" startIcon={<AddIcon />}
            onClick={() => { setEditItem(null); setFormOpen(true); }}
            sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, borderRadius: 2 }}
          >
            Add Template
          </Button>
        )}
      </Stack>

      {/* Filters */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" gap={1.5}>
        <TextField
          size="small" placeholder="Search templates..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "#9ca3af" }} /></InputAdornment> }}
          sx={{ width: 260 }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.75}>
          {CATEGORIES.map(c => (
            <Chip
              key={c.value}
              label={`${c.emoji} ${c.label}`}
              onClick={() => setCategory(c.value)}
              variant={category === c.value ? "filled" : "outlined"}
              size="small"
              sx={{
                cursor: "pointer",
                fontWeight: category === c.value ? 700 : 400,
                bgcolor: category === c.value ? "#16a34a" : "transparent",
                color: category === c.value ? "#fff" : "inherit",
                borderColor: category === c.value ? "#16a34a" : "#e5e7eb",
                fontSize: 12,
              }}
            />
          ))}
        </Stack>
      </Stack>

      {/* Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress sx={{ color: "#16a34a" }} />
        </Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" mt={8}>
          <LibraryBooksIcon sx={{ fontSize: 56, color: "#d1d5db", mb: 2 }} />
          <Typography color="text.secondary" fontWeight={600}>No templates found</Typography>
          {isSuperAdmin && (
            <Button variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => setFormOpen(true)}>
              Add First Template
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {items.map(item => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <LibraryCard
                item={item}
                isSuperAdmin={isSuperAdmin}
                onUse={setUseItem}
                onEdit={item => { setEditItem(item); setFormOpen(true); }}
                onDelete={handleDelete}
                onToggle={id => toggleMutation.mutate(id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* SuperAdmin Form Dialog */}
      {isSuperAdmin && (
        <AdminFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditItem(null); }}
          initial={editItem}
          onSave={handleSave}
          saving={savingForm}
        />
      )}

      {/* Use Template Dialog */}
      <UseTemplateDialog
        open={!!useItem}
        item={useItem}
        onClose={() => setUseItem(null)}
      />
    </Box>
  );
}
