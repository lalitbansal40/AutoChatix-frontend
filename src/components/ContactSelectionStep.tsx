import {
    Box,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Checkbox,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { contactService } from "service/contact.service";
import { useEffect, useState } from "react";
import { templateService } from "service/template.service";
import { useSnackbar } from "notistack";

const ContactSelectionStep = ({ channelId, templateData, onSend }: any) => {
    const { enqueueSnackbar } = useSnackbar();
    const [selected, setSelected] = useState<string[]>([]);
    const [file, setFile] = useState<File | null>(null);

    const { data: contacts = [] } = useQuery({
        queryKey: ["contacts", channelId],
        queryFn: () => contactService.getContacts(channelId),
        select: (res: any) => res.data || [],
    });

    const toggle = (id: string) => {
        if (selected.includes(id)) {
            setSelected(selected.filter((i) => i !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const handleSend = async () => {
        try {
            console.log("TEMPLATE DATA:", templateData);
            if (!selected.length && !file) {
                enqueueSnackbar("Please select contacts or upload file", {
                    variant: "error",
                });
                return;
            }

            if (
                templateData.bodyParams &&
                templateData.bodyParams.some((v: string) => !v)
            ) {
                enqueueSnackbar("Please fill all template values", {
                    variant: "error",
                });
                return;
            }


            const formData = new FormData();

            formData.append("templateName", templateData.templateName);

            // 🔥 ADD THIS (MOST IMPORTANT)
            formData.append(
                "bodyParams",
                JSON.stringify(templateData.bodyParams || [])
            );

            if (selected.length) {
                formData.append("contacts", JSON.stringify(selected));
            }

            if (file) {
                formData.append("file", file);
            }

            console.log("SENDING FORM DATA...");

            await templateService.sendBulkTemplate(channelId, formData);

            enqueueSnackbar("Bulk sent 🚀", {
                variant: "success",
            });
        } catch (err) {
            console.error(err);
            enqueueSnackbar("Error sending bulk", {
                variant: "error",
            });
        }
    };

    useEffect(() => {
        if (onSend) {
            onSend.current = handleSend;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, file, templateData]);

    return (
        <Box>
            <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Select</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Phone</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {contacts.map((c: any) => (
                        <TableRow key={c._id}>
                            <TableCell>
                                <Checkbox
                                    checked={selected.includes(c._id)}
                                    onChange={() => toggle(c._id)}
                                />
                            </TableCell>
                            <TableCell>{c.name}</TableCell>
                            <TableCell>{c.phone}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

export default ContactSelectionStep;