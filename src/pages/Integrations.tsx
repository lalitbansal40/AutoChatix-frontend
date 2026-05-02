import {
  Grid,
  CircularProgress,
  Typography,
  Fade,
  Box,
  Button,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import IntegrationCard from 'components/IntegrationCard';
import { integrationService } from 'service/integration.service';
import { IntegrationT } from 'types/integration';

const Integrations = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationService.getIntegrations(),
    select: (res: any) => res?.integrations ?? [],
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => integrationService.disconnectIntegration(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
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
        <Typography variant="h4">Integrations</Typography>

        <Button variant="contained" size="large">
          + Add Integration
        </Button>
      </Box>

      {data?.length === 0 && (
        <Typography color="text.secondary" textAlign="center" mt={8}>
          No integrations connected yet.
        </Typography>
      )}

      <Grid container spacing={3}>
        {data?.map((integration: IntegrationT, index: number) => (
          <Grid item xs={12} sm={6} lg={4} key={integration._id}>
            <Fade
              in={true}
              timeout={400}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <Box>
                <IntegrationCard
                  integration={integration}
                  onDisconnect={(id) => disconnectMutation.mutate(id)}
                />
              </Box>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Integrations;
