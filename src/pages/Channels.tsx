import {
  Grid,
  CircularProgress,
  Typography,
  Fade,
  Box,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import ChannelCard from "components/ChannelCard";
import { channelService } from "service/channel.service";
import { ChannelT } from "types/channels";

const Channels = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelService.getChannels(),
    select: (response) => response.data,
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
        Channels
      </Typography>

      <Grid container spacing={3}>
        {data?.map((channel: ChannelT, index: number) => (
          <Grid item xs={12} sm={6} lg={4} key={channel._id}>
            <Fade
              in={true}
              timeout={400}
              style={{
                transitionDelay: `${index * 200}ms`, // 👈 sequential delay
              }}
            >
              <Box>
                <ChannelCard channel={channel} />
              </Box>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Channels;