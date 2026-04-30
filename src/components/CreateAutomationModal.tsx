import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
} from "@mui/material";
import { useEffect, useState } from "react";
import automationService from "service/automation.service";
import { useNavigate } from "react-router-dom";
import { channelService } from "service/channel.service";
import { useQuery } from "@tanstack/react-query";

const CreateAutomationModal = ({ open, onClose, onSuccess }: any) => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [channel, setChannel] = useState("");
    const [trigger, setTrigger] = useState("new_message_received");
    const [loading, setLoading] = useState(false);

    /* ================= FETCH CHANNELS ================= */
    const {
        data: channelsData = [],
        isLoading: loadingChannels,
    } = useQuery({
        queryKey: ["channels"],
        queryFn: () => channelService.getChannels(),
        enabled: open,
        select: (res: any) => res.data || [],   // ✅ FIXED
    });

    const selectedChannel = channelsData.find(
        (c: any) => c._id === channel
    );

    /* ================= CREATE ================= */
    const handleCreate = async () => {
        try {
            setLoading(true);

            const res = await automationService.createAutomation({
                name,
                channel_id: channel,
                channel_name: selectedChannel?.channel_name || "",
                trigger,
                nodes: [
                    {
                        id: "start",
                        type: "trigger",
                        label: "trigger",
                    },
                ],
                edges: [],
            });

            const newAutomation = res.data?.data || res.data;

            onSuccess(newAutomation);

            // reset form
            setName("");
            setChannel("");
            setTrigger("new_message_received");

            // redirect to builder
            navigate(`/automation-builder/${newAutomation._id}`);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /* ================= RESET ON OPEN ================= */
    useEffect(() => {
        if (open) {
            setName("");
            setChannel("");
            setTrigger("new_message_received");
        }
    }, [open]);

    console.log("Channels in Modal:", channelsData);
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create Automation</DialogTitle>

            <DialogContent>
                {/* NAME */}
                <Box mb={2}>
                    <TextField
                        fullWidth
                        label="Automation Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </Box>

                {/* CHANNEL */}
                <Box mb={2}>
                    <TextField
                        select
                        fullWidth
                        label="Select Channel"
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        disabled={loadingChannels}
                    >
                        {loadingChannels && (
                            <MenuItem disabled>Loading channels...</MenuItem>
                        )}

                        {!loadingChannels && channelsData.length === 0 && (
                            <MenuItem disabled>No channels found</MenuItem>
                        )}

                        {channelsData.map((ch: any) => (
                            <MenuItem key={ch._id} value={ch._id}>
                                {ch.channel_name || ch.display_phone_number}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                {/* TRIGGER */}
                <Box mb={2}>
                    <TextField
                        select
                        fullWidth
                        label="Trigger Type"
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                    >
                        <MenuItem value="new_message_received">
                            Incoming Message
                        </MenuItem>

                        <MenuItem value="outgoing_message">
                            Outgoing Message
                        </MenuItem>

                        <MenuItem value="webhook_received">
                            Webhook
                        </MenuItem>

                        {/* 🔥 NEW */}
                        <MenuItem value="call_completed">
                            Call Completed
                        </MenuItem>

                        <MenuItem value="call_missed">
                            Call Missed
                        </MenuItem>
                    </TextField>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>

                <Button
                    variant="contained"
                    onClick={handleCreate}
                    disabled={loading || !name || !channel}
                >
                    {loading ? "Creating..." : "Create"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateAutomationModal;