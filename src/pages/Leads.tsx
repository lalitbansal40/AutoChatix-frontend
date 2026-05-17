import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Stack,
  Paper,
  Avatar,
  Skeleton,
  InputAdornment,
  Tooltip,
  IconButton,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import PersonIcon from "@mui/icons-material/Person";
import { useQuery } from "@tanstack/react-query";
import { leadsService, Lead, LeadChannel } from "service/leads.service";

/* ── helpers ── */
const formatPhone = (phone: string) =>
  phone.startsWith("+") ? phone : `+${phone}`;

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const DATA_LABEL: Record<string, string> = {
  appointment_date: "Date",
  appointment_time: "Time",
  age: "Age",
  name: "Name",
  email: "Email",
  address: "Address",
};

const labelFor = (key: string) =>
  DATA_LABEL[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const exportCSV = (leads: Lead[]) => {
  const allKeys = Array.from(
    new Set(leads.flatMap((l) => Object.keys(l.data)))
  );
  const headers = ["Name", "Phone", "Channel", "Channel Phone", ...allKeys.map(labelFor), "Last Activity"];
  const rows = leads.map((l) => [
    l.name || "",
    formatPhone(l.phone),
    l.channel?.name || "",
    l.channel?.phone || "",
    ...allKeys.map((k) => l.data[k] || ""),
    new Date(l.updatedAt).toLocaleString(),
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ── Lead card ── */
const LeadCard = ({ lead }: { lead: Lead }) => {
  const dataEntries = Object.entries(lead.data);
  const initials = lead.name
    ? lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : lead.phone.slice(-2);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "12px",
        p: 2,
        borderColor: "#e5e7eb",
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)", borderColor: "#d1d5db" },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {/* Avatar */}
        <Avatar
          sx={{ width: 40, height: 40, bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: 14, border: "1.5px solid #bbf7d0", flexShrink: 0 }}
        >
          {initials}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Name + phone */}
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              {lead.name || "Unknown"}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>
              {formatPhone(lead.phone)}
            </Typography>
          </Stack>

          {/* Channel badge */}
          {lead.channel && (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.4 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#25D366" }} />
              <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                {lead.channel.name}
                {lead.channel.phone && (
                  <span style={{ color: "#9ca3af" }}> · {formatPhone(lead.channel.phone)}</span>
                )}
              </Typography>
            </Stack>
          )}

          {/* Collected data chips */}
          {dataEntries.length > 0 && (
            <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {dataEntries.map(([key, value]) => (
                <Tooltip key={key} title={labelFor(key)} placement="top" arrow>
                  <Chip
                    label={`${labelFor(key)}: ${value}`}
                    size="small"
                    sx={{
                      fontSize: 11,
                      height: 22,
                      bgcolor: "#f0f9ff",
                      color: "#0369a1",
                      border: "1px solid #bae6fd",
                      borderRadius: "6px",
                      fontWeight: 500,
                      maxWidth: 200,
                      "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}
        </Box>

        {/* Time */}
        <Typography sx={{ fontSize: 11, color: "#9ca3af", flexShrink: 0, mt: 0.25 }}>
          {timeAgo(lead.updatedAt)}
        </Typography>
      </Stack>
    </Paper>
  );
};

/* ── Skeleton loader ── */
const LeadSkeleton = () => (
  <Paper variant="outlined" sx={{ borderRadius: "12px", p: 2, borderColor: "#e5e7eb" }}>
    <Stack direction="row" spacing={1.5}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="40%" height={18} />
        <Skeleton width="25%" height={14} sx={{ mt: 0.5 }} />
        <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
          <Skeleton variant="rounded" width={90} height={22} />
          <Skeleton variant="rounded" width={110} height={22} />
        </Stack>
      </Box>
    </Stack>
  </Paper>
);

/* ── Main page ── */
const Leads = () => {
  const [channelId, setChannelId] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: channelData } = useQuery({
    queryKey: ["lead-channels"],
    queryFn: () => leadsService.getChannels(),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["leads", channelId, search],
    queryFn: () => leadsService.getLeads({ channel_id: channelId || undefined, search: search || undefined, limit: 100 }),
    staleTime: 30 * 1000,
  });

  const channels: LeadChannel[] = channelData || [];
  const leads: Lead[] = data?.leads || [];

  const handleSearch = useCallback(() => setSearch(searchInput), [searchInput]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Leads</Typography>
          <Typography variant="body2" color="text.secondary">
            Contacts who submitted data via WhatsApp automations
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} disabled={isFetching} size="small"
              sx={{ border: "1px solid #e5e7eb", borderRadius: "8px", "&:hover": { bgcolor: "#f9fafb" } }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export CSV">
            <IconButton onClick={() => exportCSV(leads)} disabled={leads.length === 0} size="small"
              sx={{ border: "1px solid #e5e7eb", borderRadius: "8px", "&:hover": { bgcolor: "#f9fafb" } }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          select size="small"
          label="Channel"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          sx={{ minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
        >
          <MenuItem value="">All Channels</MenuItem>
          {channels.map((ch) => (
            <MenuItem key={ch._id} value={ch._id}>
              {ch.name} {ch.phone && <span style={{ color: "#9ca3af", fontSize: 11 }}> · {ch.phone}</span>}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          placeholder="Search by name or phone…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
        />
      </Stack>

      {/* Stats bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Box sx={{ px: 1.5, py: 0.75, borderRadius: "8px", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>
            {isLoading ? "—" : leads.length} leads
          </Typography>
        </Box>
        {channelId && channels.find((c) => c._id === channelId) && (
          <Box sx={{ px: 1.5, py: 0.75, borderRadius: "8px", bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
              {channels.find((c) => c._id === channelId)?.name}
            </Typography>
          </Box>
        )}
      </Stack>

      <Divider sx={{ mb: 2.5, borderColor: "#f3f4f6" }} />

      {/* List */}
      <Stack spacing={1.25}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <LeadSkeleton key={i} />)
        ) : leads.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <PersonIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 1 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#6b7280" }}>
              No leads found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Leads appear when contacts submit data via your automations
            </Typography>
          </Box>
        ) : (
          leads.map((lead) => <LeadCard key={String(lead._id)} lead={lead} />)
        )}
      </Stack>
    </Box>
  );
};

export default Leads;
