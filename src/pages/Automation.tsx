import {
  Grid,
  CircularProgress,
  Typography,
  Fade,
  Box,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import AutomationCard from "components/AutomationCard";
import automationService from "service/automation.service";
import { AutomationT } from "types/automation";

const Automations = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["automations"],
    queryFn: () => automationService.getAutomations(),
    select: (response) => response,
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
      <Typography variant="h4" mb={3}>
        Automations
      </Typography>

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
    </Box>
  );
};

export default Automations;