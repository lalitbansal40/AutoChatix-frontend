/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/iframe-has-title */
import { useCallback, useEffect, useRef } from 'react';

// material-ui
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Theme,
  Typography,
  // IconButton, Slider
  // Button,
  // Link
} from '@mui/material';
// import { PlayArrow, Pause } from "@mui/icons-material";


// project imports
import UserAvatar from './UserAvatar';

// types
import { UserProfile } from 'types/user-profile';
import { History } from 'types/chat';
// import { ThemeMode } from 'types/config';

interface ChatHistoryProps {
  data: History[];
  theme: Theme;
  user: UserProfile;
}

const ChatHistory = ({ data, theme, user }: ChatHistoryProps) => {
  const wrapper = useRef(document.createElement('div'));
  const el = wrapper.current;

  const scrollToBottom = useCallback(() => {
    el.scrollIntoView(false);
  }, [el]);

  useEffect(() => {
    scrollToBottom();
  }, [data?.length, scrollToBottom]);

  const getReplyText = (msg: any) => {
    if (!msg) return "";

    const payload = msg.payload;

    return (
      payload?.bodyText ||
      payload?.text?.body ||
      payload?.interactive?.button_reply?.title ||
      payload?.interactive?.list_reply?.title ||
      payload?.options?.body ||
      payload?.text ||
      "Message"
    );
  };

  const ReplyPreview = ({ message }: any) => {
    if (!message) return null;

    return (
      <Stack
        sx={{
          borderLeft: "3px solid #25D366",
          pl: 1,
          mb: 1,
          background: "rgba(0,0,0,0.05)",
          borderRadius: 1,
          alignSelf: "flex-start"
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "normal",
            maxWidth: 260
          }}
        >
          {getReplyText(message)}
        </Typography>
      </Stack>
    );
  };

  const RenderFlowResponse = ({ response }: any) => {
    if (!response) return null;

    let data: any = {};

    try {
      data = JSON.parse(response);
    } catch (e) {
      return <Typography>{response}</Typography>;
    }

    return (
      <Stack spacing={1}>
        <Typography variant="body2" fontWeight={600}>
          Flow Response
        </Typography>

        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            {Object.entries(data).map(([key, value]: any) => (
              <tr key={key}>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 6,
                    fontWeight: 600
                  }}
                >
                  {key}
                </td>

                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 6
                  }}
                >
                  {String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Stack>
    );
  };

  // ==============================|| RENDER MESSAGE BY TYPE ||============================== //

  const RenderMessage = ({ history }: any) => {
    if (!history) return null;

    const type = history?.type;
    const payload = history?.payload || {};
    const media = history?.media || {};

    // 🔥 TEXT (priority order)
    const text =
      history?.text ||
      payload?.caption ||
      payload?.text?.body ||
      payload?.bodyText ||
      payload?.caption ||
      payload?.text;

    // 🔥 UNIVERSAL URL (old + new)
    const url =
      payload?.url ||
      media?.url ||
      payload?.image?.url ||
      payload?.video?.url ||
      payload?.audio?.url ||
      payload?.document?.url;

    if (type === "audio") {
      return (
        <audio
          src={url}
          controls
          style={{
            width: "100%",
            minWidth: 220,
            maxWidth: 420,
            height: 40
          }}
        />
      );
    }

    // 🔥 FORCE MEDIA RENDER (OUTGOING FIX)
    if (payload?.url) {
      if (type === "image") {
        return <img
          src={payload?.url}
          style={{ maxWidth: 250, borderRadius: 8 }}
          onError={(e: any) => {
            e.target.src = "/image-error.png"; // fallback
          }}
        />;
      }

      if (type === "video") {
        return <video src={payload.url} controls style={{ maxWidth: 250 }} />;
      }

      if (type === "document") {
        return (
          <Stack onClick={() => window.open(payload.url)}>
            <Typography>📄 {payload.filename || "Document"}</Typography>
          </Stack>
        );
      }
    }
    // ================= TEXT =================
    if (type === "text") {
      return <Typography>{text}</Typography>;
    }

    if (type === "interactive" && payload?.interactive?.nfm_reply) {
      return (
        <RenderFlowResponse
          response={payload?.interactive?.nfm_reply?.response_json}
        />
      );
    }

    // ================= IMAGE =================
    if (type === "image") {
      return (
        <Stack spacing={0.5}>
          {url && (
            <img
              src={url}
              style={{ maxWidth: 250, borderRadius: 8 }}
              onError={(e: any) => {
                e.target.src = "/image-error.png"; // fallback
              }}
            />
          )}

          {/* 🔥 caption support */}
          {text && <Typography variant="body2">{text}</Typography>}
        </Stack>
      );
    }

    // ================= VIDEO =================
    if (type === "video") {
      return (
        <Stack spacing={0.5}>
          {url && (
            <video src={url} controls style={{ maxWidth: 250 }} />
          )}

          {text && <Typography variant="body2">{text}</Typography>}
        </Stack>
      );
    }


    // ================= DOCUMENT =================
    if (type === "document") {
      const filename =
        payload?.filename || // 🔥 ADD THIS
        media?.filename ||
        payload?.document?.filename ||
        "Document";

      return (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ cursor: "pointer" }}
          onClick={() => url && window.open(url, "_blank")}
        >
          <Typography fontSize={28}>📄</Typography>

          <Stack>
            <Typography fontWeight={500}>
              {filename}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Tap to open
            </Typography>
          </Stack>
        </Stack>
      );
    }

    // ================= LOCATION =================
    if (type === "location") {
      const lat = payload?.location?.latitude;
      const lng = payload?.location?.longitude;

      if (!lat || !lng) {
        return <Typography>📍 Location</Typography>;
      }

      return (
        <iframe
          width="100%"
          height="180"
          style={{ borderRadius: 8 }}
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
        />
      );
    }

    // ================= CONTACT =================
    if (type === "contacts") {
      const contact = payload?.contacts?.[0];

      const name =
        contact?.name?.formatted_name ||
        contact?.name?.first_name ||
        "Contact";

      const phone = contact?.phones?.[0]?.phone;
      const waId = contact?.phones?.[0]?.wa_id;

      return (
        <Stack spacing={0.5}>
          <Typography fontWeight={600}>{name}</Typography>

          {phone && (
            <Typography
              sx={{ color: "#25D366", cursor: "pointer" }}
              onClick={() => window.open(`https://wa.me/${waId}`, "_blank")}
            >
              {phone}
            </Typography>
          )}
        </Stack>
      );
    }

    // ================= BUTTON =================
    if (type === "button") {
      return (
        <Stack spacing={1}>
          <Typography>{payload?.bodyText}</Typography>

          {payload?.buttons?.map((btn: any) => (
            <Stack
              key={btn.id}
              sx={{
                border: "1px solid #ddd",
                borderRadius: 2,
                px: 2,
                py: 1,
                cursor: "pointer",
                width: "fit-content",
                "&:hover": {
                  background: "#f5f5f5"
                }
              }}
            >
              <Typography variant="body2">
                {btn.title}
              </Typography>
            </Stack>
          ))}
        </Stack>
      );
    }

    // ================= INTERACTIVE =================
    if (type === "interactive") {
      return (
        <Stack>
          <Typography
            sx={{
              bgcolor: "#DCF8C6",
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              width: "fit-content"
            }}
          >
            {payload?.interactive?.button_reply?.title ||
              payload?.interactive?.list_reply?.title}
          </Typography>
        </Stack>
      );
    }

    if (type === "flow") {
      const options = payload?.options || {};

      return (
        <Stack
          spacing={1}
          sx={{
            border: "1px solid #ddd",
            borderRadius: 2,
            p: 1.5,
            maxWidth: 260
          }}
        >
          <Typography fontWeight={600}>
            {options.header}
          </Typography>

          <Typography variant="body2">
            {options.body}
          </Typography>

          <Stack
            sx={{
              borderTop: "1px solid #eee",
              pt: 1,
              mt: 1,
              color: "#25D366",
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            {options.cta}
          </Stack>
        </Stack>
      );
    }

    if (type === "cta_url") {
      return (
        <Stack spacing={1}>
          <Typography>{payload?.bodyText}</Typography>

          <Stack
            onClick={() => window.open(payload?.url)}
            sx={{
              border: "1px solid #25D366",
              color: "#25D366",
              borderRadius: 2,
              px: 2,
              py: 1,
              cursor: "pointer",
              width: "fit-content",
              fontWeight: 500
            }}
          >
            {payload?.buttonText}
          </Stack>
        </Stack>
      );
    }

    // ================= OLD FALLBACK (IMPORTANT) =================
    return (
      <Typography>
        {payload?.bodyText ||
          payload?.text?.body ||
          payload?.text ||
          text ||
          "Message"}
      </Typography>
    );
  };

  const groupedMessages: any[] = [];

  data.forEach((msg: any) => {
    if (msg.group_id) {
      const existing = groupedMessages.find(
        (g) => g.group_id === msg.group_id
      );

      if (existing) {
        existing.items.push(msg);
      } else {
        groupedMessages.push({
          group_id: msg.group_id,
          items: [msg],
          direction: msg.direction
        });
      }
    } else {
      groupedMessages.push(msg);
    }
  });

  if (!data) return null;

  return (
    <Grid container spacing={2.5} ref={wrapper}>
      {groupedMessages.map((group: any, index: number) => {

        // 🔥 GROUP CASE (MULTIPLE MEDIA)
        if (group.items) {
          const first = group.items[0];

          return (
            <Grid item xs={12} key={index}>
              {group.direction !== 'IN' ? (
                <Stack spacing={1.25} direction="row">
                  <Grid container spacing={1} justifyContent="flex-end">
                    <Grid item xs={2} md={3} xl={4} />

                    <Grid item xs={10} md={9} xl={8}>
                      <Stack direction="row" justifyContent="flex-end">
                        <Card
                          sx={{
                            maxWidth: 520,
                            bgcolor: 'grey.100',
                            boxShadow: 'none',
                            ml: 1
                          }}
                        >
                          <CardContent sx={{ p: 1 }}>

                            {/* 🔥 MEDIA GRID */}
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {group.items.map((item: any, i: number) => {
                                const url = item.payload?.url;

                                if (item.type === "image") {
                                  return (
                                    <img
                                      key={i}
                                      src={url}
                                      onError={(e: any) => {
                                        e.target.src = "/image-error.png"; // fallback
                                      }}
                                      style={{
                                        width: 140,
                                        height: 140,
                                        borderRadius: 8,
                                        objectFit: "cover"
                                      }}
                                    />
                                  );
                                }

                                if (item.type === "video") {
                                  return (
                                    <video
                                      key={i}
                                      src={url}
                                      controls
                                      style={{
                                        width: 140,
                                        height: 140,
                                        borderRadius: 8
                                      }}
                                    />
                                  );
                                }

                                return null;
                              })}
                            </Stack>

                            {/* 🔥 CAPTION */}
                            {first.payload?.caption && (
                              <Typography sx={{ mt: 1 }}>
                                {first.payload.caption}
                              </Typography>
                            )}

                          </CardContent>
                        </Card>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} display="flex" justifyContent="flex-end">
                      <Typography variant="caption">
                        {new Date(first.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Grid>
                  </Grid>

                  <UserAvatar user={{ online_status: 'available', avatar: 'avatar-1.png', name: 'User 1' }} />
                </Stack>
              ) : (
                <Stack direction="row" spacing={1.25}>
                  <UserAvatar user={user} />

                  <Grid container spacing={1}>
                    <Grid item xs={10} md={9} xl={8}>
                      <Card sx={{ maxWidth: 520, boxShadow: 'none', ml: 1 }}>
                        <CardContent sx={{ p: 1 }}>

                          {/* 🔥 MEDIA GRID */}
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {group.items.map((item: any, i: number) => {
                              const url = item.payload?.url;

                              if (item.type === "image") {
                                return (
                                  <img
                                    key={i}
                                    src={url}
                                    style={{
                                      width: 140,
                                      height: 140,
                                      borderRadius: 8,
                                      objectFit: "cover"
                                    }}
                                  />
                                );
                              }

                              if (item.type === "video") {
                                return (
                                  <video
                                    key={i}
                                    src={url}
                                    controls
                                    style={{
                                      width: 140,
                                      height: 140,
                                      borderRadius: 8
                                    }}
                                  />
                                );
                              }

                              return null;
                            })}
                          </Stack>

                          {/* 🔥 CAPTION */}
                          {first.payload?.caption && (
                            <Typography sx={{ mt: 1 }}>
                              {first.payload.caption}
                            </Typography>
                          )}

                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption">
                        {new Date(first.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Stack>
              )}
            </Grid>
          );
        }

        // 🔥 NORMAL MESSAGE (OLD FLOW)
        const history = group;

        return (
          <Grid item xs={12} key={index}>
            {history.direction !== 'IN' ? (
              <Stack spacing={1.25} direction="row">
                <Grid container spacing={1} justifyContent="flex-end">
                  <Grid item xs={2} md={3} xl={4} />

                  <Grid item xs={10} md={9} xl={8}>
                    <Stack direction="row" justifyContent="flex-end">
                      <Card sx={{ maxWidth: 520, boxShadow: 'none', ml: 1 }}>
                        <CardContent sx={{ p: 1 }}>
                          <ReplyPreview message={history.reply_message} />
                          <RenderMessage history={history} />
                        </CardContent>
                      </Card>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} display="flex" justifyContent="flex-end">
                    <Typography variant="caption">
                      {new Date(history.createdAt).toLocaleTimeString()}
                    </Typography>
                  </Grid>
                </Grid>

                <UserAvatar user={{ online_status: 'available', avatar: 'avatar-1.png', name: 'User 1' }} />
              </Stack>
            ) : (
              <Stack direction="row" spacing={1.25}>
                <UserAvatar user={user} />

                <Grid container spacing={1}>
                  <Grid item xs={10} md={9} xl={8}>
                    <Card sx={{ maxWidth: 300, boxShadow: 'none', ml: 1 }}>
                      <CardContent sx={{ p: 1 }}>
                        <ReplyPreview message={history.reply_message} />
                        <RenderMessage history={history} />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption">
                      {new Date(history.createdAt).toLocaleTimeString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            )}
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ChatHistory;