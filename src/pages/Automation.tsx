import {
  Box,
  Button,
  CircularProgress,
  Fade,
  Grid,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useQuery } from "@tanstack/react-query";
import AutomationCard from "components/AutomationCard";
import CreateAutomationModal from "components/CreateAutomationModal";
import { useState } from "react";
import { useNavigate } from "react-router";
import automationService from "service/automation.service";
import { AutomationT } from "types/automation";

const Automations = () => {
  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["automations"],
    queryFn: () => automationService.getAutomations(),
    select: (data: any) => data || [],
  });

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="60vh" gap={2}>
        <CircularProgress sx={{ color: "#25D366" }} />
        <Typography color="text.secondary" fontSize={14}>Loading automations…</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="60vh" gap={1.5}>
        <Typography fontSize={36}>⚠️</Typography>
        <Typography color="error" fontSize={14} fontWeight={600}>Failed to load automations</Typography>
        <Typography color="text.secondary" fontSize={12}>{(error as Error)?.message}</Typography>
      </Box>
    );
  }

  const automations: AutomationT[] = data || [];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>

      {/* ── PAGE HEADER ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
            Automations
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6b7280", mt: 0.5 }}>
            {automations.length > 0
              ? `${automations.length} automation${automations.length !== 1 ? "s" : ""} configured`
              : "Automate your WhatsApp conversations"}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
          sx={{
            borderRadius: "10px",
            px: 2.5,
            py: 1,
            fontWeight: 700,
            fontSize: 13,
            bgcolor: "#25D366",
            "&:hover": { bgcolor: "#1db954" },
            boxShadow: "0 2px 8px rgba(37,211,102,0.35)",
          }}
        >
          Create Automation
        </Button>
      </Box>

      {/* ── EMPTY STATE ── */}
      {automations.length === 0 && (
        <Box
          sx={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", py: 10, gap: 2,
            border: "2px dashed #e5e7eb", borderRadius: "16px",
            bgcolor: "#fafafa",
          }}
        >
          <Typography fontSize={48} lineHeight={1}>🤖</Typography>
          <Box textAlign="center">
            <Typography fontSize={16} fontWeight={700} color="#374151">No automations yet</Typography>
            <Typography fontSize={13} color="#6b7280" mt={0.5}>
              Create your first automation to start sending automated WhatsApp messages
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreate(true)}
            sx={{
              borderRadius: "10px", px: 3, py: 1, fontWeight: 700, fontSize: 13,
              bgcolor: "#25D366", "&:hover": { bgcolor: "#1db954" },
              boxShadow: "0 2px 8px rgba(37,211,102,0.35)", mt: 0.5,
            }}
          >
            Create Automation
          </Button>
        </Box>
      )}

      {/* ── GRID ── */}
      {automations.length > 0 && (
        <Grid container spacing={2.5}>
          {automations.map((automation, index) => (
            <Grid item xs={12} sm={6} lg={4} key={automation._id}>
              <Fade in timeout={350} style={{ transitionDelay: `${index * 60}ms` }}>
                <Box>
                  <AutomationCard automation={automation} onRefresh={refetch} />
                </Box>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      <CreateAutomationModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSuccess={(newAutomation: any) => {
          setOpenCreate(false);
          navigate(`/automation-builder/${newAutomation._id}`);
        }}
      />
    </Box>
  );
};

export default Automations;
