import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import VariablePicker from "components/VariablePicker";
import { templateService } from "service/template.service";

const CATEGORY_COLOR: Record<string, { bg: string; color: string }> = {
  MARKETING: { bg: "#fef3c7", color: "#92400e" },
  UTILITY: { bg: "#dbeafe", color: "#1d4ed8" },
  AUTHENTICATION: { bg: "#f3e8ff", color: "#7e22ce" },
};

const extractBodyText = (template: any) =>
  template?.components?.find((component: any) => component.type === "BODY")?.text || "";

const extractVariables = (text: string) => {
  const matches = Array.from(text.matchAll(/{{(\d+)}}/g));
  return Array.from(new Set(matches.map((match) => Number(match[1])))).sort((a, b) => a - b);
};

const renderTemplateText = (text: string, values: string[]) =>
  text.replace(/{{(\d+)}}/g, (_match, index) => values[Number(index) - 1] || `{{${index}}}`);

const asArray = (value: any): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item || ""));
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item || "")) : [];
  } catch {
    return [];
  }
};

const parsePhoneNumbers = (value: any): string[] =>
  String(value || "")
    .split(/[\n,;\s]+/)
    .map((item) => item.replace(/[^\d+]/g, "").trim())
    .filter(Boolean);

const WhatsAppNotificationEditor = ({
  node,
  updateNodeData,
  channelId,
}: {
  node: any;
  updateNodeData: (id: string, data: any) => void;
  channelId?: string;
}) => {
  const data = node.data || {};
  const isBroadcast = data.type === "broadcast_message";
  const sendMode =
    data.send_mode ||
    (isBroadcast && (data.template?.name || data.template_name)
      ? "template"
      : "text");
  const bodyParams = asArray(data.body_params ?? data.template?.body);
  const [phoneDraft, setPhoneDraft] = useState("");
  const phoneNumbers = useMemo(
    () =>
      Array.from(
        new Set(
          parsePhoneNumbers(
            data.numbers ?? data.phone_numbers ?? data.recipients,
          ),
        ),
      ),
    [data.numbers, data.phone_numbers, data.recipients],
  );

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates", channelId, "APPROVED", "automation-editor"],
    queryFn: async () => {
      const res = await templateService.getTemplates(channelId!, {
        status: "APPROVED",
        limit: 100,
      });
      return res.data || [];
    },
    enabled: !!channelId,
    staleTime: 60_000,
  });

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template: any) =>
          template.name === (data.template_name || data.template?.name),
      ) ||
      (data.template?.name ? data.template : null),
    [templates, data.template_name, data.template],
  );
  const bodyText = extractBodyText(selectedTemplate);
  const variables = extractVariables(bodyText);
  const previewText =
    sendMode === "template" || !isBroadcast
      ? renderTemplateText(bodyText, bodyParams)
      : data.message || "";

  const patchNode = (patch: Record<string, any>) => {
    updateNodeData(node.id, patch);
  };

  const updatePhoneNumbers = (numbers: string[]) => {
    patchNode({ numbers: Array.from(new Set(numbers)).join("\n") });
  };

  const addPhoneNumbers = () => {
    const nextNumbers = parsePhoneNumbers(phoneDraft);
    if (!nextNumbers.length) return;
    updatePhoneNumbers([...phoneNumbers, ...nextNumbers]);
    setPhoneDraft("");
  };

  const removePhoneNumber = (number: string) => {
    updatePhoneNumbers(phoneNumbers.filter((item) => item !== number));
  };

  const handleTemplateChange = (template: any | null) => {
    const nextBody = extractVariables(extractBodyText(template)).map((_, index) => bodyParams[index] || "");
    patchNode({
      send_mode: "template",
      template_name: template?.name || "",
      language: template?.language || data.language || "en_US",
      body_params: nextBody,
      template: template
        ? {
            name: template.name,
            language: template.language || data.language || "en_US",
            body: nextBody,
          }
        : { language: data.language || "en_US" },
      message: template ? renderTemplateText(extractBodyText(template), nextBody) : "",
    });
  };

  const handleBodyParamChange = (index: number, value: string) => {
    const nextBody = [...bodyParams];
    nextBody[index] = value;
    patchNode({
      body_params: nextBody,
      template: data.template
        ? {
            ...data.template,
            body: nextBody,
          }
        : undefined,
      message: renderTemplateText(bodyText, nextBody),
    });
  };

  return (
    <Stack spacing={2.25}>
      <Box>
        <Typography fontSize={14} fontWeight={700} color="#111827">
          {isBroadcast ? "Send WhatsApp Notification" : "Send Template"}
        </Typography>
        <Typography fontSize={12} color="text.secondary">
          {isBroadcast
            ? "Send a WhatsApp text or approved template to multiple phone numbers."
            : "Send an approved WhatsApp template to the current contact."}
        </Typography>
      </Box>

      {!channelId && (
        <Alert severity="warning" sx={{ borderRadius: "8px" }}>
          Channel is required before templates can be loaded.
        </Alert>
      )}

      {isBroadcast && (
        <>
          <Box
            sx={{
              border: "1px solid #bbf7d0",
              borderRadius: "14px",
              bgcolor: "#f7fef9",
              p: 1.5,
              boxShadow: "0 10px 28px rgba(22,163,74,0.08)",
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25}>
              <Box>
                <Typography fontSize={12} fontWeight={800} color="#166534">
                  Recipients
                </Typography>
                <Typography fontSize={11} color="#6b7280">
                  Add one number, or paste many separated by comma/space/new line.
                </Typography>
              </Box>
              <Chip
                label={`${phoneNumbers.length} added`}
                size="small"
                sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 800, borderRadius: "7px" }}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label="Phone Number"
                placeholder="919999999999"
                value={phoneDraft}
                onChange={(event) => setPhoneDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addPhoneNumbers();
                  }
                }}
                size="small"
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    borderRadius: "10px",
                  },
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addPhoneNumbers}
                disabled={!phoneDraft.trim()}
                sx={{
                  minWidth: 110,
                  borderRadius: "10px",
                  bgcolor: "#16a34a",
                  boxShadow: "none",
                  textTransform: "none",
                  fontWeight: 800,
                  "&:hover": { bgcolor: "#15803d", boxShadow: "none" },
                }}
              >
                Add
              </Button>
            </Stack>

            <Box
              sx={{
                mt: 1.5,
                minHeight: 58,
                borderRadius: "12px",
                border: "1px dashed #86efac",
                bgcolor: "#fff",
                p: 1,
                display: "flex",
                flexWrap: "wrap",
                gap: 0.75,
                alignContent: "flex-start",
              }}
            >
              {phoneNumbers.length ? (
                phoneNumbers.map((number) => (
                  <Chip
                    key={number}
                    label={number}
                    onDelete={() => removePhoneNumber(number)}
                    sx={{
                      borderRadius: "8px",
                      bgcolor: "#ecfdf5",
                      color: "#065f46",
                      border: "1px solid #bbf7d0",
                      fontWeight: 700,
                      "& .MuiChip-deleteIcon": { color: "#059669" },
                    }}
                  />
                ))
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 40 }}>
                  <Typography fontSize={12} color="#9ca3af">
                    Added phone numbers will appear here.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <RadioGroup
            row
            value={sendMode}
            onChange={(event) =>
              patchNode({
                send_mode: event.target.value,
                message: event.target.value === "text" ? data.message || "" : previewText,
                ...(event.target.value === "template" && data.template?.name
                  ? { template_name: data.template.name }
                  : {}),
              })
            }
          >
            <FormControlLabel value="text" control={<Radio size="small" />} label="Text Message" />
            <FormControlLabel value="template" control={<Radio size="small" />} label="Template" />
          </RadioGroup>
        </>
      )}

      {isBroadcast && sendMode === "text" ? (
        <VariablePicker
          label="Message"
          value={data.message || ""}
          onChange={(value) => patchNode({ message: value })}
          placeholder="Hello {{contact.name}}"
          rows={5}
          helperText="This text will be sent to every number above."
        />
      ) : (
        <>
          <Autocomplete
            options={templates}
            value={selectedTemplate}
            loading={isLoading}
            isOptionEqualToValue={(option, value) => option.name === value.name}
            getOptionLabel={(option: any) => option?.name || ""}
            onChange={(_, value) => handleTemplateChange(value)}
            renderOption={(props, option: any) => {
              const cat = CATEGORY_COLOR[option.category] || { bg: "#f3f4f6", color: "#374151" };
              return (
                <Box component="li" {...props} sx={{ py: 1.1, px: 1.5 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ArticleOutlinedIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                      <Box>
                        <Typography fontSize={13} fontWeight={700}>
                          {option.name}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {option.language || "en_US"}
                        </Typography>
                      </Box>
                    </Stack>
                    {option.category && (
                      <Chip
                        label={option.category}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: "5px",
                          bgcolor: cat.bg,
                          color: cat.color,
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Template"
                required
                helperText="Approved templates from this WhatsApp channel."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoading && <CircularProgress size={18} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {selectedTemplate && (
            <Box sx={{ border: "1px solid #e5e7eb", borderRadius: "10px", p: 1.5, bgcolor: "#fafafa" }}>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography fontSize={12} fontWeight={700}>
                  {selectedTemplate.name}
                </Typography>
                {selectedTemplate.category && (
                  <Chip label={selectedTemplate.category} size="small" sx={{ height: 20, fontSize: 10 }} />
                )}
                <Chip label={selectedTemplate.language || data.language || "en_US"} size="small" sx={{ height: 20, fontSize: 10 }} />
              </Stack>
              {bodyText && (
                <Typography fontSize={12} color="#6b7280" whiteSpace="pre-line" mt={1}>
                  {bodyText}
                </Typography>
              )}
            </Box>
          )}

          {variables.length > 0 && (
            <Box sx={{ borderRadius: "12px", border: "1px solid #dbeafe", bgcolor: "#eff6ff", p: 2 }}>
              <Typography fontSize={12} fontWeight={700} color="#1d4ed8" mb={1.5}>
                Body Variables
              </Typography>
              <Stack spacing={1.25}>
                {variables.map((variableIndex) => (
                  <VariablePicker
                    key={variableIndex}
                    value={bodyParams[variableIndex - 1] || ""}
                    onChange={(value) => handleBodyParamChange(variableIndex - 1, value)}
                    label={`Value for {{${variableIndex}}}`}
                    multiline={false}
                    rows={1}
                    size="small"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Divider />
          <Box>
            <Typography fontSize={11} fontWeight={700} color="#9ca3af" textTransform="uppercase" mb={0.75}>
              Preview Text
            </Typography>
            <Typography fontSize={13} color="#111827" whiteSpace="pre-line">
              {previewText || "Select a template to preview the message body."}
            </Typography>
          </Box>
        </>
      )}
    </Stack>
  );
};

export default WhatsAppNotificationEditor;
