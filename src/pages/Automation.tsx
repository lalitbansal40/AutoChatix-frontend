import {
  Grid,
  CircularProgress,
  Typography,
  Fade,
  Box,
  Button,
} from "@mui/material";
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
      <Grid container justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Grid>
    );
  }

  if (isError) {
    return (
      <Typography color="error" textAlign="center" mt={4}>
        {(error as Error).message}
      </Typography>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Automations</Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => setOpenCreate(true)}
        >
          + Create Automation
        </Button>
      </Box>

      <Grid container spacing={3}>
        {data?.map((automation: AutomationT, index: number) => (
          <Grid item xs={12} sm={6} lg={4} key={automation._id}>
            <Fade
              in={true}
              timeout={400}
              style={{
                transitionDelay: `${index * 200}ms`,
              }}
            >
              <Box>
                <AutomationCard
                  automation={automation}
                  onRefresh={refetch} // 🔥 important for live update
                />
              </Box>
            </Fade>
          </Grid>
        ))}
      </Grid>
      <CreateAutomationModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSuccess={(newAutomation: any) => {
          setOpenCreate(false);

          // 🔥 DIRECT BUILDER OPEN
          navigate(`/automation-builder/${newAutomation._id}`);
        }}
      />
    </Box>
  );
};

export default Automations;