import { Fragment, useEffect } from 'react';
// import { Badge } from "@mui/material";
// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider, List, ListItemAvatar, ListItemButton, ListItemText, Stack, Typography } from '@mui/material';
import { CircularProgress, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// third-party
import { Chance } from 'chance';

// project imports
import UserAvatar from './UserAvatar';
import { useDispatch } from 'store';
import { getUsers } from 'store/reducers/chat';

// assets
import { CheckOutlined } from '@ant-design/icons';

// types
import { UserProfile } from 'types/user-profile';
import { contactService } from 'service/contact.service';

const chance = new Chance();

interface UserListProps {
  setUser: (u: UserProfile) => void;
  data: any;
  isLoading: boolean;
  refetch: () => void;
  selectedUserId?: string;
}

function UserList({ setUser, data, isLoading, refetch, selectedUserId }: UserListProps) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getLastMessagePreview = (msg: any) => {
    if (!msg) return "";

    const type = msg.type;
    const isOutgoing = msg.direction === "OUT";

    const text =
      msg.text ||
      msg.payload?.text?.body ||
      msg.payload?.bodyText ||
      msg.payload?.caption;

    let preview = "";

    switch (type) {
      case "text":
        preview = text;
        break;

      case "image":
        preview = text || "📷 Photo";
        break;

      case "video":
        preview = text || "🎥 Video";
        break;

      case "audio":
        preview = "🎵 Voice message";
        break;

      case "document":
        preview = text || `📄 ${msg.media?.filename || "Document"}`;
        break;

      case "contacts":
        preview = `👤 ${text || "Contact"}`;
        break;

      case "location":
        preview = "📍 Location";
        break;

      case "button":
        preview = msg.payload?.bodyText;
        break;

      case "interactive":
        preview =
          msg.payload?.interactive?.button_reply?.title ||
          msg.payload?.interactive?.list_reply?.title;
        break;

      default:
        preview = text || "Message";
    }

    // 👉 WhatsApp style "You:"
    if (isOutgoing) {
      return `You: ${preview}`;
    }

    return preview;
  };

  useEffect(() => {
    dispatch(getUsers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 200
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }
  return (
    <List component="nav">
      {data?.filter(Boolean)?.map((user: any) => {
        return (
          <Fragment key={user._id}>
            <ListItemButton
              sx={{ pl: 1 }}
              selected={selectedUserId === user._id}
              onClick={async () => {
                // setUser(user);

                // 🔥 URL update
                navigate(`?contactId=${user._id}`);

                if (user.unread_count > 0) {
                  await contactService.markAsRead(user._id);
                  refetch();
                }
              }}
            >
              <ListItemAvatar>
                <UserAvatar user={user} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Stack component="span" direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography
                      variant="h5"
                      color="inherit"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {user?.name || user?.phone || 'Unknown'}
                    </Typography>
                    {/* <Typography component="span" color="textSecondary" variant="caption"> */}
                    {/* {user.last_message_id.payload.bodyText} */}
                    {/* </Typography> */}
                  </Stack>
                }
                secondary={
                  <Stack component="span" direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getLastMessagePreview(user?.last_message_id)}

                    </Typography>
                    {user.unread_count > 0 ? (
                      <Box
                        sx={{
                          backgroundColor: "#25D366",
                          color: "white",
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: "50%",
                          minWidth: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          px: 0.5
                        }}
                      >
                        {user.unread_count}
                      </Box>
                    ) : (
                      <CheckOutlined
                        style={{
                          color: chance.bool()
                            ? theme.palette.grey[400]
                            : theme.palette.primary.main
                        }}
                      />
                    )}
                  </Stack>
                }
              />
            </ListItemButton>
            <Divider />
          </Fragment>
        )
      })}
    </List>
  );
}

export default UserList;
