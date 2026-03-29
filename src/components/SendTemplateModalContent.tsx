import {
    Box,
    TextField,
    CircularProgress,
    Autocomplete,
    Typography,
    Stack
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { templateService } from "service/template.service";

interface Props {
    channelId: string;
    onNext: (data: {
        templateName: string;
        bodyParams: string[];
        isValid: boolean;
    }) => void;
}

const SendTemplateModalContent = ({ channelId, onNext }: Props) => {
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [bodyValues, setBodyValues] = useState<string[]>([]);

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

    const isValid =
        selectedTemplate &&
        variables.length === bodyValues.filter(Boolean).length;

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
            isValid,
        });
    }, [selectedTemplate, bodyValues, isValid, onNext]);

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
                        <img
                            alt="header"
                            src={headerComponent?.example?.header_handle?.[0]}
                            style={{ width: "100%", borderRadius: 8 }}
                        />
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