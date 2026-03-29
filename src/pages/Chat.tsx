import { useEffect, useRef, useState } from 'react';
import { CircularProgress } from '@mui/material';
// material-ui
import { useTheme, styled, Theme } from '@mui/material/styles';
import {
  Box,
  ClickAwayListener,
  Collapse,
  Dialog,
  Grid,
  Menu,
  MenuItem,
  Popper,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';

// third party
import
EmojiPicker,
{
  SkinTones,
  EmojiClickData
} from 'emoji-picker-react';
import { useSearchParams } from 'react-router-dom';
// project import
import ChatDrawer from 'sections/ChatDrawer';
import ChatHistory from 'sections/ChatHistory';
import UserAvatar from 'sections/UserAvatar';
import UserDetails from 'sections/UserDetails';

import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import SimpleBar from 'components/third-party/SimpleBar';
import { PopupTransition } from 'components/@extended/Transitions';

import { dispatch, useSelector } from 'store';
// import { openDrawer } from 'store/reducers/menu';
import { getUserChats } from 'store/reducers/chat';

// assets
import {
  EditOutlined,
  PaperClipOutlined,
  SmileOutlined,
  SoundOutlined,
  PlusOutlined
} from '@ant-design/icons';
// types
import { History as HistoryProps } from 'types/chat';
import { UserProfile } from 'types/user-profile';
import { ThemeMode } from 'types/config';
import { messageService } from 'service/message.service';
import { CreateContactModal } from 'components/chat/CreateContactModel';
import heic2any from "heic2any";
import SendTemplateModal from 'components/chat/SendTemplateModal';
const drawerWidth = 320;

const Main = styled('main', { shouldForwardProp: (prop: string) => prop !== 'open' })(
  ({ theme, open }: { theme: Theme; open: boolean }) => ({
    flexGrow: 1,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.shorter
    }),
    marginLeft: `-${drawerWidth}px`,
    [theme.breakpoints.down('lg')]: {
      paddingLeft: 0,
      marginLeft: 0
    },
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.shorter
      }),
      marginLeft: 0
    })
  })
);

const Chat = () => {
  const theme = useTheme();
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<any>(null);
  const scrollRef = useRef<any>(null);
  const matchDownSM = useMediaQuery(theme.breakpoints.down('lg'));
  const matchDownMD = useMediaQuery(theme.breakpoints.down('md'));
  const [emailDetails, setEmailDetails] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchParams] = useSearchParams();
  const contactIdFromUrl = searchParams.get('contactId');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const fileInputRef = useRef<any>();
  const mediaRecorderRef = useRef<any>();
  const chunksRef = useRef<any[]>([]);
  const [recording, setRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [anchorElPlus, setAnchorElPlus] = useState<null | HTMLElement>(null);
  const openPlusMenu = Boolean(anchorElPlus);

  const handleEditOpen = () => setEditModalOpen(true);
  const handleEditClose = () => setEditModalOpen(false);

  const [data, setData] = useState<HistoryProps[]>([]);
  const chatState = useSelector((state: any) => state?.chat || {});

  const handleUserChange = () => {
    setEmailDetails((prev) => !prev);
  };

  const [openChatDrawer, setOpenChatDrawer] = useState(true);
  const handleDrawerOpen = () => {
    setOpenChatDrawer((prevState) => !prevState);
  };

  const [anchorElEmoji, setAnchorElEmoji] = useState<any>(); /** No single type can cater for all elements */

  const handleOnEmojiButtonClick = (event: React.MouseEvent<HTMLButtonElement> | undefined) => {
    setAnchorElEmoji(anchorElEmoji ? null : event?.currentTarget);
  };

  // handle new message form
  const [message, setMessage] = useState('');
  const textInput = useRef(null);

  const loadOlderMessages = async () => {
    if (!cursor || loadingMore || !user?._id) return;

    try {
      setLoadingMore(true);

      const res = await messageService.getMessages(user._id, cursor);

      setData((prev) => [...res.data, ...prev]); // prepend old messages
      setCursor(res.nextCursor || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };


  // handle emoji
  const onEmojiClick = (emojiObject: EmojiClickData, event: MouseEvent) => {
    setMessage(message + emojiObject.emoji);
  };

  const emojiOpen = Boolean(anchorElEmoji);
  const emojiId = emojiOpen ? 'simple-popper' : undefined;

  const handleCloseEmoji = () => {
    setAnchorElEmoji(null);
  };

  const handleFileUpload = async (e: any) => {
    const files = Array.from(e.target.files || []) as File[];

    const processedFiles: File[] = [];

    for (const file of files) {
      // 🔥 HEIC HANDLE
      if (
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic")
      ) {
        try {
          console.log("🖼️ Converting HEIC → JPG (frontend)");

          const convertedBlob: any = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          });

          const convertedFile = new File(
            [convertedBlob],
            `${Date.now()}.jpg`,
            { type: "image/jpeg" }
          );

          processedFiles.push(convertedFile);
        } catch (err) {
          console.error("HEIC convert failed", err);
        }
      } else {
        processedFiles.push(file);
      }
    }

    setSelectedFiles((prev) => {
      const newFiles = processedFiles.filter(
        (f) => !prev.some((p) => p.name === f.name && p.size === f.size)
      );

      return [...prev, ...newFiles];
    });

    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendAll = async () => {
    if (!user?._id || !user?.channel_id) return;

    //   TEXT ONLY CASE
    if (selectedFiles.length === 0 && message.trim()) {
      await messageService.sendMessage({
        channelId: user.channel_id,
        contactId: user._id,
        text: message
      });

      setMessage("");
      return;
    }

    try {
      const formData = new FormData();

      // 🔥 append files
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("contactId", user._id);
      formData.append("channelId", user.channel_id);

      if (message.trim()) {
        formData.append("caption", message);
      }

      // 🔥 optimistic UI (optional but recommended)
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        direction: "OUT",
        type: "media_group",
        payload: {
          files: selectedFiles.map((file) => ({
            url: URL.createObjectURL(file),
            type: file.type
          })),
          caption: message
        },
        createdAt: new Date().toISOString()
      };

      setData(prev => [...prev, tempMessage as any]);

      // 🔥 API call
      await messageService.sendMedia(formData);

      // reset
      setSelectedFiles([]);
      setMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  const pauseRecording = () => {
    mediaRecorderRef.current.pause();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    mediaRecorderRef.current.resume();
    setIsPaused(false);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/ogg" });
      setAudioBlob(blob);
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    return new Promise<Blob>((resolve) => {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/ogg" });
        setAudioBlob(blob);
        resolve(blob); // 🔥 important
      };

      mediaRecorderRef.current.stop();
      setRecording(false);
    });
  };

  const sendRecordedAudio = async () => {
    if (!user?._id || !user?.channel_id) return;

    let blob = audioBlob;

    // 🔥 ensure blob exists
    if (!blob) {
      blob = await stopRecording();
    }

    const formData = new FormData();
    formData.append("files", blob, "audio.ogg");
    formData.append("contactId", user._id);
    formData.append("channelId", user.channel_id);

    await messageService.sendMedia(formData);

    setAudioBlob(null);
    setRecordModalOpen(false);
  };

  const handlePlusClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElPlus(event.currentTarget);
  };

  const handlePlusClose = () => {
    setAnchorElPlus(null);
  };

  // close sidebar when widow size below 'md' breakpoint
  useEffect(() => {
    setOpenChatDrawer(!matchDownSM);
  }, [matchDownSM]);


  useEffect(() => {
    if (chatState?.chats) {
      setData(chatState.chats);
    }
  }, [chatState?.chats]);


  useEffect(() => {
    if (user?.name) {
      dispatch(getUserChats(user.name));
    }
  }, [user?.name]);

  useEffect(() => {
    if (!user?._id) return;

    setData([]);
    setCursor(null);
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;

    const fetchMessages = async () => {
      const res = await messageService.getMessages(user._id as string);

      setData(res.data);
      setCursor(res.nextCursor || null);
    };

    fetchMessages();
  }, [user?._id]);

  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop === 0) {
        loadOlderMessages();
      }
    };

    el.addEventListener('scroll', handleScroll);

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);

  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        URL.revokeObjectURL(file as any);
      });
    };
  }, [selectedFiles]);

  return (
    <Box sx={{ display: 'flex' }}>
      <ChatDrawer openChatDrawer={openChatDrawer} handleDrawerOpen={handleDrawerOpen} setUser={setUser} selectedUserId={contactIdFromUrl} />
      <Main theme={theme} open={openChatDrawer} sx={{height:530}}>
        <Grid container>
          <Grid
            item
            xs={12}
            md={emailDetails ? 8 : 12}
            xl={emailDetails ? 9 : 12}
            sx={{
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.shorter + 200
              })
            }}
          >
            <MainCard
              content={false}
              sx={{
                bgcolor: theme.palette.mode === ThemeMode.DARK ? 'dark.main' : 'grey.50',
                pt: 2,
                pl: 2,
                borderRadius: emailDetails ? '0' : '0 4px 4px 0',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.easeOut,
                  duration: theme.transitions.duration.shorter + 200
                })
              }}
            >
              <Grid container spacing={3}>
                <Grid
                  item
                  xs={12}
                  sx={{ bgcolor: theme.palette.background.paper, pr: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
                >
                  <Grid container alignItems="center" sx={{ width: '100%' }}>

                    {/* LEFT */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <UserAvatar
                        user={{
                          online_status: user?.online_status,
                          avatar: user?.avatar,
                          name: user?.name
                        }}
                      />

                      <Stack>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {user?.name}
                        </Typography>

                        <Typography variant="caption" color="textSecondary">
                          {user?.phone}
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* RIGHT ICON */}
                    <Box
                      onClick={() => {
                        if (!user?._id) return;
                        handleEditOpen();
                      }}

                      sx={{
                        marginLeft: 'auto', // 🔥 THIS IS KEY
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          opacity: 1,
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <EditOutlined style={{ fontSize: 18 }} />
                    </Box>

                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <SimpleBar
                    scrollableNodeProps={{ ref: scrollRef }}
                    sx={{
                      overflowX: 'hidden',
                      height: 'calc(100vh - 355px)',
                      minHeight: 520
                    }}
                  >
                    <Box sx={{ pl: 1, pr: 3 }}>

                      {/* Loader for pagination */}
                      {loadingMore && (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            py: 1
                          }}
                        >
                          <CircularProgress size={20} />
                        </Box>
                      )}

                      <ChatHistory theme={theme} user={user ?? {}} data={data} />

                      {/* Scroll target */}
                      <div ref={bottomRef} />

                    </Box>
                  </SimpleBar>
                </Grid>
                <Grid item xs={12} sx={{ mt: 3, bgcolor: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}` }}>
                  {selectedFiles.length > 0 && (
                    <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                      {selectedFiles.map((file, index) => {
                        const url = URL.createObjectURL(file);

                        if (file.type.startsWith("image")) {
                          return (
                            <Box key={index} sx={{ position: "relative" }}>
                              <img
                                alt='unkown'
                                src={url}
                                style={{ width: 80, height: 80, borderRadius: 8 }}
                              />
                              <span
                                onClick={() => removeFile(index)}
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  right: 0,
                                  cursor: "pointer",
                                  background: "black",
                                  color: "white",
                                  borderRadius: "50%",
                                  padding: "2px 6px",
                                  fontSize: 12
                                }}
                              >
                                ×
                              </span>
                            </Box>
                          );
                        }

                        if (file.type.startsWith("video")) {
                          return (
                            <Box key={index} sx={{ position: "relative" }}>
                              <video
                                src={url}
                                controls
                                style={{ width: 80, height: 80, borderRadius: 8 }}
                              />
                              <span
                                onClick={() => removeFile(index)}
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  right: 0,
                                  cursor: "pointer",
                                  background: "black",
                                  color: "white",
                                  borderRadius: "50%",
                                  padding: "2px 6px",
                                  fontSize: 12
                                }}
                              >
                                ×
                              </span>
                            </Box>
                          );
                        }

                        return (
                          <Box key={index} sx={{ position: "relative", p: 1, border: "1px solid #ccc" }}>
                            📄 {file.name}
                            <span
                              onClick={() => removeFile(index)}
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                cursor: "pointer",
                                background: "black",
                                color: "white",
                                borderRadius: "50%",
                                padding: "2px 6px",
                                fontSize: 12
                              }}
                            >
                              ×
                            </span>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                  {/* 🔴 RECORDING INDICATOR */}
                  {recording && (
                    <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: "red",
                          mr: 1,
                          animation: "pulse 1s infinite"
                        }}
                      />
                      <Typography color="error">Recording...</Typography>
                    </Box>
                  )}
                  <TextField
                    inputRef={textInput}
                    fullWidth
                    multiline
                    rows={1}
                    maxRows={4}
                    placeholder="Your Message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value.length <= 1 ? e.target.value.trim() : e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAll();
                      }
                    }}
                    variant="standard"
                    sx={{
                      pr: 2,
                      '& .MuiInput-root:before': { borderBottomColor: theme.palette.divider }
                    }}
                  />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" sx={{ py: 2, ml: -1 }}>
                      <>
                        <IconButton
                          ref={anchorElEmoji}
                          aria-describedby={emojiId}
                          onClick={handleOnEmojiButtonClick}
                          sx={{ opacity: 0.5 }}
                          size="medium"
                          color="secondary"
                        >
                          <SmileOutlined />
                        </IconButton>
                        <Popper
                          id={emojiId}
                          open={emojiOpen}
                          anchorEl={anchorElEmoji}
                          disablePortal
                          style={{ zIndex: 1200 }}
                          popperOptions={{
                            modifiers: [
                              {
                                name: 'offset',
                                options: {
                                  offset: [-20, 125]
                                }
                              }
                            ]
                          }}
                        >
                          <ClickAwayListener onClickAway={handleCloseEmoji}>
                            <MainCard elevation={8} content={false}>
                              <EmojiPicker onEmojiClick={onEmojiClick} defaultSkinTone={SkinTones.DARK} autoFocusSearch={false} />
                            </MainCard>
                          </ClickAwayListener>
                        </Popper>
                      </>
                      <IconButton
                        sx={{ opacity: 0.7 }}
                        size="medium"
                        color="secondary"
                        onClick={handlePlusClick}
                      >
                        <PlusOutlined />
                      </IconButton>
                      <Menu
                        anchorEl={anchorElPlus}
                        open={openPlusMenu}
                        onClose={handlePlusClose}
                        anchorOrigin={{
                          vertical: "top",
                          horizontal: "right",
                        }}
                        transformOrigin={{
                          vertical: "bottom",
                          horizontal: "left",
                        }}
                      >
                        <MenuItem
                          onClick={() => {
                            handlePlusClose();
                            setTemplateModalOpen(true);
                          }}
                        >
                          📩 Send Template
                        </MenuItem>

                        {/* Future options */}
                        <MenuItem disabled>📊 Campaign (Coming soon)</MenuItem>
                      </Menu>
                      <IconButton
                        sx={{ opacity: 0.5 }}
                        size="medium"
                        color="secondary"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <PaperClipOutlined />
                      </IconButton>
                      {/* <IconButton sx={{ opacity: 0.5 }} size="medium" color="secondary">
                        <PictureOutlined />
                      </IconButton> */}
                      <IconButton
                        sx={{ opacity: 0.5 }}
                        size="medium"
                        color="secondary"
                        onClick={() => {
                          setRecordModalOpen(true);
                        }}
                      >
                        <SoundOutlined />
                      </IconButton>
                      {/* <IconButton color="primary" onClick={handleOnSend} size="large" sx={{ mr: 1.5 }}>
                        <SendOutlined />
                      </IconButton> */}
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </MainCard>
          </Grid>
          <Grid item xs={12} md={4} xl={3} sx={{ overflow: 'hidden', display: emailDetails ? 'flex' : 'none' }}>
            <Collapse orientation="horizontal" in={emailDetails && !matchDownMD}>
              <UserDetails user={user ?? {}} onClose={handleUserChange} />
            </Collapse>
          </Grid>

          <Dialog TransitionComponent={PopupTransition} onClose={handleUserChange} open={matchDownMD && emailDetails} scroll="body">
            <UserDetails user={user ?? {}} onClose={handleUserChange} />
          </Dialog>
        </Grid>
      </Main>
      {editModalOpen && user?._id && (
        <CreateContactModal
          contactModalOpen={editModalOpen}
          handleClose={handleEditClose}
          channelId={user.channel_id as string}
          contactCreateRefresh={() => { }}
          contactId={user._id} // 🔥 THIS IS EDIT MODE
        />
      )}

      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      <Dialog
        open={recordModalOpen}
        onClose={() => {
          if (recording) stopRecording();

          setRecordModalOpen(false);
          setHasStarted(false);
          setAudioBlob(null);
        }}
      >
        {audioBlob && !hasStarted && (
          <audio controls style={{ width: "100%", marginBottom: 10 }}>
            <source src={URL.createObjectURL(audioBlob)} />
          </audio>
        )}
        <Box sx={{ p: 3, width: 300 }}>
          {/* 🔥 FAKE WAVEFORM */}
          <Box sx={{ display: "flex", gap: 0.5, mb: 2 }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 3,
                  height: Math.random() * 30 + 10,
                  background: "#4caf50",
                  borderRadius: 2,
                  animation: "pulse 1s infinite"
                }}
              />
            ))}
          </Box>

          {/* CONTROLS */}
          <Stack direction="row" spacing={2} justifyContent="center">

            {!hasStarted ? (
              <button
                onClick={() => {
                  startRecording();
                  setHasStarted(true);
                }}
              >
                🎤 Start
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button onClick={pauseRecording}>⏸</button>
                ) : (
                  <button onClick={resumeRecording}>▶</button>
                )}

                <button
                  onClick={async () => {
                    await stopRecording();
                    setHasStarted(false);
                  }}
                >
                  ⏹ Stop
                </button>
              </>
            )}

            <button onClick={sendRecordedAudio}>📤 Send</button>

          </Stack>
        </Box>
      </Dialog>
      {templateModalOpen && (
        <SendTemplateModal
          channelId={user?.channel_id as string}
          open={templateModalOpen}
          onClose={() => setTemplateModalOpen(false)}
          user={user}
        />
      )}
    </Box>
  );
};

export default Chat;
