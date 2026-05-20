/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/iframe-has-title */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, Stack, Theme, Typography, Tooltip } from '@mui/material';
import { Box } from '@mui/system';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { UserProfile } from 'types/user-profile';
import { History } from 'types/chat';

// Renders WhatsApp-formatted text: *bold*, _italic_, ~strikethrough~, preserves newlines
const WAText = ({ text, sx = {} }: { text: string; sx?: any }) => {
  if (!text) return null;
  const lines = text.split('\n');
  const parseInline = (line: string, lineIdx: number) => {
    const parts: React.ReactNode[] = [];
    const re = /(\*[^*]+\*|_[^_]+_|~[^~]+~)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      const token = m[1];
      const inner = token.slice(1, -1);
      if (token.startsWith('*')) parts.push(<strong key={m.index}>{inner}</strong>);
      else if (token.startsWith('_')) parts.push(<em key={m.index}>{inner}</em>);
      else parts.push(<s key={m.index}>{inner}</s>);
      last = m.index + token.length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <Fragment key={lineIdx}>{parts}</Fragment>;
  };
  return (
    <Typography component="span" sx={{ fontSize: 14, display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...sx }}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {parseInline(line, i)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </Typography>
  );
};

interface ChatHistoryProps {
  data: History[];
  theme: Theme;
  user: UserProfile;
}

/**
 * Robustly extract a human-readable error string from anything backend may
 * have stored in `message.error`. Handles:
 *   - plain strings ("Please add amount in wallet...")
 *   - objects with `.message`
 *   - Meta API error objects: { error: { message, code, type, ... } }
 *   - JSON-stringified versions of the above (whatsapp.client.ts uses JSON.stringify)
 *   - axios response.data shapes
 */
const getErrorText = (raw: any, depth = 0): string => {
  if (raw == null) return '';
  if (depth > 4) return '';

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    // If it looks like JSON, try to parse and recurse.
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return getErrorText(JSON.parse(trimmed), depth + 1);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (typeof raw === 'object') {
    // Meta-style: { error: { message, code, type, error_data: { details } } }
    const nestedDetails =
      raw?.error?.error_data?.details ||
      raw?.error_data?.details;
    if (typeof nestedDetails === 'string' && nestedDetails) return nestedDetails;

    const nestedMessage =
      raw?.error?.message ||
      raw?.message ||
      raw?.error_user_msg ||
      raw?.error?.error_user_msg;
    if (typeof nestedMessage === 'string' && nestedMessage) return nestedMessage;

    // Recurse on nested error object if no string found yet.
    if (raw?.error && typeof raw.error === 'object') {
      const inner = getErrorText(raw.error, depth + 1);
      if (inner) return inner;
    }
    if (raw?.data) {
      const inner = getErrorText(raw.data, depth + 1);
      if (inner) return inner;
    }
  }

  return '';
};

const getMessageText = (history: any) => {
  const payload = history?.payload || {};
  if (history?.type === 'list') return payload?.body || '';
  if (history?.type === 'carousel') return payload?.body || 'Carousel message';
  return (
    history?.text ||
    payload?.text?.body ||
    payload?.bodyText ||
    payload?.caption ||
    payload?.button?.text ||
    payload?.button?.payload ||
    payload?.interactive?.button_reply?.title ||
    payload?.interactive?.list_reply?.title ||
    payload?.interactive?.nfm_reply?.response_json ||
    (typeof payload?.text === 'string' ? payload?.text : '') ||
    ''
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    if (!msg) return '';
    const payload = msg.payload || {};
    if (msg.type === 'list') return payload?.body || 'List message';
    if (msg.type === 'carousel') return payload?.body || 'Carousel message';
    return (
      msg?.text ||
      payload?.bodyText ||
      payload?.text?.body ||
      payload?.interactive?.button_reply?.title ||
      payload?.interactive?.list_reply?.title ||
      payload?.options?.body ||
      (typeof payload?.text === 'string' ? payload?.text : '') ||
      'Message'
    );
  };

  const getStatusUI = (history: any) => {
    const status = history.status;
    if (status === 'PENDING') return <Typography sx={{ fontSize: 10, color: '#9ca3af', lineHeight: 1 }}>🕐</Typography>;
    if (status === 'SENT') return <Typography sx={{ fontSize: 11, color: '#9ca3af', lineHeight: 1 }}>✓</Typography>;
    if (status === 'DELIVERED') return <Typography sx={{ fontSize: 11, color: '#9ca3af', lineHeight: 1 }}>✓✓</Typography>;
    if (status === 'READ') return <Typography sx={{ fontSize: 11, color: '#53bdeb', lineHeight: 1 }}>✓✓</Typography>;
    if (status === 'FAILED') {
      const errorText = getErrorText(history?.error) || 'Message failed';
      return (
        <Tooltip title={<Typography sx={{ fontSize: 12 }}>⚠️ {errorText}</Typography>} arrow placement="top">
          <InfoOutlinedIcon sx={{ fontSize: 14, color: '#ef4444', cursor: 'pointer' }} />
        </Tooltip>
      );
    }
    return null;
  };

  const ReplyPreview = ({ message, selectedBy }: any) => {
    if (!message) return null;
    const payload = message.payload || {};
    const type = message.type;

    if (type === 'carousel') {
      const items = payload?.items || [];
      const selectedId =
        selectedBy?.payload?.button?.payload ||
        selectedBy?.payload?.interactive?.button_reply?.id ||
        selectedBy?.payload?.interactive?.list_reply?.id ||
        '';
      const selectedTitle =
        selectedBy?.payload?.button?.text ||
        selectedBy?.payload?.interactive?.button_reply?.title ||
        selectedBy?.payload?.interactive?.list_reply?.title ||
        selectedBy?.text ||
        '';
      const selectedMatch = String(selectedId).match(/^cr_(\d+)_(\d+)$/);
      const selectedItem = selectedMatch
        ? items[Number(selectedMatch[1])]
        : items.find((item: any) =>
            item?.id === selectedId ||
            (item?.buttons || []).some((btn: any) => btn?.id === selectedId)
          );
      const selectedButton = selectedItem
        ? (selectedItem.buttons || [])[selectedMatch ? Number(selectedMatch[2]) : 0]
        : null;

      return (
        <Stack sx={{ borderLeft: '3px solid #25D366', pl: 1, mb: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 1, maxWidth: 300, py: 0.75, pr: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}>
            {payload?.body || 'Carousel'}
          </Typography>
          {selectedItem ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              {selectedItem.image && (
                <img src={selectedItem.image} style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: '#667085', display: 'block', lineHeight: 1.25 }}>
                  Selected card
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedItem.title || 'Card'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#00a884', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Button: {selectedButton?.title || selectedTitle || 'Selected'}
                </Typography>
              </Box>
            </Stack>
          ) : items.length > 0 ? (
            <Stack direction="row" spacing={0.75} sx={{ overflow: 'hidden' }}>
              {items.slice(0, 2).map((item: any, index: number) => (
                <Stack key={item.id || index} direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                  {item.image && (
                    <img src={item.image} style={{ width: 34, height: 34, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title || 'Card'}
                    </Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      );
    }

    if (type === 'interactive_media') {
      return (
        <Stack sx={{ borderLeft: '3px solid #25D366', pl: 1, mb: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 1, maxWidth: 260 }}>
          {payload?.type === 'image' && (
            <img src={payload?.url} style={{ width: 50, height: 50, borderRadius: 6, objectFit: 'cover', marginBottom: 4 }} />
          )}
          {payload?.type === 'video' && (
            <video src={payload?.url} style={{ width: 50, height: 50, borderRadius: 6 }} />
          )}
          <Typography variant="caption" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
            {payload?.caption || 'Media'}
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack sx={{ borderLeft: '3px solid #25D366', pl: 1, mb: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 1, alignSelf: 'flex-start' }}>
        <Typography variant="caption" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', maxWidth: 260 }}>
          {getReplyText(message)}
        </Typography>
      </Stack>
    );
  };

  const RenderFlowResponse = ({ response }: any) => {
    if (!response) return null;
    let parsed: any = {};
    try { parsed = JSON.parse(response); } catch { return <Typography>{response}</Typography>; }

    const HIDDEN_KEYS = new Set(['flow_token', 'token', '_flow_data']);
    const formatKey = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const visibleEntries = Object.entries(parsed).filter(([key]) => !HIDDEN_KEYS.has(key));

    // Dynamic flow: only flow_token was in response_json — show clean submitted badge
    if (visibleEntries.length === 0) {
      return (
        <Stack direction="row" alignItems="center" spacing={1}
          sx={{ px: 1.5, py: 1, borderRadius: '10px', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'inline-flex' }}>
          <Typography sx={{ fontSize: 15 }}>✅</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>Form Submitted</Typography>
        </Stack>
      );
    }

    // Static flow: show actual submitted fields
    return (
      <Stack spacing={0.75}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography sx={{ fontSize: 13 }}>✅</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>Form Submitted</Typography>
        </Stack>
        <Stack sx={{ border: '1px solid #d1fae5', borderRadius: '8px', overflow: 'hidden', bgcolor: '#f0fdf4' }}>
          {visibleEntries.map(([key, value]: any, i, arr) => (
            <Stack key={key} direction="row" justifyContent="space-between" alignItems="center"
              sx={{ px: 1.5, py: 0.75, borderBottom: i !== arr.length - 1 ? '1px solid #d1fae5' : 'none' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{formatKey(key)}</Typography>
              <Typography sx={{ fontSize: 11, color: '#111827', maxWidth: 150, textAlign: 'right', wordBreak: 'break-word' }}>
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    );
  };

  const RenderMessage = ({ history }: any) => {
    if (!history) return null;
    const type = history?.type;
    const payload = history?.payload || {};
    const media = history?.media || {};
    const text = getMessageText(history);
    const url = payload?.url || media?.url || payload?.image?.url || payload?.video?.url || payload?.audio?.url || payload?.document?.url;

    if (type === 'audio') {
      return <audio src={url} controls style={{ width: '100%', minWidth: 200, maxWidth: 280, height: 40 }} />;
    }

    if (type === 'interactive') {
      const title =
        payload?.interactive?.button_reply?.title ||
        payload?.interactive?.list_reply?.title;
      const description = payload?.interactive?.list_reply?.description;
      const replyId =
        payload?.interactive?.button_reply?.id ||
        payload?.interactive?.list_reply?.id ||
        '';

      if (title && !payload?.interactive?.nfm_reply) {
        // 🔥 If this reply is to a carousel/list message, surface the card
        // (or list-row) the user actually picked so the agent can see what
        // was selected. The replied-to message is provided by the backend
        // as history.reply_message.
        const replied = history?.reply_message;
        const repliedPayload = replied?.payload || {};
        let cardLabel = '';
        let cardImage = '';
        if (replied?.type === 'carousel') {
          const items = repliedPayload?.items || [];
          // Carousel synthetic IDs look like "cr_<cardIdx>_<btnIdx>"
          const m = String(replyId).match(/^cr_(\d+)_(\d+)$/);
          let pickedItem: any = null;
          if (m) {
            pickedItem = items[Number(m[1])];
          } else if (replyId) {
            pickedItem = items.find((it: any) =>
              (it?.buttons || []).some((b: any) => b?.id === replyId),
            );
          }
          if (!pickedItem && title) {
            // last-ditch: match by button title
            pickedItem = items.find((it: any) =>
              (it?.buttons || []).some(
                (b: any) => (b?.title || '').toLowerCase() === title.toLowerCase(),
              ),
            );
          }
          if (pickedItem) {
            cardLabel = pickedItem.title || pickedItem.description || '';
            cardImage = pickedItem.image || '';
          }
        }

        return (
          <Stack spacing={0.5} sx={{ maxWidth: 260 }}>
            {(cardLabel || cardImage) && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  borderLeft: '3px solid #25D366',
                  pl: 1,
                  py: 0.5,
                  bgcolor: 'rgba(0,0,0,0.04)',
                  borderRadius: 1,
                }}
              >
                {cardImage && (
                  <img
                    src={cardImage}
                    alt=""
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography
                  sx={{
                    fontSize: 11.5,
                    color: '#075e54',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {cardLabel || 'Carousel option'}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 10,
                  bgcolor: '#e8f5e9',
                  color: '#1b5e20',
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                ▶ Tapped
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                {title}
              </Typography>
            </Stack>
            {description && (
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                {description}
              </Typography>
            )}
          </Stack>
        );
      }
    }

    if (type === 'interactive_media') {
      return (
        <Stack sx={{ borderRadius: 2, overflow: 'hidden', maxWidth: 280 }}>
          {payload?.type === 'image' && <img src={payload?.url} style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />}
          {payload?.type === 'video' && <video src={payload?.url} controls style={{ width: '100%' }} />}
          {payload?.caption && <WAText text={payload.caption} sx={{ pt: 0.5 }} />}
          {payload?.buttons?.length > 0 && (
            <Stack sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', mt: 0.5 }}>
              {payload.buttons.map((btn: any, i: number) => (
                <Box key={i} sx={{ textAlign: 'center', py: 0.9, fontSize: 13, color: '#00a884', fontWeight: 500, borderBottom: i !== payload.buttons.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none', cursor: 'pointer', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}>
                  {btn.title}
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      );
    }

    if (type === 'carousel') {
      const items = payload?.items || [];
      return (
        <Stack spacing={1} sx={{ maxWidth: 320 }}>
          {payload?.body && <WAText text={payload.body} />}
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, maxWidth: 320 }}>
            {items.map((item: any, i: number) => (
              <Stack
                key={item.id || i}
                sx={{
                  width: 190,
                  flexShrink: 0,
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: '#fff'
                }}
              >
                {item.image && <img src={item.image} style={{ width: '100%', height: 110, objectFit: 'cover' }} />}
                <Stack sx={{ p: 1 }} spacing={0.5}>
                  <Typography fontSize={13} fontWeight={600} sx={{ whiteSpace: 'pre-line' }}>{item.title}</Typography>
                  {item.description && <Typography fontSize={12} color="text.secondary">{item.description}</Typography>}
                </Stack>
                {item.buttons?.length > 0 && (
                  <Stack sx={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    {item.buttons.map((btn: any, bi: number) => (
                      <Box key={btn.id || bi} sx={{ textAlign: 'center', py: 0.8, fontSize: 13, color: '#00a884', fontWeight: 500, borderTop: bi > 0 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
                        {btn.title || 'Button'}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            ))}
          </Box>
        </Stack>
      );
    }

    if (type === 'template') {
      const requestTemplate = payload?.request?.template;
      const dbComponents = history?.payload?.templateData?.components || [];
      const bodyComponent = dbComponents.find((c: any) => c.type === 'BODY');
      const buttonsComponent = dbComponents.find((c: any) => c.type === 'BUTTONS');
      const header = requestTemplate?.components?.find((c: any) => c.type === 'header');
      const headerParam = header?.parameters?.[0];
      const headerUrl = headerParam?.image?.link || headerParam?.video?.link || headerParam?.document?.link;
      const headerType = headerParam?.type;

      // Body params from the API request (for interpolating {{1}}, {{2}} etc.)
      const bodyParams: any[] = payload?.request?.template?.components?.find(
        (c: any) => c.type === 'body' || c.type === 'BODY'
      )?.parameters || [];

      const getRenderedBody = (): string => {
        // Priority 1: template body text from stored templateData
        if (bodyComponent?.text) {
          let t = bodyComponent.text;
          t = t.replace(/{{(\d+)}}/g, (_: any, i: any) => bodyParams[Number(i) - 1]?.text || '');
          return t;
        }
        // Priority 2: history.text set by backend (body text or name)
        // Only use if it doesn't look like a raw template name (no spaces = likely a name)
        const ht = history.text || payload?.text?.body || payload?.bodyText || '';
        if (ht && ht.includes(' ')) return ht;
        // Priority 3: nothing useful found — return empty so we show the name label
        return '';
      };

      const renderedBody = getRenderedBody();
      const templateName: string = payload?.name || payload?.request?.template?.name || history.text || '';
      // Also collect quick-reply button labels from request components
      const quickReplyBtns: string[] = (payload?.request?.template?.components || [])
        .filter((c: any) => c.type === 'button' || c.type === 'BUTTON')
        .flatMap((c: any) => (c.buttons || [c]).map((b: any) => b.text || b.title).filter(Boolean));

      return (
        <Stack sx={{ borderRadius: 2, overflow: 'hidden', maxWidth: 300 }}>
          {/* Template name label */}
          {templateName && (
            <Box sx={{ px: 1.5, pt: 1, pb: 0.25 }}>
              <Typography sx={{ fontSize: 10.5, color: '#6b7280', fontWeight: 600, letterSpacing: 0.2, textTransform: 'uppercase' }}>
                📋 {templateName.replace(/_/g, ' ')}
              </Typography>
            </Box>
          )}
          {/* Media header */}
          {headerUrl && headerType === 'image' && <img src={headerUrl} style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />}
          {headerUrl && headerType === 'video' && <video src={headerUrl} controls style={{ width: '100%' }} />}
          {headerUrl && headerType === 'document' && <Box sx={{ p: 1, cursor: 'pointer' }} onClick={() => window.open(headerUrl)}>📄 View Document</Box>}
          {/* Body */}
          {renderedBody ? (
            <WAText text={renderedBody} sx={{ px: 1.5, pt: templateName ? 0.25 : 1, pb: 1 }} />
          ) : (
            <Typography sx={{ px: 1.5, py: 1, fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
              Template content not available
            </Typography>
          )}
          {/* Buttons from templateData */}
          {buttonsComponent?.buttons?.length > 0 && (
            <Stack sx={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {buttonsComponent.buttons.map((btn: any, i: number) => (
                <Box key={i} sx={{ textAlign: 'center', py: 0.9, fontSize: 13, color: '#00a884', fontWeight: 500, borderBottom: i !== buttonsComponent.buttons.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
                  {btn.type === 'URL' && '🔗 '}{btn.type === 'PHONE_NUMBER' && '📞 '}{btn.text}
                </Box>
              ))}
            </Stack>
          )}
          {/* Quick-reply buttons from request payload (shown when templateData buttons not available) */}
          {!buttonsComponent?.buttons?.length && quickReplyBtns.length > 0 && (
            <Stack sx={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {quickReplyBtns.map((label: string, i: number) => (
                <Box key={i} sx={{ textAlign: 'center', py: 0.9, fontSize: 13, color: '#00a884', fontWeight: 500, borderBottom: i !== quickReplyBtns.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
                  {label}
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      );
    }

    if (payload?.url) {
      if (type === 'image') return <img src={payload?.url} style={{ maxWidth: 250, borderRadius: 8 }} onError={(e: any) => { e.target.src = '/image-error.png'; }} />;
      if (type === 'video') return <video src={payload.url} controls style={{ maxWidth: 250 }} />;
      if (type === 'document') return <Stack onClick={() => window.open(payload.url)} sx={{ cursor: 'pointer' }}><Typography>📄 {payload.filename || 'Document'}</Typography></Stack>;
    }

    if (type === 'address_message') {
      const bodyText = payload?.text?.body || payload?.bodyText || 'Please provide your address';
      return (
        <Stack spacing={1}>
          <WAText text={bodyText} />
          <Stack sx={{ border: '1px solid #25D366', color: '#25D366', borderRadius: 2, px: 2, py: 0.75, cursor: 'pointer', width: 'fit-content', fontWeight: 500, '&:hover': { background: '#f1fdf5' } }}>
            📍 Provide Address
          </Stack>
        </Stack>
      );
    }

    if (type === 'text') return <WAText text={text} />;

    if (type === 'interactive' && payload?.interactive?.nfm_reply) {
      return <RenderFlowResponse response={payload?.interactive?.nfm_reply?.response_json} />;
    }

    if (type === 'image') {
      return (
        <Stack spacing={0.5}>
          {url && <img src={url} style={{ maxWidth: 250, borderRadius: 8 }} onError={(e: any) => { e.target.src = '/image-error.png'; }} />}
          {text && <Typography variant="body2">{text}</Typography>}
        </Stack>
      );
    }

    if (type === 'video') {
      return (
        <Stack spacing={0.5}>
          {url && <video src={url} controls style={{ maxWidth: 250 }} />}
          {text && <Typography variant="body2">{text}</Typography>}
        </Stack>
      );
    }

    if (type === 'document') {
      const filename = payload?.filename || media?.filename || payload?.document?.filename || 'Document';
      return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => url && window.open(url, '_blank')}>
          <Typography fontSize={24}>📄</Typography>
          <Stack>
            <Typography fontWeight={500} fontSize={13}>{filename}</Typography>
            <Typography variant="caption" color="text.secondary">Tap to open</Typography>
          </Stack>
        </Stack>
      );
    }

    if (type === 'location') {
      const lat = payload?.location?.latitude;
      const lng = payload?.location?.longitude;
      if (!lat || !lng) return <Typography>📍 Location</Typography>;
      return <iframe width="100%" height="180" style={{ borderRadius: 8 }} src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`} />;
    }

    if (type === 'list') {
      return (
        <Stack spacing={1}>
          <WAText text={payload?.body || ''} />
          <Stack onClick={() => setListModal(payload)} sx={{ border: '1px solid rgba(0,0,0,0.2)', borderRadius: 2, px: 2, py: 0.75, color: '#00a884', fontWeight: 500, cursor: 'pointer', width: 'fit-content', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}>
            {payload?.buttonText}
          </Stack>
        </Stack>
      );
    }

    if (type === 'contacts') {
      const contact = payload?.contacts?.[0];
      const name = contact?.name?.formatted_name || contact?.name?.first_name || 'Contact';
      const phone = contact?.phones?.[0]?.phone;
      const waId = contact?.phones?.[0]?.wa_id;
      return (
        <Stack spacing={0.5}>
          <Typography fontWeight={600} fontSize={14}>{name}</Typography>
          {phone && <Typography sx={{ color: '#25D366', cursor: 'pointer', fontSize: 13 }} onClick={() => window.open(`https://wa.me/${waId}`, '_blank')}>{phone}</Typography>}
        </Stack>
      );
    }

    if (type === 'button') {
      return (
        <Stack spacing={1}>
          <WAText text={payload?.bodyText || ''} />
          {payload?.buttons?.map((btn: any) => (
            <Stack key={btn.id} sx={{ border: '1px solid rgba(0,0,0,0.2)', borderRadius: 2, px: 2, py: 0.75, cursor: 'pointer', width: 'fit-content', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}>
              <Typography variant="body2">{btn.title}</Typography>
            </Stack>
          ))}
        </Stack>
      );
    }

    if (type === 'interactive') {
      return (
        <Typography fontSize={14}>
          {payload?.interactive?.button_reply?.title || payload?.interactive?.list_reply?.title}
        </Typography>
      );
    }

    if (type === 'flow') {
      const options = payload?.options || {};
      return (
        <Stack spacing={0.75} sx={{ maxWidth: 260 }}>
          <Typography fontWeight={600} fontSize={13}>{options.header}</Typography>
          <Typography variant="body2">{options.body}</Typography>
          <Stack sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', pt: 0.75, color: '#25D366', fontWeight: 500, cursor: 'pointer' }}>{options.cta}</Stack>
        </Stack>
      );
    }

    if (type === 'cta_url') {
      return (
        <Stack spacing={0.75}>
          <WAText text={payload?.bodyText || ''} />
          <Stack onClick={() => window.open(payload?.url)} sx={{ border: '1px solid #25D366', color: '#25D366', borderRadius: 2, px: 2, py: 0.75, cursor: 'pointer', width: 'fit-content', fontWeight: 500 }}>
            {payload?.buttonText}
          </Stack>
        </Stack>
      );
    }

    if (type === 'order') {
      const orderData = payload?.order || payload;
      const items: any[] = orderData?.product_items || [];
      const total = items.reduce((sum: number, i: any) => sum + (Number(i.item_price) * Number(i.quantity || 1)), 0);
      const currency = items[0]?.currency || 'INR';
      const note = orderData?.text;
      return (
        <Box sx={{ minWidth: 220, maxWidth: 280, borderRadius: '12px', overflow: 'hidden', border: '1px solid #d1fae5', bgcolor: '#f0fdf4' }}>
          <Box sx={{ px: 2, py: 1.25, bgcolor: '#065f46', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontSize={18} lineHeight={1}>🛒</Typography>
            <Box>
              <Typography fontSize={13} fontWeight={700} color="#fff">Order Received</Typography>
              <Typography fontSize={11} color="#a7f3d0">{items.length} item{items.length !== 1 ? 's' : ''}</Typography>
            </Box>
          </Box>
          <Box sx={{ px: 2, py: 1 }}>
            {items.map((item: any, i: number) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: i < items.length - 1 ? '1px solid #d1fae5' : 'none' }}>
                <Box>
                  <Typography fontSize={12} fontWeight={600} color="#065f46">{item.product_retailer_id}</Typography>
                  <Typography fontSize={11} color="#6b7280">Qty: {item.quantity || 1}</Typography>
                </Box>
                <Typography fontSize={12} fontWeight={600} color="#111827">{currency} {(Number(item.item_price) * Number(item.quantity || 1)).toFixed(2)}</Typography>
              </Box>
            ))}
            {note && <Typography fontSize={12} color="#6b7280" sx={{ mt: 0.75, fontStyle: 'italic' }}>"{note}"</Typography>}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 0.75, borderTop: '1px solid #d1fae5' }}>
              <Typography fontSize={13} fontWeight={700} color="#065f46">Total</Typography>
              <Typography fontSize={13} fontWeight={800} color="#065f46">{currency} {total.toFixed(2)}</Typography>
            </Box>
          </Box>
        </Box>
      );
    }

    if (type === 'product_list' || type === 'single_product') {
      const action = payload?.interactive?.action || payload?.action || {};
      const catalogId = action?.catalog_id || payload?.catalog_id || '';
      const sections = action?.sections || [];
      const singleProduct = action?.product_retailer_id || '';
      const bodyText = payload?.interactive?.body?.text || payload?.body?.text || payload?.bodyText || 'Browse our catalog';
      const headerText = payload?.interactive?.header?.text || payload?.header?.text || '';
      const footerText = payload?.interactive?.footer?.text || payload?.footer?.text || '';
      const totalProducts = type === 'single_product' ? 1 : sections.reduce((s: number, sec: any) => s + (sec?.product_items?.length || 0), 0);
      return (
        <Box sx={{ minWidth: 220, maxWidth: 280, borderRadius: '12px', overflow: 'hidden', border: '1px solid #bfdbfe', bgcolor: '#eff6ff' }}>
          <Box sx={{ px: 2, py: 1.25, bgcolor: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontSize={18} lineHeight={1}>🏪</Typography>
            <Box>
              <Typography fontSize={13} fontWeight={700} color="#fff">{type === 'single_product' ? 'Product' : 'Catalog'}</Typography>
              <Typography fontSize={11} color="#bfdbfe">{totalProducts > 0 ? `${totalProducts} product${totalProducts !== 1 ? 's' : ''}` : catalogId}</Typography>
            </Box>
          </Box>
          <Box sx={{ px: 2, py: 1.25 }}>
            {headerText && <Typography fontSize={13} fontWeight={600} color="#1e3a8a" mb={0.5}>{headerText}</Typography>}
            <Typography fontSize={13} color="#374151" sx={{ whiteSpace: 'pre-wrap' }}>{bodyText}</Typography>
            {singleProduct && <Typography fontSize={11} color="#6b7280" mt={0.5}>SKU: {singleProduct}</Typography>}
            {footerText && <Typography fontSize={11} color="#9ca3af" mt={0.5}>{footerText}</Typography>}
            <Box sx={{ mt: 1, py: 0.75, textAlign: 'center', border: '1px solid #93c5fd', borderRadius: '8px', color: '#1d4ed8', fontWeight: 600, fontSize: 12.5 }}>
              🛍️ View {type === 'single_product' ? 'Product' : 'Catalog'}
            </Box>
          </Box>
        </Box>
      );
    }

    if (type === 'order_details') {
      const orderRef = payload?.order_reference || payload?.order_details?.reference_id || '';
      const totalAmount = payload?.total_amount?.value || payload?.order_details?.total_amount || 0;
      const currency = payload?.total_amount?.currency_code || 'INR';
      const items: any[] = payload?.order_details?.order?.items || payload?.order?.items || [];
      return (
        <Box sx={{ minWidth: 220, maxWidth: 280, borderRadius: '12px', overflow: 'hidden', border: '1px solid #fed7aa', bgcolor: '#fff7ed' }}>
          <Box sx={{ px: 2, py: 1.25, bgcolor: '#c2410c', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontSize={18} lineHeight={1}>📦</Typography>
            <Box>
              <Typography fontSize={13} fontWeight={700} color="#fff">Order Details</Typography>
              {orderRef && <Typography fontSize={11} color="#fed7aa">Ref: {orderRef}</Typography>}
            </Box>
          </Box>
          <Box sx={{ px: 2, py: 1.25 }}>
            {items.slice(0, 3).map((item: any, i: number) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                <Typography fontSize={12} color="#374151">{item.name || item.retailer_id}</Typography>
                <Typography fontSize={12} fontWeight={600}>{item.amount?.value || item.price || ''}</Typography>
              </Box>
            ))}
            {totalAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, pt: 0.75, borderTop: '1px solid #fed7aa' }}>
                <Typography fontSize={13} fontWeight={700} color="#c2410c">Total</Typography>
                <Typography fontSize={13} fontWeight={800} color="#c2410c">{currency} {totalAmount}</Typography>
              </Box>
            )}
            <Box sx={{ mt: 1, py: 0.75, textAlign: 'center', bgcolor: '#c2410c', borderRadius: '8px', color: '#fff', fontWeight: 700, fontSize: 13 }}>
              💳 Pay Now
            </Box>
          </Box>
        </Box>
      );
    }

    if (type === 'payment_status') {
      const status = (payload?.payment?.status || payload?.status || '').toLowerCase();
      const isApproved = status === 'approved' || status === 'success';
      const isDeclined = status === 'declined' || status === 'failed';
      const icon = isApproved ? '✅' : isDeclined ? '❌' : '⏳';
      const label = isApproved ? 'Payment Successful' : isDeclined ? 'Payment Failed' : 'Payment Pending';
      const color = isApproved ? '#16a34a' : isDeclined ? '#dc2626' : '#d97706';
      const bg = isApproved ? '#f0fdf4' : isDeclined ? '#fef2f2' : '#fffbeb';
      const border = isApproved ? '#bbf7d0' : isDeclined ? '#fecaca' : '#fde68a';
      const rawAmount = payload?.payment?.amount || payload?.amount;
      const amount = rawAmount
        ? typeof rawAmount === 'object'
          ? (Number(rawAmount.value || 0) / (rawAmount.offset || 1)).toFixed(2)
          : String(rawAmount)
        : '';
      const method = payload?.payment?.method || '';
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1, borderRadius: '10px', bgcolor: bg, border: `1px solid ${border}`, minWidth: 180 }}>
          <Typography fontSize={22} lineHeight={1}>{icon}</Typography>
          <Box>
            <Typography fontSize={13} fontWeight={700} color={color}>{label}</Typography>
            {amount && <Typography fontSize={11} color="#6b7280">Amount: {amount}</Typography>}
            {method && <Typography fontSize={11} color="#9ca3af">{method}</Typography>}
          </Box>
        </Box>
      );
    }

    if (type === 'call') {
      const callData = history?.call || payload?.call || payload;
      const callStatus = (callData?.status || '').toUpperCase();
      const direction = history?.direction || 'IN';

      const isCompleted = callStatus === 'COMPLETED' || history?.status === 'CALL_COMPLETED';
      const isMissed = ['NO_ANSWER', 'FAILED', 'BUSY', 'REJECTED'].includes(callStatus) ||
        ((history?.status || '').startsWith('CALL_') && !isCompleted);

      const icon = direction === 'IN'
        ? (isCompleted ? '📞' : '📵')
        : '📲';

      const label = direction === 'IN'
        ? (isCompleted ? 'Incoming Call' : 'Missed Call')
        : 'Outgoing Call';

      const statusLabel = isCompleted ? 'Completed' : isMissed ? 'Missed' : callStatus || 'Unknown';
      const color = isCompleted ? '#16a34a' : isMissed ? '#dc2626' : '#6b7280';
      const bg = isCompleted ? '#f0fdf4' : isMissed ? '#fef2f2' : '#f9fafb';
      const border = isCompleted ? '#bbf7d0' : isMissed ? '#fecaca' : '#e5e7eb';

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1, borderRadius: '10px', bgcolor: bg, border: `1px solid ${border}`, minWidth: 180 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#fff', border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {icon}
          </Box>
          <Box>
            <Typography fontSize={13} fontWeight={700} color={color}>{label}</Typography>
            <Typography fontSize={11} color="#6b7280">{statusLabel}</Typography>
          </Box>
        </Box>
      );
    }

    if (type === 'media_group') {
      const files: any[] = payload?.files || [];
      return (
        <Stack spacing={0.5}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {files.map((file: any, i: number) => {
              if (file.type?.startsWith('image'))
                return <img key={i} src={file.url} style={{ width: 140, height: 140, borderRadius: 8, objectFit: 'cover' }} />;
              if (file.type?.startsWith('video'))
                return <video key={i} src={file.url} controls style={{ width: 140, height: 140, borderRadius: 8, objectFit: 'cover' }} />;
              return (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 1 }}>
                  <Typography>📄</Typography>
                  <Typography fontSize={12}>{file.name || 'File'}</Typography>
                </Box>
              );
            })}
          </Box>
          {payload?.caption && <Typography fontSize={13} sx={{ pt: 0.25, whiteSpace: 'pre-wrap' }}>{payload.caption}</Typography>}
        </Stack>
      );
    }

    return (
      <WAText text={payload?.bodyText || payload?.text?.body || (typeof payload?.text === 'string' ? payload?.text : '') || (typeof text === 'string' ? text : '') || ''} />
    );
  };

  const groupedMessages: any[] = [];
  data.forEach((msg: any) => {
    if (msg.group_id) {
      const existing = groupedMessages.find((g) => g.group_id === msg.group_id);
      if (existing) { existing.items.push(msg); }
      else { groupedMessages.push({ group_id: msg.group_id, items: [msg], direction: msg.direction }); }
    } else {
      groupedMessages.push(msg);
    }
  });

  if (!data) return null;

  const BubbleMeta = ({ ts, isOut, history }: { ts: string; isOut: boolean; history?: any }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
      <Typography sx={{ fontSize: 10.5, color: isOut ? '#72a17a' : '#9ca3af', lineHeight: 1 }}>
        {new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })}
      </Typography>
      {isOut && history && getStatusUI(history)}
    </Box>
  );

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en', { day: 'numeric', month: 'short', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  let lastDateStr = '';

  return (
    <Box ref={wrapper} sx={{ py: 1 }}>
      {groupedMessages.map((group: any, index: number) => {
        const groupTs = group.items ? group.items[0]?.createdAt : group.createdAt;
        const dateStr = groupTs ? new Date(groupTs).toDateString() : '';
        const showDateSep = dateStr && dateStr !== lastDateStr;
        if (showDateSep) lastDateStr = dateStr;

        // ── MEDIA GROUP ──
        if (group.items) {
          const first = group.items[0];
          const isOut = group.direction !== 'IN';
          return (
            <Fragment key={index}>
              {showDateSep && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
                  <Typography sx={{ fontSize: 11.5, color: '#6b7280', bgcolor: 'rgba(255,255,255,0.8)', px: 1.75, py: 0.4, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontWeight: 500 }}>
                    {formatDateLabel(groupTs)}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', px: 2, mb: 1 }}>
                <Box sx={{
                  maxWidth: '75%',
                  bgcolor: isOut ? '#d9fdd3' : '#fff',
                  borderRadius: isOut ? '12px 12px 0 12px' : '0 12px 12px 12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  p: 0.5,
                }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {group.items.map((item: any, i: number) => {
                      const itemUrl = item.payload?.url;
                      if (item.type === 'image') return <img key={i} src={itemUrl} onError={(e: any) => { e.target.src = '/image-error.png'; }} style={{ width: 140, height: 140, borderRadius: 6, objectFit: 'cover' }} />;
                      if (item.type === 'video') return <video key={i} src={itemUrl} controls style={{ width: 140, height: 140, borderRadius: 6 }} />;
                      return null;
                    })}
                  </Box>
                  {first.payload?.caption && <Typography sx={{ px: 0.5, pt: 0.5, fontSize: 13 }}>{first.payload.caption}</Typography>}
                  <Box sx={{ px: 0.5 }}>
                    <BubbleMeta ts={first.createdAt} isOut={isOut} />
                  </Box>
                </Box>
              </Box>
            </Fragment>
          );
        }

        // ── NORMAL MESSAGE ──
        const history = group;
        const isOut = history.direction !== 'IN';

        return (
          <Fragment key={index}>
            {showDateSep && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
                <Typography sx={{ fontSize: 11.5, color: '#6b7280', bgcolor: 'rgba(255,255,255,0.8)', px: 1.75, py: 0.4, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontWeight: 500 }}>
                  {formatDateLabel(groupTs)}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', px: 2, mb: 1 }}>
              <Box sx={{
                maxWidth: '72%',
                bgcolor: isOut ? '#d9fdd3' : '#fff',
                borderRadius: isOut ? '12px 12px 0 12px' : '0 12px 12px 12px',
                px: 1.5, py: 0.875,
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                opacity: history.isTemp ? 0.72 : 1,
                transition: 'opacity 0.25s',
              }}>
                <ReplyPreview message={history.reply_message} selectedBy={history} />
                <RenderMessage history={history} />
                <BubbleMeta ts={history.createdAt} isOut={isOut} history={history} />
              </Box>
            </Box>
          </Fragment>
        );
      })}

      {listModal && (
        <Dialog open={!!listModal} onClose={() => setListModal(null)} fullWidth maxWidth="xs">
          <Stack spacing={2} sx={{ p: 2 }}>
            <Typography fontWeight={600}>{listModal?.sections?.[0]?.title || 'Select Option'}</Typography>
            {listModal?.sections?.map((section: any, i: number) => (
              <Stack key={i} spacing={1}>
                {section.rows.map((row: any) => (
                  <Box key={row.id} sx={{ border: '1px solid #eee', borderRadius: 2, px: 2, py: 1.5, cursor: 'pointer', '&:hover': { background: '#f5f5f5' } }}>
                    <Typography fontWeight={500}>{row.title}</Typography>
                    {row.description && <Typography fontSize={12} color="text.secondary">{row.description}</Typography>}
                  </Box>
                ))}
              </Stack>
            ))}
          </Stack>
        </Dialog>
      )}
    </Box>
  );
};

export default ChatHistory;
