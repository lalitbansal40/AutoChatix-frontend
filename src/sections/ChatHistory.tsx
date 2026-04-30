/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/iframe-has-title */
import { useCallback, useEffect, useRef, useState } from 'react';

// material-ui
import {
  Card,
  CardContent,
  Dialog,
  Grid,
  Stack,
  Theme,
  Typography
} from '@mui/material';

import UserAvatar from './UserAvatar';

import { UserProfile } from 'types/user-profile';
import { History } from 'types/chat';
import { Box } from '@mui/system';
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Tooltip } from "@mui/material";

interface ChatHistoryProps {
  data: History[];
  theme: Theme;
  user: UserProfile;
}

const getMessageText = (history: any) => {
  const payload = history?.payload || {};

  // 🔥 LIST FIX
  if (history?.type === "list") {
    return payload?.body || "";
  }

  return (
    history?.text ||
    payload?.text?.body ||
    payload?.bodyText ||
    payload?.caption ||
    payload?.interactive?.button_reply?.title ||
    payload?.interactive?.list_reply?.title ||
    payload?.interactive?.nfm_reply?.response_json ||
    payload?.text ||
    ""
  );
};

const ChatHistory = ({ data, theme, user }: ChatHistoryProps) => {
  const [listModal, setListModal] = useState<any>(null);
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

    const payload = msg.payload || {};

    // 🔥 LIST FIX
    if (msg.type === "list") {
      return payload?.body || "List message";
    }

    return (
      msg?.text ||
      payload?.bodyText ||
      payload?.text?.body ||
      payload?.interactive?.button_reply?.title ||
      payload?.interactive?.list_reply?.title ||
      payload?.options?.body ||
      payload?.text ||
      "Message"
    );
  };

  const getStatusUI = (history: any) => {
    const status = history.status;

    if (status === "SENT") return "✓";
    if (status === "DELIVERED") return "✓✓";

    if (status === "READ") {
      return (
        <Typography sx={{ fontSize: 11, color: "#4fc3f7" }}>
          ✓✓
        </Typography>
      );
    }

    if (status === "FAILED") {
      const errorText =
        history.error?.message || "Message failed";

      return (
        <Tooltip
          title={
            <Typography sx={{ fontSize: 12 }}>
              ⚠️ {errorText}
            </Typography>
          }
          arrow
          placement="top"
        >
          <InfoOutlinedIcon
            sx={{
              fontSize: 16,
              color: "#d32f2f",
              cursor: "pointer"
            }}
          />
        </Tooltip>
      );
    }

    return null;
  };

  const ReplyPreview = ({ message }: any) => {
    if (!message) return null;

    const payload = message.payload || {};
    const type = message.type;

    // 🔥 TEMPLATE SUPPORT
    if (type === "template") {
      // ... existing code (same as yours)
    }

    // ✅🔥 ADD THIS BLOCK EXACTLY HERE
    if (type === "interactive_media") {
      return (
        <Stack
          sx={{
            borderLeft: "3px solid #25D366",
            pl: 1,
            mb: 1,
            background: "rgba(0,0,0,0.05)",
            borderRadius: 1,
            maxWidth: 260
          }}
        >
          {/* MEDIA PREVIEW */}
          {payload?.type === "image" && (
            <img
              src={payload?.url}
              style={{
                width: 50,
                height: 50,
                borderRadius: 6,
                objectFit: "cover",
                marginBottom: 4
              }}
            />
          )}

          {payload?.type === "video" && (
            <video
              src={payload?.url}
              style={{
                width: 50,
                height: 50,
                borderRadius: 6
              }}
            />
          )}

          {/* CAPTION */}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              WebkitLineClamp: 2,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical"
            }}
          >
            {payload?.caption || "Media"}
          </Typography>
        </Stack>
      );
    }

    // 🔥 DEFAULT (OLD FLOW)
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

    const formatKey = (key: string) =>
      key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const renderObject = (obj: any) => {
      return Object.entries(obj).map(([key, value]: any) => {

        // 🔥 NESTED OBJECT (like values)
        if (typeof value === "object" && value !== null) {
          return (
            <Stack key={key} spacing={0.5} sx={{ mt: 1 }}>
              <Typography fontWeight={600} fontSize={13}>
                {formatKey(key)}
              </Typography>

              <Stack
                sx={{
                  border: "1px solid #eee",
                  borderRadius: 2,
                  overflow: "hidden"
                }}
              >
                {Object.entries(value).map(([k, v]: any, i, arr) => (
                  <Stack
                    key={k}
                    direction="row"
                    justifyContent="space-between"
                    sx={{
                      px: 1.5,
                      py: 1,
                      background: i % 2 === 0 ? "#fafafa" : "#fff",
                      borderBottom:
                        i !== arr.length - 1 ? "1px solid #eee" : "none"
                    }}
                  >
                    <Typography fontSize={12} fontWeight={500}>
                      {formatKey(k)}
                    </Typography>

                    <Typography fontSize={12}>
                      {String(v)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          );
        }

        // 🔥 NORMAL VALUE
        return (
          <Stack
            key={key}
            direction="row"
            justifyContent="space-between"
            sx={{ px: 0.5, py: 0.5 }}
          >
            <Typography fontSize={12} fontWeight={500}>
              {formatKey(key)}
            </Typography>

            <Typography fontSize={12}>
              {String(value)}
            </Typography>
          </Stack>
        );
      });
    };

    return (
      <Stack spacing={1}>
        <Typography variant="body2" fontWeight={600}>
          Flow Response
        </Typography>

        {renderObject(data)}
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
    const text = getMessageText(history);

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

    if (type === "interactive") {
      const title =
        payload?.interactive?.button_reply?.title ||
        payload?.interactive?.list_reply?.title;

      if (title) {
        return (
          <Typography
            sx={{
              bgcolor: "#DCF8C6",
              px: 1.5,
              py: 0.7,
              borderRadius: 2,
              width: "fit-content",
              fontSize: 14
            }}
          >
            {title}
          </Typography>
        );
      }
    }

    if (type === "interactive_media") {
      return (
        <Stack
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            background: "#fff",
            maxWidth: 300
          }}
        >
          {/* 🔥 MEDIA */}
          {payload?.type === "image" && (
            <img
              src={payload?.url}
              style={{
                width: "100%",
                maxHeight: 200,
                objectFit: "cover"
              }}
            />
          )}

          {payload?.type === "video" && (
            <video
              src={payload?.url}
              controls
              style={{ width: "100%" }}
            />
          )}

          {/* 🔥 CAPTION */}
          {payload?.caption && (
            <Stack sx={{ p: 1.5 }}>
              <Typography sx={{ whiteSpace: "pre-line", fontSize: 14 }}>
                {payload.caption}
              </Typography>
            </Stack>
          )}

          {/* 🔥 BUTTONS (WHATSAPP STYLE) */}
          {payload?.buttons?.length > 0 && (
            <Stack sx={{ borderTop: "1px solid #eee" }}>
              {payload.buttons.map((btn: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    textAlign: "center",
                    py: 1.3,
                    fontSize: 14,
                    color: "#00a884",
                    fontWeight: 500,
                    borderBottom:
                      i !== payload.buttons.length - 1
                        ? "1px solid #eee"
                        : "none",
                    cursor: "pointer",
                    "&:hover": {
                      background: "#f5f5f5"
                    }
                  }}
                >
                  {btn.title}
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      );
    }

    // ================= TEMPLATE (WHATSAPP STYLE) =================
    if (type === "template") {
      const requestTemplate = payload?.request?.template;

      // 🔥 IMPORTANT: use DB components (not request)
      const dbComponents = history?.payload?.templateData?.components || [];

      const bodyComponent = dbComponents.find(
        (c: any) => c.type === "BODY"
      );

      const getRenderedBody = () => {
        //   DB TEMPLATE
        if (bodyComponent?.text) {
          let text = bodyComponent.text;

          // 🔥 TRY FROM REQUEST FIRST
          let bodyParams =
            payload?.request?.template?.components?.find(
              (c: any) => c.type === "body"
            )?.parameters || [];

          // 🔥 FALLBACK (IMPORTANT 🔥)
          if (!bodyParams.length && history.text) {
            return history.text; // already rendered from backend
          }

          // 🔥 REPLACE VARIABLES
          text = text.replace(/{{(\d+)}}/g, (_: any, i: any) => {
            return bodyParams[i - 1]?.text || `{{${i}}}`;
          });

          return text;
        }

        //   OLD SAFE FALLBACK
        return (
          history.text ||
          payload?.text?.body ||
          payload?.bodyText ||
          "Template message"
        );
      };

      const bodyText = getRenderedBody();

      const header = requestTemplate?.components?.find(
        (c: any) => c.type === "header"
      );



      const buttonsComponent = dbComponents.find(
        (c: any) => c.type === "BUTTONS"
      );

      const headerParam = header?.parameters?.[0];

      const headerUrl =
        headerParam?.image?.link ||
        headerParam?.video?.link ||
        headerParam?.document?.link;

      const headerType = headerParam?.type;

      return (
        <Stack
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            background: "#fff",
            maxWidth: 300,
          }}
        >
          {/* 🔥 HEADER */}
          {headerUrl && headerType === "image" && (
            <img
              src={headerUrl}
              style={{ width: "100%", maxHeight: 200, objectFit: "cover" }}
            />
          )}

          {headerUrl && headerType === "video" && (
            <video src={headerUrl} controls style={{ width: "100%" }} />
          )}

          {headerUrl && headerType === "document" && (
            <Box
              sx={{ p: 1.5, cursor: "pointer" }}
              onClick={() => window.open(headerUrl)}
            >
              📄 View Document
            </Box>
          )}

          {/* 🔥 BODY */}
          <Stack sx={{ p: 1.5 }}>
            <Typography sx={{ whiteSpace: "pre-line", fontSize: 14 }}>
              {bodyText}
            </Typography>
          </Stack>

          {/* 🔥 BUTTONS (WHATSAPP STYLE) */}
          {buttonsComponent?.buttons?.length > 0 && (
            <Stack sx={{ borderTop: "1px solid #eee" }}>
              {buttonsComponent.buttons.map((btn: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    textAlign: "center",
                    py: 1.3,
                    fontSize: 14,
                    color: "#00a884",
                    fontWeight: 500,
                    borderBottom:
                      i !== buttonsComponent.buttons.length - 1
                        ? "1px solid #eee"
                        : "none",
                    cursor: "pointer",
                    "&:hover": {
                      background: "#f5f5f5",
                    },
                  }}
                >
                  {/* ICONS */}
                  {btn.type === "URL" && "🔗 "}
                  {btn.type === "PHONE_NUMBER" && "📞 "}
                  {btn.text}
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
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

    if (type === "address_message") {
      const bodyText =
        payload?.text?.body ||
        payload?.bodyText ||
        "Please provide your address";

      return (
        <Stack spacing={1}>
          {/* MESSAGE */}
          <Typography>{bodyText}</Typography>

          {/* 🔥 CTA BUTTON */}
          <Stack
            sx={{
              border: "1px solid #25D366",
              color: "#25D366",
              borderRadius: 2,
              px: 2,
              py: 1,
              cursor: "pointer",
              width: "fit-content",
              fontWeight: 500,
              "&:hover": {
                background: "#f1fdf5"
              }
            }}
          >
            📍 Provide Address
          </Stack>
        </Stack>
      );
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

    if (type === "list") {
      return (
        <Stack spacing={1}>
          {/* BODY */}
          <Typography sx={{ whiteSpace: "pre-line" }}>
            {payload?.body}
          </Typography>

          {/* BUTTON */}
          <Stack
            onClick={() => setListModal(payload)} // 🔥 CLICK HANDLER
            sx={{
              border: "1px solid #eee",
              borderRadius: 2,
              px: 2,
              py: 1,
              color: "#00a884",
              fontWeight: 500,
              cursor: "pointer",
              width: "fit-content",
              "&:hover": {
                background: "#f5f5f5"
              }
            }}
          >
            {payload?.buttonText}
          </Stack>
        </Stack>
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
                    <Stack alignItems="flex-end">
                      <Typography variant="caption">
                        {new Date(history.createdAt).toLocaleTimeString()}
                      </Typography>

                      {getStatusUI(history)}
                    </Stack>
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

      {listModal && (
        <Dialog
          open={!!listModal}
          onClose={() => setListModal(null)}
          fullWidth
          maxWidth="xs"
        >
          <Stack spacing={2} sx={{ p: 2 }}>

            {/* TITLE */}
            <Typography fontWeight={600}>
              {listModal?.sections?.[0]?.title || "Select Option"}
            </Typography>

            {/* OPTIONS */}
            {listModal?.sections?.map((section: any, i: number) => (
              <Stack key={i} spacing={1}>
                {section.rows.map((row: any) => (
                  <Box
                    key={row.id}
                    sx={{
                      border: "1px solid #eee",
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      "&:hover": {
                        background: "#f5f5f5"
                      }
                    }}
                  >
                    <Typography fontWeight={500}>
                      {row.title}
                    </Typography>

                    {row.description && (
                      <Typography fontSize={12} color="text.secondary">
                        {row.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            ))}
          </Stack>
        </Dialog>
      )}
    </Grid>
  );
};

export default ChatHistory;