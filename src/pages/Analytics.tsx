import { useState, useMemo } from "react";
import {
  Box, Typography, Stack, Paper, Grid, MenuItem, TextField,
  Chip, Divider, CircularProgress, Tooltip, LinearProgress, Table,
  TableHead, TableRow, TableCell, TableBody,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SendIcon from "@mui/icons-material/Send";
import MarkChatReadIcon from "@mui/icons-material/MarkChatRead";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import MessageIcon from "@mui/icons-material/Message";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReplyIcon from "@mui/icons-material/Reply";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SpeedIcon from "@mui/icons-material/Speed";
import { useQuery } from "@tanstack/react-query";
import {
  analyticsService, DashboardData, TrendPoint, LedgerCategoryStat, ContactGrowthPoint,
} from "service/analytics.service";

/* ─── colour maps ─────────────────────────────────────────────────── */
const CAT_COLOR: Record<string, string> = {
  MARKETING: "#6366f1", UTILITY: "#0ea5e9",
  AUTHENTICATION: "#f59e0b", SERVICE: "#10b981", UNKNOWN: "#9ca3af",
};
const CAT_LABEL: Record<string, string> = {
  MARKETING: "Marketing", UTILITY: "Utility",
  AUTHENTICATION: "Authentication", SERVICE: "Service", UNKNOWN: "Unknown",
};

/* ─── Helpers ─────────────────────────────────────────────────────── */
const fmtINR = (v: number) =>
  `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function isoDate(d: Date) { return d.toISOString().split("T")[0]; }

const presets = [
  { label: "Today",   days: 0  },
  { label: "7 Days",  days: 7  },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
];

/* ─── StatCard ────────────────────────────────────────────────────── */
const StatCard = ({
  label, value, sub, icon, color = "#6366f1",
  format = "number",
}: {
  label: string; value: number; sub?: string; icon: React.ReactNode;
  color?: string; format?: "number" | "percent" | "currency" | "decimal";
}) => {
  const display =
    format === "currency" ? fmtINR(value) :
    format === "percent"  ? `${value}%`   :
    format === "decimal"  ? value.toLocaleString("en-IN", { maximumFractionDigits: 1 }) :
    value.toLocaleString("en-IN");
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, height: "100%", position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", top: 10, right: 12, opacity: 0.07, fontSize: 52, lineHeight: 1 }}>{icon}</Box>
      <Stack spacing={0.4}>
        <Typography sx={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1 }}>{display}</Typography>
        {sub && <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.25 }}>{sub}</Typography>}
      </Stack>
    </Paper>
  );
};

/* ─── MiniBar ─────────────────────────────────────────────────────── */
const MiniBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <Box sx={{ width: "100%", height: 6, bgcolor: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
    <Box sx={{ width: `${max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0}%`, height: "100%", bgcolor: color, borderRadius: 3, transition: "width 0.5s" }} />
  </Box>
);

/* ─── Trend chart — scrollable CSS bars ──────────────────────────── */
const TrendChart = ({
  trend, contactGrowth,
}: {
  trend: TrendPoint[]; contactGrowth: ContactGrowthPoint[];
}) => {
  const growthMap = useMemo(() => {
    const m: Record<string, number> = {};
    contactGrowth.forEach((c) => { m[c.date] = c.count; });
    return m;
  }, [contactGrowth]);

  const maxMsg = useMemo(() => Math.max(...trend.map((t) => t.out + t.in), 1), [trend]);
  const maxGrowth = useMemo(() => Math.max(...contactGrowth.map((c) => c.count), 1), [contactGrowth]);

  if (!trend.length) return <Typography sx={{ color: "#9ca3af", fontSize: 13, py: 2 }}>No data for this period.</Typography>;

  const BAR_W = 5;
  const H = 80;

  return (
    <Box>
      <Box sx={{ overflowX: "auto", pb: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: "4px", height: H + 4, minWidth: trend.length * (BAR_W * 3 + 6), px: 0.5 }}>
          {trend.map((pt) => {
            const outH   = pt.out   > 0 ? Math.max(Math.round((pt.out   / maxMsg)    * H), 2) : 0;
            const inH    = pt.in    > 0 ? Math.max(Math.round((pt.in    / maxMsg)    * H), 2) : 0;
            const growH  = growthMap[pt.date] > 0
              ? Math.max(Math.round((growthMap[pt.date] / maxGrowth) * H), 2) : 0;
            return (
              <Tooltip
                key={pt.date}
                title={
                  <Box sx={{ fontSize: 11, lineHeight: 1.7 }}>
                    <b>{pt.date}</b><br />
                    Sent: {pt.out.toLocaleString()}<br />
                    Received: {pt.in.toLocaleString()}<br />
                    New Contacts: {(growthMap[pt.date] ?? 0).toLocaleString()}
                  </Box>
                }
                arrow
              >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flexShrink: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-end", gap: "1px", height: H }}>
                    <Box sx={{ width: BAR_W, height: outH,  bgcolor: "#6366f1", borderRadius: "2px 2px 0 0" }} />
                    <Box sx={{ width: BAR_W, height: inH,   bgcolor: "#10b981", borderRadius: "2px 2px 0 0" }} />
                    <Box sx={{ width: BAR_W, height: growH, bgcolor: "#f59e0b", borderRadius: "2px 2px 0 0" }} />
                  </Box>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
      <Stack direction="row" spacing={2.5} mt={1.5}>
        {[
          { color: "#6366f1", label: "Sent" },
          { color: "#10b981", label: "Received" },
          { color: "#f59e0b", label: "New Contacts" },
        ].map((l) => (
          <Stack key={l.label} direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 10, height: 10, bgcolor: l.color, borderRadius: 1 }} />
            <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{l.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

/* ─── Delivery funnel ─────────────────────────────────────────────── */
const DeliveryFunnel = ({ stats }: { stats: DashboardData["template_stats"] }) => {
  const steps = [
    { label: "Sent",      value: stats.sent,      color: "#6366f1" },
    { label: "Delivered", value: stats.delivered,  color: "#0ea5e9" },
    { label: "Read",      value: stats.read,       color: "#10b981" },
    { label: "Failed",    value: stats.failed,     color: "#ef4444" },
  ];
  const max = stats.sent || 1;
  return (
    <Stack spacing={1.5}>
      {steps.map((s) => (
        <Box key={s.label}>
          <Stack direction="row" justifyContent="space-between" mb={0.3}>
            <Typography sx={{ fontSize: 13 }}>{s.label}</Typography>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{s.value.toLocaleString()}</Typography>
              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                ({stats.total > 0 ? Math.round((s.value / stats.total) * 100) : 0}%)
              </Typography>
            </Stack>
          </Stack>
          <MiniBar value={s.value} max={max} color={s.color} />
        </Box>
      ))}
    </Stack>
  );
};

/* ─── Category breakdown ──────────────────────────────────────────── */
const CategoryBreakdown = ({ cats }: { cats: DashboardData["by_category"] }) => {
  const total = cats.reduce((a, c) => a + c.total, 0) || 1;
  if (!cats.length) return <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No template data yet.</Typography>;
  return (
    <Stack spacing={1.5}>
      {cats.map((cat) => {
        const pct      = Math.round((cat.total / total) * 100);
        const readPct  = cat.delivered > 0 ? Math.round((cat.read   / cat.delivered) * 100) : 0;
        const failPct  = cat.total     > 0 ? Math.round((cat.failed / cat.total)     * 100) : 0;
        const color    = CAT_COLOR[cat._id] || CAT_COLOR.UNKNOWN;
        const label    = CAT_LABEL[cat._id] || cat._id;
        return (
          <Box key={cat._id}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.4}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: "50%" }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{label}</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{cat.total.toLocaleString()} sent</Typography>
                <Typography sx={{ fontSize: 12, color: "#10b981" }}>{cat.read.toLocaleString()} read ({readPct}%)</Typography>
                <Typography sx={{ fontSize: 12, color: "#ef4444" }}>{cat.failed.toLocaleString()} failed ({failPct}%)</Typography>
                <Chip label={`${pct}% of total`} size="small" sx={{ height: 18, fontSize: 10, bgcolor: color + "18", color }} />
              </Stack>
            </Stack>
            <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: "#f3f4f6", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
          </Box>
        );
      })}
    </Stack>
  );
};

/* ─── Top templates table ─────────────────────────────────────────── */
const TopTemplatesTable = ({ templates }: { templates: DashboardData["top_templates"] }) => {
  if (!templates.length) return <Typography sx={{ color: "#9ca3af", fontSize: 13, py: 1 }}>No templates sent yet.</Typography>;
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 750 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f9fafb" }}>
            {["Template Name", "Category", "Sent", "Delivered", "Read", "Replies", "Failed", "Read % (of dlvd)", "Reply % (of dlvd)"].map((h) => (
              <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", py: 1, border: 0 }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {templates.map((t, i) => {
            const readPct  = t.delivered > 0 ? Math.round((t.read            / t.delivered) * 100) : 0;
            const replyPct = t.delivered > 0 ? Math.round(((t.replies ?? 0) / t.delivered) * 100) : 0;
            const color    = CAT_COLOR[t.category] || CAT_COLOR.UNKNOWN;
            return (
              <TableRow key={i} sx={{ "&:hover": { bgcolor: "#fafafa" }, "& td": { borderColor: "#f3f4f6" } }}>
                <TableCell sx={{ fontSize: 13, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {(t._id || "—").replace(/_/g, " ")}
                </TableCell>
                <TableCell>
                  <Chip label={CAT_LABEL[t.category] || t.category || "—"} size="small" sx={{ height: 18, fontSize: 10, bgcolor: color + "18", color }} />
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>{t.total.toLocaleString()}</TableCell>
                <TableCell sx={{ fontSize: 13, color: "#0ea5e9" }}>{t.delivered.toLocaleString()}</TableCell>
                <TableCell sx={{ fontSize: 13, color: "#10b981" }}>{t.read.toLocaleString()}</TableCell>
                <TableCell sx={{ fontSize: 13, color: "#6366f1", fontWeight: 600 }}>{(t.replies ?? 0).toLocaleString()}</TableCell>
                <TableCell sx={{ fontSize: 13, color: "#ef4444" }}>{t.failed.toLocaleString()}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: readPct >= 50 ? "#10b981" : "#f59e0b" }}>{readPct}%</Typography>
                    <Box sx={{ width: 32, height: 4, bgcolor: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
                      <Box sx={{ width: `${readPct}%`, height: "100%", bgcolor: readPct >= 50 ? "#10b981" : "#f59e0b" }} />
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontSize: 13, color: replyPct >= 10 ? "#6366f1" : "#9ca3af", fontWeight: 600 }}>{replyPct}%</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

/* ─── Cost breakdown ──────────────────────────────────────────────── */
const CostBreakdown = ({
  actualCost, templateCost, commissionCost, chargedCount, ledgerByCat,
}: {
  actualCost: number; templateCost: number; commissionCost: number;
  chargedCount: number; ledgerByCat: LedgerCategoryStat[];
}) => (
  <Stack spacing={2}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      {[
        { label: "Total Charged",   value: fmtINR(actualCost),     color: "#f59e0b", desc: `${chargedCount.toLocaleString()} messages billed` },
        { label: "Template Amount", value: fmtINR(templateCost),   color: "#0ea5e9", desc: "Base WhatsApp cost" },
        { label: "Platform Fee",    value: fmtINR(commissionCost), color: "#6366f1", desc: "Service commission" },
      ].map((item) => (
        <Paper key={item.label} variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, borderColor: item.color + "40", bgcolor: item.color + "06" }}>
          <Typography sx={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", mb: 0.5 }}>{item.label}</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</Typography>
          <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.25 }}>{item.desc}</Typography>
        </Paper>
      ))}
    </Stack>

    {ledgerByCat.length > 0 && (
      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", mb: 1 }}>Cost by Category</Typography>
        <Stack spacing={1}>
          {ledgerByCat.map((l) => {
            const color = CAT_COLOR[l._id] || CAT_COLOR.UNKNOWN;
            const label = CAT_LABEL[l._id] || l._id;
            const pct   = actualCost > 0 ? Math.round((l.amount / actualCost) * 100) : 0;
            return (
              <Box key={l._id}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.3}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, bgcolor: color, borderRadius: "50%" }} />
                    <Typography sx={{ fontSize: 13 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>({l.count.toLocaleString()} msgs)</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>{fmtINR(l.amount)}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>{pct}%</Typography>
                  </Stack>
                </Stack>
                <LinearProgress variant="determinate" value={pct} sx={{ height: 5, borderRadius: 3, bgcolor: "#f3f4f6", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
              </Box>
            );
          })}
        </Stack>
      </Box>
    )}

    {actualCost === 0 && (
      <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No billed messages in this period.</Typography>
    )}
  </Stack>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
const Analytics = () => {
  const today     = new Date();
  const thirtyAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [from,      setFrom]      = useState(isoDate(thirtyAgo));
  const [to,        setTo]        = useState(isoDate(today));
  const [channelId, setChannelId] = useState("all");

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey : ["analytics-dashboard", from, to, channelId],
    queryFn  : () => analyticsService.getDashboard({ channel_id: channelId, from, to }),
    staleTime: 60_000,
  });

  const applyPreset = (days: number) => {
    const t = new Date();
    const f = days === 0 ? new Date(t) : new Date(t.getTime() - days * 24 * 60 * 60 * 1000);
    setFrom(isoDate(f));
    setTo(isoDate(t));
  };

  const ov     = data?.overview;
  const tStats = data?.template_stats ?? { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>

      {/* ── HEADER ── */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Analytics Dashboard</Typography>
          <Typography sx={{ fontSize: 13, color: "#6b7280", mt: 0.25 }}>
            Messages, templates & contact insights
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {presets.map((p) => (
            <Chip
              key={p.label}
              label={p.label}
              size="small"
              variant={from === isoDate(p.days === 0 ? today : new Date(today.getTime() - p.days * 86400000)) ? "filled" : "outlined"}
              color="primary"
              onClick={() => applyPreset(p.days)}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Stack>
      </Stack>

      {/* ── FILTERS ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            type="date" size="small" label="From" value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ minWidth: 155 }}
          />
          <TextField
            type="date" size="small" label="To" value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ minWidth: 155 }}
          />
          {/* Always render channel selector; options populate once data loads */}
          <TextField
            select size="small" label="Channel" value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            sx={{ minWidth: 220 }}
            disabled={isLoading && !data}
          >
            <MenuItem value="all">All Channels</MenuItem>
            {(data?.channels ?? []).map((ch) => (
              <MenuItem key={ch._id} value={ch._id}>
                {ch.name || ch.phone_number || ch._id}
              </MenuItem>
            ))}
          </TextField>
          {isLoading && <CircularProgress size={20} />}
          {isError && <Typography sx={{ fontSize: 13, color: "error.main" }}>Failed to load data</Typography>}
        </Stack>
      </Paper>

      {/* ── ROW 1: CONTACT + MESSAGE OVERVIEW ── */}
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }}>
        Contacts & Messages
      </Typography>
      <Grid container spacing={2} mb={3}>
        {[
          { label: "New Contacts",         value: ov?.new_contacts        ?? 0, icon: <GroupAddIcon fontSize="inherit" />,            color: "#6366f1" },
          { label: "Contacts Messaged",    value: ov?.contacts_messaged   ?? 0, icon: <SendIcon fontSize="inherit" />,                color: "#0ea5e9" },
          { label: "Contacts Replied",     value: ov?.contacts_replied    ?? 0, icon: <ReplyIcon fontSize="inherit" />,               color: "#10b981" },
          { label: "Engagement Rate",      value: ov?.engagement_rate     ?? 0, icon: <SpeedIcon fontSize="inherit" />,               color: "#6366f1", format: "percent" as const, sub: "% of messaged contacts replied" },
          { label: "Messages Sent",        value: ov?.messages_out        ?? 0, icon: <MessageIcon fontSize="inherit" />,             color: "#6366f1" },
          { label: "Messages Received",    value: ov?.messages_in         ?? 0, icon: <MarkChatReadIcon fontSize="inherit" />,        color: "#10b981" },
          { label: "Avg Msgs / Contact",   value: ov?.avg_msgs_per_contact ?? 0, icon: <PeopleAltIcon fontSize="inherit" />,          color: "#0ea5e9", format: "decimal" as const, sub: "Outbound messages per contact" },
          { label: "Reply Rate",           value: ov?.reply_rate          ?? 0, icon: <TrendingUpIcon fontSize="inherit" />,          color: "#10b981", format: "percent" as const, sub: "% of template recipients replied" },
        ].map((card) => (
          <Grid item xs={6} sm={4} md={3} key={card.label}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* ── ROW 2: TEMPLATE OVERVIEW ── */}
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }}>
        Template Performance
      </Typography>
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Templates Sent",     value: ov?.template_total       ?? 0, icon: <CheckCircleOutlineIcon fontSize="inherit" />, color: "#f59e0b" },
          { label: "Read Rate",          value: ov?.template_read_rate   ?? 0, icon: <MarkChatReadIcon fontSize="inherit" />,       color: "#10b981", format: "percent" as const, sub: `${tStats.read.toLocaleString()} templates read` },
          { label: "Fail Rate",          value: ov?.template_fail_rate   ?? 0, icon: <ErrorOutlineIcon fontSize="inherit" />,       color: "#ef4444", format: "percent" as const, sub: `${tStats.failed.toLocaleString()} templates failed` },
          { label: "Session Messages",   value: ov?.session_messages     ?? 0, icon: <LockOpenIcon fontSize="inherit" />,           color: "#0ea5e9", sub: "Free 24-hr window messages" },
          { label: "Total Charged",      value: ov?.actual_cost          ?? 0, icon: <CurrencyRupeeIcon fontSize="inherit" />,      color: "#f59e0b", format: "currency" as const, sub: ov?.charged_count ? `${ov.charged_count.toLocaleString()} billed` : undefined },
        ].map((card) => (
          <Grid item xs={6} sm={4} md={3} key={card.label}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* ── ROW 3: FUNNEL + TREND ── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, height: "100%" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 2 }}>Template Delivery Funnel</Typography>
            {tStats.total > 0
              ? <DeliveryFunnel stats={tStats} />
              : <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>No templates sent yet.</Typography>
            }
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Daily Message & Contact Trend</Typography>
              <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                Total: {((ov?.messages_out ?? 0) + (ov?.messages_in ?? 0)).toLocaleString()} messages
              </Typography>
            </Stack>
            <TrendChart trend={data?.trend ?? []} contactGrowth={data?.contact_growth ?? []} />
          </Paper>
        </Grid>
      </Grid>

      {/* ── ROW 4: CATEGORY + MESSAGE TYPE ── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 2 }}>Templates by Category</Typography>
            <CategoryBreakdown cats={data?.by_category ?? []} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 2 }}>Message Type Breakdown</Typography>
            <Stack spacing={2}>
              {[
                { label: "Template Messages", value: ov?.template_total    ?? 0, total: ov?.messages_out ?? 0, color: "#6366f1", desc: "Marketing, Utility, Auth, Service" },
                { label: "Session / Free",    value: ov?.session_messages  ?? 0, total: ov?.messages_out ?? 0, color: "#10b981", desc: "24-hour customer service window" },
              ].map((item) => {
                const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                return (
                  <Box key={item.label}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: item.color }}>
                        {item.value.toLocaleString()} <Typography component="span" sx={{ fontSize: 11, color: "#9ca3af" }}>({pct}%)</Typography>
                      </Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4, bgcolor: "#f3f4f6", "& .MuiLinearProgress-bar": { bgcolor: item.color, borderRadius: 4 } }} />
                    <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.5 }}>{item.desc}</Typography>
                  </Box>
                );
              })}

              <Divider />

              {/* Quick template health summary */}
              <Stack spacing={1}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Template Health</Typography>
                {[
                  { label: "Delivered", value: tStats.delivered, total: tStats.total, color: "#0ea5e9" },
                  { label: "Read",      value: tStats.read,      total: tStats.total, color: "#10b981" },
                  { label: "Failed",    value: tStats.failed,    total: tStats.total, color: "#ef4444" },
                ].map((s) => {
                  const p = tStats.total > 0 ? Math.round((s.value / tStats.total) * 100) : 0;
                  return (
                    <Stack key={s.label} direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ fontSize: 12, color: "#6b7280", width: 60 }}>{s.label}</Typography>
                      <Box sx={{ flex: 1, height: 5, bgcolor: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                        <Box sx={{ width: `${p}%`, height: "100%", bgcolor: s.color, borderRadius: 3 }} />
                      </Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: s.color, width: 40, textAlign: "right" }}>{p}%</Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* ── ROW 5: TOP TEMPLATES TABLE ── */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Top Templates</Typography>
          <Chip label="Top 10 by volume" size="small" variant="outlined" sx={{ fontSize: 11 }} />
        </Stack>
        <TopTemplatesTable templates={data?.top_templates ?? []} />
      </Paper>

      {/* ── ROW 6: COST BREAKDOWN ── */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Cost Breakdown</Typography>
          <Chip label="Actual billed from ledger" size="small" color="warning" variant="outlined" sx={{ fontSize: 11 }} />
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <CostBreakdown
          actualCost    ={ov?.actual_cost      ?? 0}
          templateCost  ={ov?.template_cost    ?? 0}
          commissionCost={ov?.commission_cost  ?? 0}
          chargedCount  ={ov?.charged_count    ?? 0}
          ledgerByCat   ={data?.ledger_by_category ?? []}
        />
      </Paper>

    </Box>
  );
};

export default Analytics;
