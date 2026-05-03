import { useCallback, useEffect, useRef, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  ClickAwayListener,
  Dialog,
  Menu,
  MenuItem,
  OutlinedInput,
  Popper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import EmojiPicker, { SkinTones, EmojiClickData } from 'emoji-picker-react';
import { useSearchParams } from 'react-router-dom';
import ChatDrawer from 'sections/ChatDrawer';
import ChatHistory from 'sections/ChatHistory';
import UserDetails from 'sections/UserDetails';
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import SimpleBar from 'components/third-party/SimpleBar';
import { PopupTransition } from 'components/@extended/Transitions';
import { dispatch, useSelector } from 'store';
import { getUserChats } from 'store/reducers/chat';
import {
  EditOutlined,
  PaperClipOutlined,
  SmileOutlined,
  SoundOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import { History as HistoryProps } from 'types/chat';
import { UserProfile } from 'types/user-profile';
import { messageService } from 'service/message.service';
import { contactService } from 'service/contact.service';
import { CreateContactModal } from 'components/chat/CreateContactModel';
import heic2any from 'heic2any';
import SendTemplateModal from 'components/chat/SendTemplateModal';
import { useWebSocketChat } from 'contexts/WebSocketContext';

const AVATAR_COLORS = ['#25D366', '#128C7E', '#34B7F1', '#9B59B6', '#E67E22', '#E74C3C', '#1ABC9C', '#3498DB'];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const Chat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<any>(null);
  const scrollRef = useRef<any>(null);
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
  const [anchorElEmoji, setAnchorElEmoji] = useState<any>();
  const [message, setMessage] = useState('');
  const textInput = useRef(null);

  const [data, setData] = useState<HistoryProps[]>([]);
  const [botTyping, setBotTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const chatState = useSelector((state: any) => state?.chat || {});

  const handleUserChange = () => setEmailDetails((prev) => !prev);
  const handleEditOpen = () => setEditModalOpen(true);
  const handleEditClose = () => setEditModalOpen(false);
  const handleOnEmojiButtonClick = (event: React.MouseEvent<HTMLButtonElement> | undefined) => {
    setAnchorElEmoji(anchorElEmoji ? null : event?.currentTarget);
  };
  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setMessage(message + emojiObject.emoji);
  };
  const emojiOpen = Boolean(anchorElEmoji);
  const emojiId = emojiOpen ? 'simple-popper' : undefined;
  const handleCloseEmoji = () => setAnchorElEmoji(null);
  const handlePlusClick = (event: React.MouseEvent<HTMLElement>) => setAnchorElPlus(event.currentTarget);
  const handlePlusClose = () => setAnchorElPlus(null);

  const loadOlderMessages = async () => {
    if (!cursor || loadingMore || !user?._id) return;
    try {
      setLoadingMore(true);
      const res = await messageService.getMessages(user._id, cursor);
      setData((prev) => [...res.data, ...prev]);
      setCursor(res.nextCursor || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFileUpload = async (e: any) => {
    const files = Array.from(e.target.files || []) as File[];
    const processedFiles: File[] = [];
    for (const file of files) {
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
        try {
          const convertedBlob: any = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
          processedFiles.push(new File([convertedBlob], `${Date.now()}.jpg`, { type: 'image/jpeg' }));
        } catch (err) {
          console.error('HEIC convert failed', err);
        }
      } else {
        processedFiles.push(file);
      }
    }
    setSelectedFiles((prev) => {
      const newFiles = processedFiles.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size));
      return [...prev, ...newFiles];
    });
    e.target.value = '';
  };

  const removeFile = (index: number) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSendAll = async () => {
    if (!user?._id || !user?.channel_id) return;

    if (selectedFiles.length === 0 && message.trim()) {
      const trimmed = message.trim();
      const tempMsg: any = {
        _id: `temp-${Date.now()}`,
        direction: 'OUT',
        type: 'text',
        text: trimmed,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        isTemp: true,
      };
      setData((prev) => [...prev, tempMsg]);
      setMessage('');
      try {
        await messageService.sendMessage({ channelId: user.channel_id, contactId: user._id, text: trimmed });
      } catch (err) {
        setData((prev) => prev.filter((m: any) => m._id !== tempMsg._id));
        console.error(err);
      }
      return;
    }

    if (selectedFiles.length === 0) return;

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));
      formData.append('contactId', user._id);
      formData.append('channelId', user.channel_id);
      if (message.trim()) formData.append('caption', message);

      const tempMessage: any = {
        _id: `temp-${Date.now()}`,
        direction: 'OUT',
        type: 'media_group',
        isTemp: true,
        status: 'PENDING',
        payload: {
          files: selectedFiles.map((file) => ({ url: URL.createObjectURL(file), type: file.type, name: file.name })),
          caption: message,
        },
        createdAt: new Date().toISOString(),
      };
      setData((prev) => [...prev, tempMessage]);
      setSelectedFiles([]);
      setMessage('');
      const mediaResult = await messageService.sendMedia(formData);
      // Replace the temp message with the real messages (status: SENT) from the API response
      if (mediaResult?.data?.length) {
        setData((prev) => {
          const withoutTemp = prev.filter((m: any) => m._id !== tempMessage._id);
          const existingIds = new Set(withoutTemp.map((m: any) => m._id?.toString()));
          const fresh = (mediaResult.data as any[]).filter((m) => !existingIds.has(m._id?.toString()));
          return [...withoutTemp, ...fresh];
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/ogg' });
      setAudioBlob(blob);
    };
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    return new Promise<Blob>((resolve) => {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/ogg' });
        setAudioBlob(blob);
        resolve(blob);
      };
      mediaRecorderRef.current.stop();
      setRecording(false);
    });
  };

  const pauseRecording = () => { mediaRecorderRef.current.pause(); setIsPaused(true); };
  const resumeRecording = () => { mediaRecorderRef.current.resume(); setIsPaused(false); };

  const sendRecordedAudio = async () => {
    if (!user?._id || !user?.channel_id) return;
    let blob = audioBlob;
    if (!blob) blob = await stopRecording();
    const formData = new FormData();
    formData.append('files', blob, 'audio.ogg');
    formData.append('contactId', user._id);
    formData.append('channelId', user.channel_id);
    await messageService.sendMedia(formData);
    setAudioBlob(null);
    setRecordModalOpen(false);
  };

  useEffect(() => {
    if (chatState?.chats) setData(chatState.chats);
  }, [chatState?.chats]);

  useEffect(() => {
    if (user?.name) dispatch(getUserChats(user.name));
  }, [user?.name]);

  useEffect(() => {
    if (!user?._id) return;
    setData([]);
    setCursor(null);
    setBotTyping(false);
    clearTimeout(typingTimerRef.current);
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
    const handleScroll = () => { if (el.scrollTop === 0) loadOlderMessages(); };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data, botTyping]);

  useEffect(() => {
    return () => { selectedFiles.forEach((file) => URL.revokeObjectURL(file as any)); };
  }, [selectedFiles]);

  const { subscribe } = useWebSocketChat();

  const showTyping = useCallback(() => {
    setBotTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setBotTyping(false), 10000);
  }, []);

  const hideTyping = useCallback(() => {
    setBotTyping(false);
    clearTimeout(typingTimerRef.current);
  }, []);

  // Live incoming messages + status updates via WebSocket
  useEffect(() => {
    if (!user?._id) return;
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'new_message' && msg.contact_id?.toString() === user._id?.toString()) {
        setData((prev) => {
          const existingIdx = prev.findIndex((m: any) => m._id?.toString() === msg.message?._id?.toString());
          if (existingIdx !== -1) {
            // Already in list (added via API response) — only upgrade status, never downgrade to PENDING
            const existing = prev[existingIdx] as any;
            const statusOrder: Record<string, number> = { PENDING: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4 };
            const incomingRank = statusOrder[msg.message?.status] ?? 0;
            const currentRank = statusOrder[existing.status] ?? 0;
            if (incomingRank <= currentRank) return prev;
            return prev.map((m: any, i: number) => i === existingIdx ? { ...m, status: msg.message?.status } : m);
          }
          // Replace the oldest optimistic temp message with the real one (OUT only)
          if (msg.message?.direction === 'OUT') {
            const tempIdx = prev.findIndex((m: any) => m.isTemp === true);
            if (tempIdx !== -1) {
              const updated = prev.filter((_, i) => i !== tempIdx);
              return [...updated, msg.message];
            }
          }
          return [...prev, msg.message];
        });
        contactService.markAsRead(user._id as string).catch(() => {});
        if (msg.message?.direction === 'IN') showTyping();
        if (msg.message?.direction === 'OUT') hideTyping();
      }
      if (msg.type === 'message_status' && (msg as any).contact_id?.toString() === user._id?.toString()) {
        setData((prev) =>
          prev.map((m: any) =>
            m.wa_message_id === (msg as any).wa_message_id ? { ...m, status: (msg as any).status } : m
          )
        );
      }
      if (msg.type === 'typing_indicator' && (msg as any).contact_id?.toString() === user._id?.toString()) {
        if ((msg as any).is_typing) showTyping(); else hideTyping();
      }
      // Update wa_message_id + status on the message in state (PENDING → SENT / FAILED)
      if (msg.type === 'message_update') {
        setData((prev) =>
          prev.map((m: any) =>
            m._id?.toString() === (msg as any)._id
              ? { ...m, wa_message_id: (msg as any).wa_message_id ?? m.wa_message_id, status: (msg as any).status }
              : m
          )
        );
      }
      // Handle bulk media send confirmation (backend pushes "new_messages" plural for media)
      if (msg.type === 'new_messages' && (msg as any).contact_id?.toString() === user._id?.toString()) {
        const incoming: any[] = (msg as any).messages || [];
        setData((prev) => {
          let updated = prev;
          incoming.forEach((realMsg: any) => {
            const existingIdx = updated.findIndex((m: any) => m._id?.toString() === realMsg._id?.toString());
            if (existingIdx !== -1) {
              // Already in list (added via API response) — just update status/wa_message_id
              updated = updated.map((m: any, i: number) =>
                i === existingIdx ? { ...m, status: realMsg.status, wa_message_id: realMsg.wa_message_id ?? m.wa_message_id } : m
              );
            } else {
              // Not in list yet — remove first temp and add real
              const tempIdx = updated.findIndex((m: any) => m.isTemp === true);
              updated = tempIdx !== -1
                ? [...updated.filter((_, i) => i !== tempIdx), realMsg]
                : [...updated, realMsg];
            }
          });
          return updated;
        });
      }
    });
    return unsubscribe;
  }, [user?._id, subscribe, showTyping, hideTyping]);

  const name = user?.name || user?.phone || '';
  const initials = name.slice(0, 2).toUpperCase();
  const avatarColor = getAvatarColor(name);

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', bgcolor: '#f0f2f5' }}>

      {/* ── LEFT: CONTACTS PANEL ── */}
      <Box sx={{
        width: { xs: '100%', md: 300 },
        flexShrink: 0,
        display: { xs: user ? 'none' : 'flex', md: 'flex' },
        flexDirection: 'column',
        borderRight: '1px solid #e5e7eb',
        overflow: 'hidden',
        bgcolor: '#fff',
      }}>
        <ChatDrawer setUser={setUser} selectedUserId={contactIdFromUrl} />
      </Box>

      {/* ── RIGHT: CHAT PANEL ── */}
      <Box sx={{
        flex: 1,
        display: { xs: user ? 'flex' : 'none', md: 'flex' },
        flexDirection: 'row',
        minWidth: 0,
        overflow: 'hidden',
      }}>

        {/* Chat main column */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* ── EMPTY STATE (desktop, no user selected) ── */}
          {!user && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1.5, bgcolor: '#f0f2f5' }}>
              <Typography fontSize={56} lineHeight={1}>💬</Typography>
              <Typography fontSize={16} fontWeight={700} color="#374151">Select a contact</Typography>
              <Typography fontSize={13} color="#9ca3af">Choose a contact on the left to start chatting</Typography>
            </Box>
          )}

          {/* ── CHAT HEADER ── */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, bgcolor: '#fff', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>

              {/* Back button (mobile only) */}
              <IconButton
                size="small"
                onClick={() => setUser(null)}
                sx={{ display: { xs: 'flex', md: 'none' }, color: '#374151' }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>

              {/* Avatar */}
              <Box sx={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                bgcolor: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 14, fontWeight: 700,
              }}>
                {initials}
              </Box>

              {/* Name + phone */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }} noWrap>{user.name}</Typography>
                <Typography sx={{ fontSize: 11.5, color: '#6b7280' }} noWrap>{user.phone}</Typography>
              </Box>

              {/* Edit button */}
              <IconButton
                size="small"
                onClick={handleEditOpen}
                sx={{ color: '#9ca3af', '&:hover': { color: '#374151', bgcolor: '#f3f4f6' }, borderRadius: '8px' }}
              >
                <EditOutlined style={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          )}

          {/* ── MESSAGE AREA ── */}
          {user && (
            <Box sx={{ flex: 1, overflow: 'hidden', bgcolor: '#efeae2' }}>
              <SimpleBar
                scrollableNodeProps={{ ref: scrollRef }}
                sx={{ height: '100%' }}
              >
                <Box sx={{ px: 1, py: 0.5 }}>
                  {loadingMore && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                      <CircularProgress size={18} sx={{ color: '#25D366' }} />
                    </Box>
                  )}
                  <ChatHistory theme={theme} user={user ?? {}} data={data} />
                  {botTyping && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 2, mb: 1 }}>
                      <Box sx={{
                        bgcolor: '#fff',
                        borderRadius: '0 12px 12px 12px',
                        px: 1.5,
                        py: 1,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        display: 'flex',
                        gap: '5px',
                        alignItems: 'center',
                      }}>
                        {[0, 1, 2].map((i) => (
                          <Box key={i} sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#9ca3af',
                            animation: 'typingBounce 1.2s ease-in-out infinite',
                            animationDelay: `${i * 0.18}s`,
                            '@keyframes typingBounce': {
                              '0%, 60%, 100%': { transform: 'translateY(0)' },
                              '30%': { transform: 'translateY(-5px)' },
                            },
                          }} />
                        ))}
                      </Box>
                    </Box>
                  )}
                  <div ref={bottomRef} />
                </Box>
              </SimpleBar>
            </Box>
          )}

          {/* ── INPUT AREA ── */}
          {user && (
            <Box sx={{ flexShrink: 0, bgcolor: '#f0f2f5', borderTop: '1px solid rgba(0,0,0,0.06)', px: 1.5, py: 1 }}>

              {/* File previews */}
              {selectedFiles.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap', p: 1.25, bgcolor: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  {selectedFiles.map((file, index) => {
                    const fileUrl = URL.createObjectURL(file);
                    if (file.type.startsWith('image')) {
                      return (
                        <Box key={index} sx={{ position: 'relative' }}>
                          <img alt="" src={fileUrl} style={{ width: 76, height: 76, borderRadius: 10, objectFit: 'cover' }} />
                          <Box onClick={() => removeFile(index)} sx={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, bgcolor: '#1f2937', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>×</Box>
                        </Box>
                      );
                    }
                    if (file.type.startsWith('video')) {
                      return (
                        <Box key={index} sx={{ position: 'relative' }}>
                          <video src={fileUrl} style={{ width: 76, height: 76, borderRadius: 10, objectFit: 'cover' }} />
                          <Box onClick={() => removeFile(index)} sx={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, bgcolor: '#1f2937', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer', boxShadow: '0  1px 3px rgba(0,0,0,0.3)' }}>×</Box>
                        </Box>
                      );
                    }
                    return (
                      <Box key={index} sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.75, bgcolor: '#f3f4f6', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                        <Typography fontSize={20}>📄</Typography>
                        <Typography fontSize={11} fontWeight={500} color="#374151" noWrap sx={{ maxWidth: 80 }}>{file.name}</Typography>
                        <Box onClick={() => removeFile(index)} sx={{ width: 17, height: 17, bgcolor: '#6b7280', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer', ml: 0.5, flexShrink: 0 }}>×</Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Recording indicator */}
              {recording && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, mb: 0.75, bgcolor: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444', animation: 'pulse 1s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                  <Typography fontSize={12} fontWeight={500} color="error">Recording...</Typography>
                </Box>
              )}

              {/* Input row */}
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75 }}>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center', pb: 0.25, bgcolor: 'rgba(255,255,255,0.6)', borderRadius: '14px', px: 0.5 }}>
                  <>
                    <IconButton
                      ref={anchorElEmoji}
                      aria-describedby={emojiId}
                      onClick={handleOnEmojiButtonClick}
                      sx={{ color: '#6b7280', '&:hover': { color: '#25D366', bgcolor: 'transparent' }, p: 0.875 }}
                      size="small"
                    >
                      <SmileOutlined style={{ fontSize: 20 }} />
                    </IconButton>
                    <Popper
                      id={emojiId}
                      open={emojiOpen}
                      anchorEl={anchorElEmoji}
                      disablePortal
                      style={{ zIndex: 1200 }}
                      popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [-20, 10] } }] }}
                    >
                      <ClickAwayListener onClickAway={handleCloseEmoji}>
                        <MainCard elevation={8} content={false}>
                          <EmojiPicker onEmojiClick={onEmojiClick} defaultSkinTone={SkinTones.DARK} autoFocusSearch={false} />
                        </MainCard>
                      </ClickAwayListener>
                    </Popper>
                  </>
                  <IconButton sx={{ color: '#6b7280', '&:hover': { color: '#25D366', bgcolor: 'transparent' }, p: 0.875 }} size="small" onClick={handlePlusClick}>
                    <PlusOutlined style={{ fontSize: 18 }} />
                  </IconButton>
                  <Menu
                    anchorEl={anchorElPlus}
                    open={openPlusMenu}
                    onClose={handlePlusClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', mt: -1 } }}
                  >
                    <MenuItem onClick={() => { handlePlusClose(); setTemplateModalOpen(true); }} sx={{ fontSize: 13, gap: 1 }}>📩 Send Template</MenuItem>
                    <MenuItem disabled sx={{ fontSize: 13, gap: 1 }}>📊 Campaign (Coming soon)</MenuItem>
                  </Menu>
                  <IconButton sx={{ color: '#6b7280', '&:hover': { color: '#25D366', bgcolor: 'transparent' }, p: 0.875 }} size="small" onClick={() => fileInputRef.current.click()}>
                    <PaperClipOutlined style={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton sx={{ color: '#6b7280', '&:hover': { color: '#25D366', bgcolor: 'transparent' }, p: 0.875 }} size="small" onClick={() => setRecordModalOpen(true)}>
                    <SoundOutlined style={{ fontSize: 18 }} />
                  </IconButton>
                </Box>

                {/* Text input */}
                <OutlinedInput
                  inputRef={textInput}
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value.length <= 1 ? e.target.value.trim() : e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAll();
                    }
                  }}
                  sx={{
                    borderRadius: '22px',
                    bgcolor: '#fff',
                    fontSize: 14,
                    '& fieldset': { border: 'none' },
                    '& .MuiOutlinedInput-input': { py: 1.1, px: 1.75 },
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
                    '&.Mui-focused': { boxShadow: '0 0 0 2px rgba(37,211,102,0.2)' },
                  }}
                />

                {/* Send button */}
                <IconButton
                  onClick={handleSendAll}
                  disabled={!message.trim() && selectedFiles.length === 0}
                  sx={{
                    bgcolor: '#25D366',
                    color: '#fff',
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    '&:hover': { bgcolor: '#1db954', transform: 'scale(1.05)' },
                    '&.Mui-disabled': { bgcolor: '#d1d5db', color: '#9ca3af', boxShadow: 'none' },
                    transition: 'all 0.15s',
                    boxShadow: '0 2px 8px rgba(37,211,102,0.35)',
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>

        {/* ── USER DETAILS PANEL (desktop only) ── */}
        {emailDetails && !isMobile && (
          <Box sx={{ width: 320, flexShrink: 0, borderLeft: '1px solid #e5e7eb', overflowY: 'auto', bgcolor: '#fff' }}>
            <UserDetails user={user ?? {}} onClose={handleUserChange} />
          </Box>
        )}

        {/* User details dialog (mobile) */}
        <Dialog TransitionComponent={PopupTransition} onClose={handleUserChange} open={isMobile && emailDetails} scroll="body">
          <UserDetails user={user ?? {}} onClose={handleUserChange} />
        </Dialog>
      </Box>

      {/* ── MODALS ── */}
      {editModalOpen && user?._id && (
        <CreateContactModal
          contactModalOpen={editModalOpen}
          handleClose={handleEditClose}
          channelId={user.channel_id as string}
          contactCreateRefresh={() => { }}
          contactId={user._id}
        />
      )}

      <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

      {/* Recording dialog */}
      <Dialog
        open={recordModalOpen}
        onClose={() => {
          if (recording) stopRecording();
          setRecordModalOpen(false);
          setHasStarted(false);
          setAudioBlob(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <Box sx={{ px: 2.5, py: 2, bgcolor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
          <Typography fontWeight={700} fontSize={15}>🎤 Voice Message</Typography>
          <Typography variant="caption" color="text.secondary">Record and send a voice note</Typography>
        </Box>

        {audioBlob && !hasStarted && (
          <Box sx={{ px: 2.5, pt: 2 }}>
            <audio controls style={{ width: '100%' }}>
              <source src={URL.createObjectURL(audioBlob)} />
            </audio>
          </Box>
        )}

        <Box sx={{ p: 2.5 }}>
          {/* Waveform visual */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 2.5, alignItems: 'center', height: 48, justifyContent: 'center' }}>
            {Array.from({ length: 28 }).map((_, i) => (
              <Box key={i} sx={{
                width: 3,
                height: Math.random() * 32 + 8,
                background: recording ? '#25D366' : '#d1d5db',
                borderRadius: 2,
                transition: 'background 0.3s',
                animation: recording ? 'wavebar 0.8s ease-in-out infinite alternate' : 'none',
                animationDelay: `${i * 30}ms`,
                '@keyframes wavebar': { from: { transform: 'scaleY(0.4)' }, to: { transform: 'scaleY(1)' } },
              }} />
            ))}
          </Box>

          <Stack direction="row" spacing={1.5} justifyContent="center">
            {!hasStarted ? (
              <Button
                variant="contained"
                onClick={() => { startRecording(); setHasStarted(true); }}
                sx={{ borderRadius: '8px', bgcolor: '#25D366', '&:hover': { bgcolor: '#1db954' }, fontWeight: 700, px: 3 }}
              >
                🎤 Start Recording
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button variant="outlined" onClick={pauseRecording} sx={{ borderRadius: '8px', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151' }}>
                    ⏸ Pause
                  </Button>
                ) : (
                  <Button variant="outlined" onClick={resumeRecording} sx={{ borderRadius: '8px', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151' }}>
                    ▶ Resume
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={async () => { await stopRecording(); setHasStarted(false); }}
                  sx={{ borderRadius: '8px', fontWeight: 600, borderColor: '#fecaca', color: '#ef4444' }}
                >
                  ⏹ Stop
                </Button>
              </>
            )}
            {audioBlob && (
              <Button
                variant="contained"
                onClick={sendRecordedAudio}
                sx={{ borderRadius: '8px', bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, fontWeight: 700 }}
              >
                📤 Send
              </Button>
            )}
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
