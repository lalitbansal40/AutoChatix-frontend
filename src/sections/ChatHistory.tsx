/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/iframe-has-title */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, Stack, Theme, Typography, Tooltip } from '@mui/material';
import { Box } from '@mui/system';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { UserProfile } from 'types/user-profile';
import { History } from 'types/chat';

interface ChatHistoryProps {
  data: History[];
  theme: Theme;
  user: UserProfile;
}

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
    payload?.text ||
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
      payload?.text ||
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
      const errorText = history.error?.message || 'Message failed';
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

    const formatKey = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const renderObject = (obj: any): any => Object.entries(obj).map(([key, value]: any) => {
      if (typeof value === 'object' && value !== null) {
        return (
          <Stack key={key} spacing={0.5} sx={{ mt: 1 }}>
            <Typography fontWeight={600} fontSize={13}>{formatKey(key)}</Typography>
            <Stack sx={{ border: '1px solid #eee', borderRadius: 2, overflow: 'hidden' }}>
              {Object.entries(value).map(([k, v]: any, i, arr) => (
                <Stack key={k} direction="row" justifyContent="space-between" sx={{ px: 1.5, py: 1, background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: i !== arr.length - 1 ? '1px solid #eee' : 'none' }}>
                  <Typography fontSize={12} fontWeight={500}>{formatKey(k)}</Typography>
                  <Typography fontSize={12}>{String(v)}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        );
      }
      return (
        <Stack key={key} direction="row" justifyContent="space-between" sx={{ px: 0.5, py: 0.5 }}>
          <Typography fontSize={12} fontWeight={500}>{formatKey(key)}</Typography>
          <Typography fontSize={12}>{String(value)}</Typography>
        </Stack>
      );
    });

    return (
      <Stack spacing={1}>
        <Typography variant="body2" fontWeight={600}>Flow Response</Typography>
        {renderObject(parsed)}
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
          {payload?.caption && <Typography sx={{ pt: 0.5, whiteSpace: 'pre-line', fontSize: 14 }}>{payload.caption}</Typography>}
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
          {payload?.body && <Typography sx={{ whiteSpace: 'pre-line', fontSize: 14 }}>{payload.body}</Typography>}
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

      const getRenderedBody = () => {
        if (bodyComponent?.text) {
          let t = bodyComponent.text;
          const bodyParams = payload?.request?.template?.components?.find((c: any) => c.type === 'body')?.parameters || [];
          if (!bodyParams.length && history.text) return history.text;
          t = t.replace(/{{(\d+)}}/g, (_: any, i: any) => bodyParams[i - 1]?.text || `{{${i}}}`);
          return t;
        }
        return history.text || payload?.text?.body || payload?.bodyText || 'Template message';
      };

      return (
        <Stack sx={{ borderRadius: 2, overflow: 'hidden', maxWidth: 280 }}>
          {headerUrl && headerType === 'image' && <img src={headerUrl} style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />}
          {headerUrl && headerType === 'video' && <video src={headerUrl} controls style={{ width: '100%' }} />}
          {headerUrl && headerType === 'document' && <Box sx={{ p: 1, cursor: 'pointer' }} onClick={() => window.open(headerUrl)}>📄 View Document</Box>}
          <Typography sx={{ pt: 0.5, whiteSpace: 'pre-line', fontSize: 14 }}>{getRenderedBody()}</Typography>
          {buttonsComponent?.buttons?.length > 0 && (
            <Stack sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', mt: 0.5 }}>
              {buttonsComponent.buttons.map((btn: any, i: number) => (
                <Box key={i} sx={{ textAlign: 'center', py: 0.9, fontSize: 13, color: '#00a884', fontWeight: 500, borderBottom: i !== buttonsComponent.buttons.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none', cursor: 'pointer', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}>
                  {btn.type === 'URL' && '🔗 '}{btn.type === 'PHONE_NUMBER' && '📞 '}{btn.text}
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
          <Typography fontSize={14}>{bodyText}</Typography>
          <Stack sx={{ border: '1px solid #25D366', color: '#25D366', borderRadius: 2, px: 2, py: 0.75, cursor: 'pointer', width: 'fit-content', fontWeight: 500, '&:hover': { background: '#f1fdf5' } }}>
            📍 Provide Address
          </Stack>
        </Stack>
      );
    }

    if (type === 'text') return <Typography sx={{ fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</Typography>;

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
          <Typography sx={{ whiteSpace: 'pre-line', fontSize: 14 }}>{payload?.body}</Typography>
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
          <Typography fontSize={14}>{payload?.bodyText}</Typography>
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
          <Typography fontSize={14}>{payload?.bodyText}</Typography>
          <Stack onClick={() => window.open(payload?.url)} sx={{ border: '1px solid #25D366', color: '#25D366', borderRadius: 2, px: 2, py: 0.75, cursor: 'pointer', width: 'fit-content', fontWeight: 500 }}>
            {payload?.buttonText}
          </Stack>
        </Stack>
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
      <Typography fontSize={14} sx={{ wordBreak: 'break-word' }}>
        {payload?.bodyText || payload?.text?.body || payload?.text || text || ''}
      </Typography>
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
