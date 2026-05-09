import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Chip,
  Tooltip,
  Collapse,
  Tabs,
  Tab,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useState } from "react";
import { useSnackbar } from "notistack";
import { FlowApp } from "service/whatsappFlow.service";

interface Props {
  open: boolean;
  onClose: () => void;
  app: FlowApp | null;
}

const STEPS = [
  { n: 1, t: "Customer receives a WhatsApp message with a Flow CTA button." },
  { n: 2, t: "Tapping the CTA opens the flow inside WhatsApp." },
  { n: 3, t: "Customer fills the form across one or more screens." },
  { n: 4, t: "Data is securely sent to your backend via the Flow webhook." },
];

const FlowPreviewModal = ({ open, onClose, app }: Props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [view, setView] = useState<0 | 1>(0); // 0 = chat, 1 = flow screen
  const [showAdvanced, setShowAdvanced] = useState(false);

  const copyUrl = () => {
    if (!app) return;
    navigator.clipboard.writeText(app.webhook_url);
    enqueueSnackbar("Webhook URL copied!", { variant: "success" });
  };

  if (!app) return null;

  const initials = app.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden", maxHeight: "92vh" } }}
    >
      {/* ── GRADIENT HEADER ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)",
          px: 3,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AccountTreeOutlinedIcon sx={{ color: "#6ee7b7", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography fontSize={17} fontWeight={800} color="#fff" lineHeight={1.2}>
              {app.display_name}
            </Typography>
            <Typography fontSize={12} color="#a7f3d0">
              WhatsApp Flow Preview
            </Typography>
          </Box>
        </Stack>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: "#a7f3d0",
            bgcolor: "rgba(255,255,255,0.08)",
            borderRadius: "8px",
            "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
          }}
        >
          <CloseIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: { md: "70vh" },
          overflow: "hidden",
        }}
      >
        {/* ── LEFT: Phone preview ── */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            bgcolor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRight: { md: "1px solid #f3f4f6" },
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "#e5e7eb", borderRadius: 4 },
          }}
        >
          {/* Toggle tabs */}
          <Tabs
            value={view}
            onChange={(_, v) => setView(v)}
            sx={{
              mb: 2,
              minHeight: 32,
              "& .MuiTab-root": {
                minHeight: 32,
                px: 2,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "none",
                color: "#6b7280",
              },
              "& .Mui-selected": { color: "#064e3b !important" },
              "& .MuiTabs-indicator": { backgroundColor: "#064e3b", height: 2 },
            }}
          >
            <Tab label="💬 In Chat" />
            <Tab label="🪟 Flow Screen" />
          </Tabs>

          {/* Phone shell */}
          <Box
            sx={{
              width: 270,
              borderRadius: "36px",
              background: "linear-gradient(145deg, #1f2937, #111827)",
              p: "10px",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                borderRadius: "28px",
                overflow: "hidden",
                background: view === 0 ? "#e5ddd5" : "#fff",
                display: "flex",
                flexDirection: "column",
                height: 500,
              }}
            >
              {/* Top bar */}
              <Box
                sx={{
                  background:
                    view === 0
                      ? "linear-gradient(135deg, #075E54, #128C7E)"
                      : "#fff",
                  borderBottom: view === 1 ? "1px solid #e5e7eb" : "none",
                  height: 54,
                  display: "flex",
                  alignItems: "flex-end",
                  px: 1.5,
                  pb: 1,
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                {view === 0 ? (
                  <>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.22)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#fff",
                      }}
                    >
                      {initials}
                    </Box>
                    <Box>
                      <Typography
                        fontSize={12.5}
                        fontWeight={700}
                        color="#fff"
                        lineHeight={1.1}
                      >
                        {app.display_name}
                      </Typography>
                      <Typography fontSize={9} color="rgba(255,255,255,0.75)">
                        online
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
                    <IconButton
                      size="small"
                      sx={{ p: 0.5, color: "#374151" }}
                      onClick={() => setView(0)}
                    >
                      <ArrowBackIosNewIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                    <Typography
                      fontSize={13.5}
                      fontWeight={700}
                      color="#111827"
                    >
                      {app.display_name}
                    </Typography>
                  </>
                )}
              </Box>

              {/* Body */}
              {view === 0 ? (
                <Box
                  sx={{
                    flex: 1,
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    overflowY: "auto",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#d9fdd3",
                      p: 0.75,
                      borderRadius: 1.5,
                      fontSize: 9.5,
                      color: "#374151",
                      textAlign: "center",
                      mx: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    🔒 Messages are end-to-end encrypted
                  </Box>

                  {/* Welcome bubble */}
                  <Box
                    sx={{
                      background: "#fff",
                      borderRadius: "8px 8px 8px 2px",
                      p: 1.4,
                      maxWidth: "92%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                    }}
                  >
                    <Typography fontSize={12.5} color="#111827" lineHeight={1.5}>
                      Hi 👋 Welcome to <b>{app.display_name}</b>! Tap below to
                      get started.
                    </Typography>
                    <Typography
                      fontSize={9.5}
                      color="#9ca3af"
                      textAlign="right"
                    >
                      22:21 ✓✓
                    </Typography>
                  </Box>

                  {/* CTA button */}
                  <Box
                    onClick={() => setView(1)}
                    sx={{
                      bgcolor: "#fff",
                      borderRadius: "8px",
                      maxWidth: "92%",
                      py: 1.1,
                      textAlign: "center",
                      color: "#00a884",
                      fontSize: 12.5,
                      fontWeight: 700,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.6,
                      cursor: "pointer",
                      transition: "background 0.15s",
                      "&:hover": { bgcolor: "#f0fdf4" },
                    }}
                  >
                    <AccountTreeOutlinedIcon sx={{ fontSize: 15 }} />
                    Open {app.display_name}
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    bgcolor: "#fafafa",
                  }}
                >
                  <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.4, flex: 1 }}>
                    <Typography fontSize={14} fontWeight={700} color="#111827">
                      Welcome 👋
                    </Typography>
                    <Typography fontSize={11.5} color="#6b7280" lineHeight={1.5}>
                      Please fill in the details to continue.
                    </Typography>

                    {[
                      { lbl: "Your Name", placeholder: "Enter your name…" },
                      { lbl: "Phone Number", placeholder: "+91 ─────────" },
                      { lbl: "Choose Option", placeholder: "Select…", isSelect: true },
                    ].map((f, i) => (
                      <Box key={i}>
                        <Typography
                          fontSize={10}
                          fontWeight={700}
                          color="#9ca3af"
                          mb={0.5}
                          textTransform="uppercase"
                          letterSpacing={0.4}
                        >
                          {f.lbl}
                        </Typography>
                        <Box
                          sx={{
                            height: 32,
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                            bgcolor: "#fff",
                            display: "flex",
                            alignItems: "center",
                            px: 1.25,
                            fontSize: 11,
                            color: "#9ca3af",
                          }}
                        >
                          {f.placeholder}
                          {f.isSelect && (
                            <Box sx={{ ml: "auto", fontSize: 10 }}>▾</Box>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderTop: "1px solid #f3f4f6",
                      bgcolor: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: "#00a884",
                        color: "#fff",
                        textAlign: "center",
                        borderRadius: "8px",
                        fontSize: 13,
                        fontWeight: 700,
                        py: 1,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#02947a" },
                      }}
                    >
                      Continue
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <Typography
            fontSize={11}
            color="#9ca3af"
            mt={2}
            textAlign="center"
            maxWidth={300}
          >
            Illustrative preview. Actual screens & fields are configured in
            Meta's Flow Builder.
          </Typography>
        </Box>

        {/* ── RIGHT: Details ── */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "#e5e7eb", borderRadius: 4 },
          }}
        >
          <Stack spacing={2.5}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Chip
                icon={
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 13, color: "#16a34a !important" }}
                  />
                }
                label="Active"
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  borderRadius: "6px",
                }}
              />
              <Chip
                label={`/${app.name}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: "#f3f4f6",
                  color: "#374151",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                }}
              />
            </Stack>

            <Box>
              <Typography
                fontSize={11}
                fontWeight={700}
                color="#9ca3af"
                textTransform="uppercase"
                letterSpacing={0.4}
                mb={1.25}
              >
                How it works
              </Typography>
              <Stack spacing={1.1}>
                {STEPS.map((s) => (
                  <Stack
                    key={s.n}
                    direction="row"
                    spacing={1.25}
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: "7px",
                        bgcolor: "#f0fdf4",
                        color: "#16a34a",
                        border: "1px solid #bbf7d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {s.n}
                    </Box>
                    <Typography fontSize={12.5} color="#374151" lineHeight={1.55}>
                      {s.t}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                borderRadius: "12px",
                border: "1px solid #dbeafe",
                bgcolor: "#eff6ff",
                p: 2,
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Typography fontSize={16} lineHeight={1}>
                  💡
                </Typography>
                <Box>
                  <Typography
                    fontSize={12}
                    fontWeight={700}
                    color="#1d4ed8"
                    mb={0.5}
                  >
                    Tip
                  </Typography>
                  <Typography fontSize={11.5} color="#3b82f6" lineHeight={1.55}>
                    To test this flow, send a template that includes a Flow
                    button to a WhatsApp number connected to this channel.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Advanced (Meta admin) */}
            <Box>
              <Box
                onClick={() => setShowAdvanced((v) => !v)}
                sx={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  color: "#6b7280",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  userSelect: "none",
                  "&:hover": { color: "#374151" },
                }}
              >
                <KeyboardArrowDownIcon
                  sx={{
                    fontSize: 16,
                    transform: showAdvanced ? "none" : "rotate(-90deg)",
                    transition: "transform 0.2s",
                  }}
                />
                For Meta admins
              </Box>
              <Collapse in={showAdvanced} unmountOnExit>
                <Box mt={1.5}>
                  <Typography
                    fontSize={11.5}
                    color="#6b7280"
                    mb={1}
                    lineHeight={1.55}
                  >
                    Paste this URL as the <b>Endpoint URL</b> in Meta Flow
                    settings.
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      px: 1.5,
                      py: 0.9,
                      gap: 1,
                    }}
                  >
                    <Typography
                      fontSize={11.5}
                      fontFamily="monospace"
                      color="#334155"
                      flex={1}
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={app.webhook_url}
                    >
                      {app.webhook_url}
                    </Typography>
                    <Tooltip title="Copy URL">
                      <IconButton
                        size="small"
                        onClick={copyUrl}
                        sx={{
                          color: "#64748b",
                          p: 0.5,
                          "&:hover": { color: "#25D366", bgcolor: "#f0fdf4" },
                        }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Collapse>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ px: 3, py: 2, borderTop: "1px solid #f3f4f6", flexShrink: 0 }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: "10px",
            fontWeight: 700,
            px: 3,
            bgcolor: "#064e3b",
            "&:hover": { bgcolor: "#065f46" },
            boxShadow: "none",
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlowPreviewModal;
