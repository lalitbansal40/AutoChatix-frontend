import {
    Button,
    Stack,
    Typography,
    Chip,
    IconButton
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { useNavigate } from "react-router-dom";
import MainCard from "components/MainCard";

import { AutomationT } from "types/automation";
import automationService from "service/automation.service";

interface Props {
    automation: AutomationT;
    onRefresh: () => void;
}

const AutomationCard = ({ automation, onRefresh }: Props) => {
    const navigate = useNavigate();

    const handleToggle = async () => {
        await automationService.toggleAutomation(automation._id);
        onRefresh();
    };

    const handleDelete = async () => {
        await automationService.deleteAutomation(automation._id);
        onRefresh();
    };

    return (
        <MainCard
            sx={{
                height: 1,
                "& .MuiCardContent-root": {
                    height: 1,
                    display: "flex",
                    flexDirection: "column"
                }
            }}
        >
            {/* Top */}
            <Stack direction="row" spacing={1.5} alignItems="center">
                <AccountTreeIcon color="primary" />

                <Stack>
                    <Typography variant="h6">
                        {automation.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        📱 {automation.channel_name}
                    </Typography>
                </Stack>
            </Stack>

            {/* Status */}
            <Stack direction="row" mt={2}>
                <Chip
                    label={automation.status === "active" ? "Active" : "Paused"}
                    color={automation.status === "active" ? "success" : "warning"}
                    size="small"
                />
            </Stack>

            {/* Footer */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: "auto", pt: 2 }}
            >
                <Typography variant="caption" color="secondary">
                    Created: {new Date(automation.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="secondary">
                    Updated: {new Date(automation.updatedAt).toLocaleDateString()}
                </Typography>

                <Stack direction="row" spacing={1}>
                    {/* ▶️ / ⏸ */}
                    <IconButton
                        color="primary"
                        onClick={handleToggle}
                    >
                        {automation.status === "active" ? (
                            <PauseIcon />
                        ) : (
                            <PlayArrowIcon />
                        )}
                    </IconButton>

                    {/* 🗑 */}
                    <IconButton
                        color="error"
                        onClick={handleDelete}
                    >
                        <DeleteIcon />
                    </IconButton>

                    {/* 🔧 OPEN BUILDER */}
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() =>
                            navigate(`/automations/${automation._id}`)
                        }
                    >
                        Open
                    </Button>
                </Stack>
            </Stack>
        </MainCard>
    );
};

export default AutomationCard;