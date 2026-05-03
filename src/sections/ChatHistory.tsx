/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable jsx-a11y/iframe-has-title */
import { useCallback, useEffect, useRef, useState } from 'react';
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
  return (
    history?.text ||
    payload?.text?.body ||
    payload?.bodyText ||
    payload?.caption ||
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

  const ReplyPreview = ({ message }: any) => {
    if (!message) return null;
    const payload = message.payload || {};
    const type = message.type;

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
      const title = payload?.interactive?.button_reply?.title || payload?.interactive?.list_reply?.title;
      if (title && !payload?.interactive?.nfm_reply) {
        return <Typography sx={{ fontSize: 14 }}>{title}</Typography>;
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

    return (
      <Typography fontSize={14} sx={{ wordBreak: 'break-word' }}>
        {payload?.bodyText || payload?.text?.body || payload?.text || text || 'Message'}
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

  return (
    <Box ref={wrapper} sx={{ py: 1 }}>
      {groupedMessages.map((group: any, index: number) => {

        // ── MEDIA GROUP ──
        if (group.items) {
          const first = group.items[0];
          const isOut = group.direction !== 'IN';
          return (
            <Box key={index} sx={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', px: 2, mb: 1 }}>
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
          );
        }

        // ── NORMAL MESSAGE ──
        const history = group;
        const isOut = history.direction !== 'IN';

        return (
          <Box key={index} sx={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', px: 2, mb: 1 }}>
            <Box sx={{
              maxWidth: '72%',
              bgcolor: isOut ? '#d9fdd3' : '#fff',
              borderRadius: isOut ? '12px 12px 0 12px' : '0 12px 12px 12px',
              px: 1.5, py: 0.875,
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}>
              <ReplyPreview message={history.reply_message} />
              <RenderMessage history={history} />
              <BubbleMeta ts={history.createdAt} isOut={isOut} history={history} />
            </Box>
          </Box>
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
