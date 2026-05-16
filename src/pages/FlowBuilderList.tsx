import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flowBuilderService, WhatsappFlow } from "service/flowBuilder.service";
import { channelService } from "service/channel.service";

const TYPE_COLOR = { static: "#3b82f6", dynamic: "#8b5cf6" } as const;
const STATUS_COLOR = { draft: "#f59e0b", published: "#10b981" } as const;

/* ─── Create Dialog ─── */
const CreateFlowDialog = ({
  open,
  onClose,
  channels,
}: {
  open: boolean;
  onClose: () => void;
  channels: any[];
}) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("My Flow");
  const [type, setType] = useState<"static" | "dynamic">("static");
  const [channelId, setChannelId] = useState("");
  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      flowBuilderService.create({ name, type, channel_id: channelId || undefined }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["wb-flows"] });
      onClose();
      navigate(`/flow-builder/${res.data._id}`);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Failed to create flow");
    },
  });

  const handleClose = () => {
    setName("My Flow");
    setType("static");
    setChannelId("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create WhatsApp Flow</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label="Flow Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel>Flow Type</InputLabel>
            <Select
              value={type}
              label="Flow Type"
              onChange={(e) => setType(e.target.value as any)}
            >
              <MenuItem value="static">
                <Stack direction="row" alignItems="center" gap={1}>
                  <FileTextOutlined style={{ color: "#3b82f6" }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Static</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Fixed content — no backend needed
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
              <MenuItem value="dynamic">
                <Stack direction="row" alignItems="center" gap={1}>
                  <ThunderboltOutlined style={{ color: "#8b5cf6" }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Dynamic</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Backend-driven — screen data from endpoint
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>

          {channels.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel>Link Channel (for publishing)</InputLabel>
              <Select
                value={channelId}
                label="Link Channel (for publishing)"
                onChange={(e) => setChannelId(e.target.value)}
              >
                <MenuItem value="">— Select later —</MenuItem>
                {channels.map((ch: any) => (
                  <MenuItem key={ch._id} value={ch._id}>
                    {ch.channel_name} ({ch.display_phone_number})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={createMut.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending || !name.trim()}
          startIcon={
            createMut.isPending ? <CircularProgress size={14} /> : <PlusOutlined />
          }
        >
          {createMut.isPending ? "Creating…" : "Create & Edit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── Flow Card ─── */
const FlowCard = ({
  flow,
  onDelete,
}: {
  flow: WhatsappFlow;
  onDelete: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const typeColor = TYPE_COLOR[flow.type] || "#6b7280";
  const statusColor = STATUS_COLOR[flow.status] || "#6b7280";

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "14px",
        borderColor: "#e5e7eb",
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.15s",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ height: 3, bgcolor: typeColor }} />

      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          mb={1.5}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              fontWeight={700}
              fontSize={15}
              color="#111827"
              noWrap
              title={flow.name}
            >
              {flow.name}
            </Typography>
            <Typography fontSize={11.5} color="#9ca3af" mt={0.25}>
              {new Date(flow.updatedAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Typography>
          </Box>
          <Stack direction="row" gap={0.75} flexShrink={0} ml={1}>
            <Chip
              label={flow.type}
              size="small"
              icon={
                flow.type === "dynamic" ? (
                  <ThunderboltOutlined style={{ fontSize: 11, color: typeColor }} />
                ) : (
                  <FileTextOutlined style={{ fontSize: 11, color: typeColor }} />
                )
              }
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: `${typeColor}15`,
                color: typeColor,
                border: `1px solid ${typeColor}30`,
                borderRadius: "6px",
                textTransform: "capitalize",
              }}
            />
            <Chip
              label={flow.status}
              size="small"
              icon={
                flow.status === "published" ? (
                  <CheckCircleOutlined style={{ fontSize: 11, color: statusColor }} />
                ) : (
                  <ClockCircleOutlined style={{ fontSize: 11, color: statusColor }} />
                )
              }
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: `${statusColor}15`,
                color: statusColor,
                border: `1px solid ${statusColor}30`,
                borderRadius: "6px",
                textTransform: "capitalize",
              }}
            />
          </Stack>
        </Stack>

        <Divider sx={{ mb: 1.5, borderColor: "#f3f4f6" }} />

        <Stack direction="row" gap={2} mb={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">Screens</Typography>
            <Typography variant="body2" fontWeight={700}>{flow.screens?.length || 0}</Typography>
          </Box>
          {flow.meta_flow_id && (
            <Box>
              <Typography variant="caption" color="text.secondary">Meta ID</Typography>
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ display: "block", fontFamily: "monospace", fontSize: 11 }}
              >
                {flow.meta_flow_id.slice(-8)}…
              </Typography>
            </Box>
          )}
        </Stack>

        <Stack direction="row" gap={1} mt="auto">
          <Button
            variant="contained"
            size="small"
            startIcon={<EditOutlined />}
            onClick={() => navigate(`/flow-builder/${flow._id}`)}
            sx={{
              flex: 1,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: 12.5,
              bgcolor: "#064e3b",
              "&:hover": { bgcolor: "#065f46" },
              boxShadow: "none",
            }}
          >
            Edit
          </Button>
          <Tooltip title="Delete flow">
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => onDelete(flow._id)}
              sx={{ minWidth: 36, borderRadius: "8px", px: 1 }}
            >
              <DeleteOutlined style={{ fontSize: 14 }} />
            </Button>
          </Tooltip>
        </Stack>
      </Box>
    </Paper>
  );
};

/* ─── Delete Confirm ─── */
const DeleteConfirm = ({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 700 }}>Delete Flow?</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        This will permanently delete the flow and its configuration. This cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} disabled={loading}>Cancel</Button>
      <Button
        variant="contained"
        color="error"
        onClick={onConfirm}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={14} /> : undefined}
      >
        {loading ? "Deleting…" : "Delete"}
      </Button>
    </DialogActions>
  </Dialog>
);

/* ─── Main Page ─── */
export default function FlowBuilderList() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: flowsData, isLoading, isError } = useQuery({
    queryKey: ["wb-flows"],
    queryFn: () => flowBuilderService.list(),
  });

  const { data: channelsData } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    select: (res) => res.data,
    staleTime: 60_000,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => flowBuilderService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wb-flows"] });
      setDeleteId(null);
    },
  });

  const flows: WhatsappFlow[] = flowsData?.data || [];
  const channels: any[] = channelsData || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* ── Header ── */}
      <Box
        sx={{
          borderRadius: "16px",
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)",
          p: { xs: 3, md: 4 },
          mb: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {[
          { w: 200, h: 200, top: -70, right: 30, op: 0.06 },
          { w: 130, h: 130, top: 10, right: 200, op: 0.04 },
        ].map((c, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: c.w,
              height: c.h,
              borderRadius: "50%",
              bgcolor: "#fff",
              opacity: c.op,
              top: c.top,
              right: c.right,
              pointerEvents: "none",
            }}
          />
        ))}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography fontSize={22} fontWeight={800} color="#fff" letterSpacing={-0.4}>
              WhatsApp Flow Builder
            </Typography>
            <Typography fontSize={13.5} color="#a7f3d0" mt={0.5} lineHeight={1.6}>
              Build static &amp; dynamic WhatsApp Flows visually — no JSON writing needed.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
            sx={{
              bgcolor: "#fff",
              color: "#064e3b",
              fontWeight: 700,
              fontSize: 13,
              borderRadius: "10px",
              textTransform: "none",
              px: 2.5,
              flexShrink: 0,
              "&:hover": { bgcolor: "#f0fdf4" },
              boxShadow: "none",
            }}
          >
            Create Flow
          </Button>
        </Stack>
      </Box>

      {/* ── Flow type explainer ── */}
      <Stack direction={{ xs: "column", sm: "row" }} gap={2} mb={4}>
        {[
          {
            color: "#3b82f6",
            bg: "#eff6ff",
            border: "#bfdbfe",
            icon: <FileTextOutlined style={{ fontSize: 18, color: "#3b82f6" }} />,
            title: "Static Flow",
            desc: "All content is fixed in the Flow JSON. No backend needed. Data is collected and sent via WhatsApp webhook when user submits.",
          },
          {
            color: "#8b5cf6",
            bg: "#f5f3ff",
            border: "#ddd6fe",
            icon: <ThunderboltOutlined style={{ fontSize: 18, color: "#8b5cf6" }} />,
            title: "Dynamic Flow",
            desc: "Our backend serves as the endpoint. Each screen's data comes from your configured responses. Great for conditional UI, live data, multi-step flows.",
          },
        ].map((item) => (
          <Paper
            key={item.title}
            variant="outlined"
            sx={{
              flex: 1,
              borderRadius: "12px",
              borderColor: item.border,
              bgcolor: item.bg,
              p: 2,
            }}
          >
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  bgcolor: "#fff",
                  border: `1px solid ${item.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography fontSize={13} fontWeight={700} color={item.color}>
                  {item.title}
                </Typography>
                <Typography fontSize={12} color="#374151" lineHeight={1.5}>
                  {item.desc}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* ── Flow Grid ── */}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={28} sx={{ color: "#064e3b" }} />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ borderRadius: "10px" }}>
          Failed to load flows. Check your connection.
        </Alert>
      )}

      {!isLoading && !isError && flows.length === 0 && (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: "14px",
            borderStyle: "dashed",
            borderColor: "#d1d5db",
            p: 8,
            textAlign: "center",
            bgcolor: "#fafafa",
          }}
        >
          <Typography fontSize={44} mb={2}>
            📋
          </Typography>
          <Typography fontWeight={700} fontSize={16} color="#374151" mb={0.75}>
            No flows yet
          </Typography>
          <Typography fontSize={13} color="#9ca3af" mb={3}>
            Create your first WhatsApp Flow to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
            sx={{
              bgcolor: "#064e3b",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { bgcolor: "#065f46" },
            }}
          >
            Create Flow
          </Button>
        </Paper>
      )}

      {!isLoading && flows.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "1fr 1fr 1fr",
            },
            gap: 2,
          }}
        >
          {flows.map((flow) => (
            <FlowCard
              key={flow._id}
              flow={flow}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <CreateFlowDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        channels={channels}
      />
      <DeleteConfirm
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </Box>
  );
}
