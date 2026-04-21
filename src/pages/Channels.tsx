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
import { Button } from "@mui/material";


// const connectWhatsApp = () => {
//   const clientId = "1577064810024190";

//   const redirectUri = encodeURIComponent(
//     "https://58c2-2405-201-5c21-b07c-1dfc-4bac-2202-f0b0.ngrok-free.app/meta/callback"
//   );

//   const configId = "1496415178861183";

//   // 🔥 Replace this with real logged-in user ID
//   const accountId =
//     localStorage.getItem("account_id") || "test_user_123";

//   // 🔥 Properly encoded extras
//   const extras = encodeURIComponent(
//     JSON.stringify({
//       setup: {
//         solutionID: configId,
//       },
//     })
//   );

//   const scope = encodeURIComponent(
//     "business_management,whatsapp_business_management,whatsapp_business_messaging"
//   );

//   const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${accountId}&scope=${scope}&extras=${extras}`;

//   // 🔥 Better UX (replace tab instead of new tab)
//   window.location.href = url;
// };


const connectWhatsApp = () => {
  window.location.href = "https://business.facebook.com/messaging/whatsapp/onboard/?app_id=1577064810024190&config_id=1496415178861183&extras=%7B%22sessionInfoVersion%22%3A%223%22%2C%22version%22%3A%22v4%22%7D";
};
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
      <Grid>

        <Typography variant="h4" mb={3}>
          Channels
        </Typography>
        <Box display="flex" justifyContent="space-between" mb={3}>
          <Typography variant="h4">Channels</Typography>

          <Button variant="contained" onClick={connectWhatsApp}>
            Connect WhatsApp
          </Button>
        </Box>
      </Grid>



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