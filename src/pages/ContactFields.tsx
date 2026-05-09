import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { contactAttributeService, ContactAttribute } from "service/contactAttribute.service";

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  string:  { label: "String",  color: "#2563eb", bg: "#eff6ff", icon: "Aa" },
  number:  { label: "Number",  color: "#7c3aed", bg: "#f5f3ff", icon: "12" },
  phone:   { label: "Phone",   color: "#0891b2", bg: "#ecfeff", icon: "📞" },
  boolean: { label: "Boolean", color: "#d97706", bg: "#fffbeb", icon: "☑" },
  object:  { label: "Object",  color: "#374151", bg: "#f9fafb", icon: "{}" },
};

const FIELD_TYPES = ["string", "number", "phone", "boolean", "object"];

const slugify = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 40);

const DEFAULT_FIELDS = [
  { id: "contact.name",  name: "Full Name",     type: "string", placeholder: "{{contact.name}}" },
  { id: "contact.phone", name: "Phone Number",  type: "phone",  placeholder: "{{contact.phone}}" },
];

const ContactFields = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("string");

  const { data: attributes = [], isLoading } = useQuery<ContactAttribute[]>({
    queryKey: ["contact-attributes"],
    queryFn: async () => {
      const res = await contactAttributeService.getAttributes();
      return res.data || [];
    },
    staleTime: 60_000,
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (attrs: ContactAttribute[]) =>
      contactAttributeService.upsertAttributes(attrs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-attributes"] });
      enqueueSnackbar("Contact fields saved", { variant: "success" });
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.response?.data?.message || "Failed to save", { variant: "error" });
    },
  });

  const handleAdd = () => {
    if (!name.trim()) return;
    const id = slugify(name);
    if (!id) return;
    if (attributes.find((a) => a.id === id)) {
      enqueueSnackbar("A field with this id already exists", { variant: "warning" });
      return;
    }
    const next = [...attributes, { id, name: name.trim(), type: type as ContactAttribute["type"] }];
    save(next);
    setName("");
    setType("string");
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    save(attributes.filter((a) => a.id !== id));
  };

  const copyPlaceholder = (id: string) => {
    navigator.clipboard.writeText(`{{attributes.${id}}}`);
    enqueueSnackbar("Placeholder copied!", { variant: "success" });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 780, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            Contact Fields
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Define custom fields stored on every contact. Use{" "}
            <Box component="code" sx={{ bgcolor: "#f3f4f6", px: 0.75, py: 0.25, borderRadius: 1, fontSize: 12 }}>
              {"{{attributes.field_id}}"}
            </Box>{" "}
            as a placeholder in automations and templates.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: "10px", fontWeight: 600, px: 2.5, boxShadow: "none", flexShrink: 0 }}
        >
          Add Field
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* ── Default (system) fields ── */}
      <Box mb={3}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
          System Fields
        </Typography>
        <Stack spacing={1}>
          {DEFAULT_FIELDS.map((field) => {
            const meta = TYPE_META[field.type] || TYPE_META.string;
            return (
              <Paper
                key={field.id}
                variant="outlined"
                sx={{
                  borderRadius: "12px",
                  borderColor: "#e5e7eb",
                  bgcolor: "#f9fafb",
                  px: 2, py: 1.5,
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 200px 80px",
                  gap: 1,
                  alignItems: "center",
                }}
              >
                <Box>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography fontWeight={600} fontSize={14}>{field.name}</Typography>
                    <LockOutlinedIcon sx={{ fontSize: 12, color: "#9ca3af" }} />
                  </Stack>
                  <Typography fontSize={11} color="text.secondary" fontFamily="monospace">{field.id}</Typography>
                </Box>
                <Chip
                  label={meta.label}
                  size="small"
                  sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: 11, height: 24, fontFamily: "monospace", width: "fit-content" }}
                />
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 0.75, bgcolor: "#f3f4f6", borderRadius: "8px", px: 1.25, py: 0.5, cursor: "pointer", "&:hover": { bgcolor: "#e5e7eb" } }}
                  onClick={() => { navigator.clipboard.writeText(field.placeholder); enqueueSnackbar("Placeholder copied!", { variant: "success" }); }}
                >
                  <Typography fontSize={12} fontFamily="monospace" color="#374151" flex={1} noWrap>{field.placeholder}</Typography>
                  <ContentCopyIcon sx={{ fontSize: 13, color: "#9ca3af" }} />
                </Box>
                <Stack direction="row" justifyContent="flex-end">
                  <LockOutlinedIcon sx={{ fontSize: 16, color: "#d1d5db", mr: 1 }} />
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>

      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>
        Custom Fields
      </Typography>

      {/* Field list */}
      {isLoading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : attributes.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ borderRadius: "14px", p: 6, textAlign: "center", borderStyle: "dashed", borderColor: "#e5e7eb" }}
        >
          <Typography fontSize={36} mb={1}>🏷️</Typography>
          <Typography fontWeight={600} fontSize={15} mb={0.5}>No contact fields yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            Create your first field to start collecting structured data on contacts.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: "10px" }}>
            Add Field
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {/* Column header */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 120px 200px 80px", gap: 1, px: 2 }}>
            {["Field Name", "Type", "Placeholder", ""].map((h) => (
              <Typography key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {h}
              </Typography>
            ))}
          </Box>

          {attributes.map((attr) => {
            const meta = TYPE_META[attr.type] || TYPE_META.string;
            const placeholder = `{{attributes.${attr.id}}}`;
            return (
              <Paper
                key={attr.id}
                variant="outlined"
                sx={{
                  borderRadius: "12px",
                  borderColor: "#e5e7eb",
                  px: 2, py: 1.5,
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 200px 80px",
                  gap: 1,
                  alignItems: "center",
                  "&:hover": { borderColor: "#d1d5db", bgcolor: "#fafafa" },
                  transition: "all 0.12s",
                }}
              >
                {/* Name + id */}
                <Box>
                  <Typography fontWeight={600} fontSize={14}>{attr.name}</Typography>
                  <Typography fontSize={11} color="text.secondary" fontFamily="monospace">
                    {attr.id}
                  </Typography>
                </Box>

                {/* Type badge */}
                <Chip
                  label={meta.label}
                  size="small"
                  sx={{
                    bgcolor: meta.bg,
                    color: meta.color,
                    fontWeight: 700,
                    fontSize: 11,
                    height: 24,
                    fontFamily: "monospace",
                    width: "fit-content",
                  }}
                />

                {/* Placeholder */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    bgcolor: "#f3f4f6",
                    borderRadius: "8px",
                    px: 1.25,
                    py: 0.5,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#e5e7eb" },
                  }}
                  onClick={() => copyPlaceholder(attr.id)}
                >
                  <Typography fontSize={12} fontFamily="monospace" color="#374151" flex={1} noWrap>
                    {placeholder}
                  </Typography>
                  <ContentCopyIcon sx={{ fontSize: 13, color: "#9ca3af" }} />
                </Box>

                {/* Actions */}
                <Stack direction="row" justifyContent="flex-end">
                  <Tooltip title="Delete field">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(attr.id)}
                      sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* ── Create Field Dialog ── */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Add Contact Field</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={0.5}>
            <TextField
              fullWidth
              label="Field Name"
              placeholder="e.g. City, Order ID, Cabin Size"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              helperText={name.trim() ? `ID will be: ${slugify(name)}` : ""}
              autoFocus
            />
            <TextField
              fullWidth
              select
              label="Field Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {FIELD_TYPES.map((t) => {
                const m = TYPE_META[t];
                return (
                  <MenuItem key={t} value={t}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        sx={{
                          width: 26, height: 26, borderRadius: "6px",
                          bgcolor: m.bg, display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 12, fontWeight: 700, color: m.color,
                        }}
                      >
                        {m.icon}
                      </Box>
                      <Typography fontSize={13}>{m.label}</Typography>
                    </Stack>
                  </MenuItem>
                );
              })}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} sx={{ borderRadius: "8px" }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!name.trim() || saving}
            sx={{ borderRadius: "8px", fontWeight: 600, boxShadow: "none" }}
          >
            {saving ? "Saving…" : "Add Field"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactFields;
