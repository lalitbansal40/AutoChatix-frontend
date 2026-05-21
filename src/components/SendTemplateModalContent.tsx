import {
    Box,
    TextField,
    CircularProgress,
    Autocomplete,
    Typography,
    Stack,
    Button,
    Alert,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { templateService } from "service/template.service";
import axiosServices from "utils/axios";
import { useSnackbar } from "notistack";

interface Props {
    channelId: string;
    onNext: (data: {
        templateName: string;
        bodyParams: string[];
        headerImageUrl?: string;
        isValid: boolean;
    }) => void;
}

const SendTemplateModalContent = ({ channelId, onNext }: Props) => {
    const { enqueueSnackbar } = useSnackbar();
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [bodyValues, setBodyValues] = useState<string[]>([]);
    const [headerImageUrl, setHeaderImageUrl] = useState("");
    const [headerUploading, setHeaderUploading] = useState(false);

    //   FETCH TEMPLATES
    const { data: templatesData, isLoading } = useQuery({
        queryKey: ["templates", channelId],
        queryFn: () => templateService.getTemplates(channelId, {
            status: "APPROVED",
            limit: 100, // 🔥 IMPORTANT
        }),
        select: (res: any) => res.data || [],
        enabled: !!channelId,
    });

    //   BODY COMPONENT
    const bodyComponent = useMemo(() => {
        return selectedTemplate?.components?.find((c: any) => c.type === "BODY");
    }, [selectedTemplate]);

    //   VARIABLES
    const variables = useMemo(() => {
        return bodyComponent?.text?.match(/{{\d+}}/g) || [];
    }, [bodyComponent]);

    const isDynamicHeader = !!selectedTemplate?.header_dynamic;
    const headerFormat: string = selectedTemplate?.components?.find((c: any) => c.type === "HEADER")?.format || "";

    const isValid =
        selectedTemplate &&
        variables.length === bodyValues.filter(Boolean).length &&
        (!isDynamicHeader || !!headerImageUrl.trim());

    const handleHeaderUpload = async (file: File) => {
        try {
            const fd = new FormData();
            fd.append("file", file);
            setHeaderUploading(true);
            const res = await axiosServices.post(`/templates/upload-media/${channelId}`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setHeaderImageUrl(res.data.url);
        } catch {
            enqueueSnackbar("Upload failed", { variant: "error" });
        } finally {
            setHeaderUploading(false);
        }
    };

    //   INPUT CHANGE
    const handleBodyChange = (index: number, value: string) => {
        const updated = [...bodyValues];
        updated[index] = value;
        setBodyValues(updated);
    };

    //   RENDER PREVIEW TEXT
    const renderedText = useMemo(() => {
        if (!bodyComponent?.text) return "";

        return bodyComponent.text.replace(/{{(\d+)}}/g, (_: any, i: any) => {
            return bodyValues[i - 1] || `{{${i}}}`;
        });
    }, [bodyComponent, bodyValues]);

    // HEADER / FOOTER / BUTTONS
    const headerComponent = selectedTemplate?.components?.find(
        (c: any) => c.type === "HEADER"
    );

    const footerComponent = selectedTemplate?.components?.find(
        (c: any) => c.type === "FOOTER"
    );

    const buttonsComponent = selectedTemplate?.components?.find(
        (c: any) => c.type === "BUTTONS"
    );

    useEffect(() => {
        onNext({
            templateName: selectedTemplate?.name || "",
            bodyParams: bodyValues,
            headerImageUrl: isDynamicHeader ? headerImageUrl : undefined,
            isValid,
        });
    }, [selectedTemplate, bodyValues, headerImageUrl, isValid, isDynamicHeader, onNext]);

    return (
        <Stack direction="row" spacing={3}>
            {/* 🔥 LEFT SIDE */}
            <Stack spacing={2} flex={1} sx={{ height: "100%" }}>
                {/* TEMPLATE SELECT */}
                <Autocomplete
                    options={templatesData || []}
                    loading={isLoading}
                    getOptionLabel={(option) => option.name || ""}
                    value={selectedTemplate}
                    onChange={(_, value) => {
                        setSelectedTemplate(value);
                        setBodyValues([]);
                        setHeaderImageUrl("");
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select Template"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {isLoading && <CircularProgress size={20} />}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />

                {/* VARIABLES INPUT */}
                {variables.length > 0 && (
                    <Box>
                        <Typography variant="caption">
                            Fill template values:
                        </Typography>

                        <Stack spacing={1} mt={1}>
                            {variables.map((v: string, i: number) => (
                                <TextField
                                    key={i}
                                    size="small"
                                    label={`Value for ${v}`}
                                    value={bodyValues[i] || ""}
                                    onChange={(e) =>
                                        handleBodyChange(i, e.target.value)
                                    }
                                />
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* DYNAMIC HEADER IMAGE */}
                {isDynamicHeader && (
                    <Box sx={{ border: "1px solid #bfdbfe", borderRadius: 2, p: 2, bgcolor: "#eff6ff" }}>
                        <Typography fontSize={13} fontWeight={700} color="#1d4ed8" mb={0.5}>
                            Header Image Required
                        </Typography>
                        <Alert severity="info" sx={{ mb: 1.5, fontSize: 12, py: 0.5, borderRadius: "8px" }} icon={<LinkOutlinedIcon fontSize="small" />}>
                            This template uses a <strong>dynamic header</strong>. Upload or paste the image URL to send to all contacts.
                        </Alert>

                        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                            <Button
                                variant="outlined" component="label" size="small"
                                disabled={headerUploading}
                                startIcon={headerUploading ? <CircularProgress size={13} /> : <UploadFileOutlinedIcon sx={{ fontSize: 14 }} />}
                                sx={{
                                    borderRadius: "8px", textTransform: "none", fontSize: 12, fontWeight: 600,
                                    borderColor: "#1d4ed8", color: "#1d4ed8",
                                    "&:hover": { borderColor: "#1e40af", bgcolor: "#dbeafe" },
                                    flexShrink: 0,
                                }}
                            >
                                {headerUploading ? "Uploading…" : `Upload ${headerFormat === "VIDEO" ? "Video" : headerFormat === "DOCUMENT" ? "Document" : "Image"}`}
                                <input
                                    type="file" hidden
                                    accept={headerFormat === "VIDEO" ? "video/*" : headerFormat === "DOCUMENT" ? "application/pdf" : "image/*"}
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeaderUpload(f); }}
                                />
                            </Button>
                            <Typography fontSize={11} color="#6b7280">or paste URL below</Typography>
                        </Stack>

                        <TextField
                            fullWidth size="small"
                            label="Image URL (sent to all contacts)"
                            placeholder="https://s3.amazonaws.com/bucket/image.jpg"
                            value={headerImageUrl}
                            onChange={(e) => setHeaderImageUrl(e.target.value)}
                            sx={{ bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                            helperText={headerImageUrl ? "✓ This URL will be sent as the header image to all contacts" : "Required — enter once, same image goes to all contacts"}
                            FormHelperTextProps={{ sx: { color: headerImageUrl ? "#10b981" : undefined } }}
                        />
                    </Box>
                )}
            </Stack>

            {/* 🔥 RIGHT SIDE (PREVIEW) */}
            <Box
                sx={{
                    width: 300,
                    height: 550,
                    borderRadius: "20px",
                    background: "#e5ddd5",
                    p: 2,
                }}
            >
                <Box
                    sx={{
                        background: "#fff",
                        borderRadius: 3,
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}
                >
                    {/* HEADER */}
                    {headerComponent?.format === "TEXT" && (
                        <Typography fontWeight="bold">
                            {headerComponent.text}
                        </Typography>
                    )}

                    {headerComponent?.format === "IMAGE" && (
                        isDynamicHeader ? (
                            headerImageUrl ? (
                                <img alt="header" src={headerImageUrl} style={{ width: "100%", borderRadius: 8, maxHeight: 140, objectFit: "cover" }} />
                            ) : (
                                <Box sx={{ bgcolor: "#e0f2fe", borderRadius: 1, p: 1.5, display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
                                    <LinkOutlinedIcon sx={{ fontSize: 16, color: "#0284c7" }} />
                                    <Typography fontSize={11} color="#0284c7" fontWeight={600}>Image URL required</Typography>
                                </Box>
                            )
                        ) : (
                            <img
                                alt="header"
                                src={headerComponent?.example?.header_handle?.[0]}
                                style={{ width: "100%", borderRadius: 8 }}
                            />
                        )
                    )}

                    {/* BODY */}
                    <Typography>
                        {renderedText || "Template preview..."}
                    </Typography>

                    {/* FOOTER */}
                    {footerComponent && (
                        <Typography fontSize={12} color="gray">
                            {footerComponent.text}
                        </Typography>
                    )}

                    {/* BUTTONS */}
                    {buttonsComponent?.buttons?.length > 0 && (
                        <>
                            <Box sx={{ borderTop: "1px solid #eee", mt: 1 }} />
                            {buttonsComponent.buttons.map((btn: any, i: number) => (
                                <Box
                                    key={i}
                                    sx={{
                                        textAlign: "center",
                                        py: 1,
                                        color: "#00a884",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    {btn.text}
                                </Box>
                            ))}
                        </>
                    )}
                </Box>
            </Box>
        </Stack>
    );
};

export default SendTemplateModalContent;