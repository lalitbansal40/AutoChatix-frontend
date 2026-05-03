import { Box, Button, CircularProgress, Fade, Grid, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#25D366' }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Typography color="error">{(error as Error).message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 3 }}>

      {/* ── PAGE HEADER ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: -0.4, mb: 0.5 }}>
            Integrations
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: '#6b7280' }}>
            Connect third-party services to automate your workflows
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
          sx={{
            bgcolor: '#25D366',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            borderRadius: '10px',
            px: 2.5,
            py: 1,
            textTransform: 'none',
            boxShadow: '0 2px 10px rgba(37,211,102,0.35)',
            '&:hover': { bgcolor: '#1db954', boxShadow: '0 4px 14px rgba(37,211,102,0.45)' },
          }}
        >
          Add Integration
        </Button>
      </Box>

      {/* ── CARDS ── */}
      {data?.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography fontSize={48} lineHeight={1} mb={2}>🔌</Typography>
          <Typography fontSize={16} fontWeight={700} color="#374151" mb={0.75}>No integrations yet</Typography>
          <Typography fontSize={13} color="#9ca3af">Connect a service to automate your workflows</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {data?.map((integration: IntegrationT, index: number) => (
            <Grid item xs={12} sm={6} lg={4} key={integration._id}>
              <Fade in timeout={350} style={{ transitionDelay: `${index * 80}ms` }}>
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
      )}
    </Box>
  );
};

export default Integrations;
