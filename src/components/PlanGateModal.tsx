import {
  Box, Button, Dialog, DialogContent, Stack, Typography,
} from '@mui/material';
import { CrownOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const PlanGateModal = ({ open, onClose, feature }: Props) => {
  const navigate = useNavigate();

  const handleGoToBilling = () => {
    onClose();
    navigate('/billing');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
        <Box
          sx={{
            width: 64, height: 64, borderRadius: '50%',
            bgcolor: 'warning.lighter', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2.5, fontSize: 28, color: 'warning.main',
          }}
        >
          <CrownOutlined />
        </Box>

        <Typography variant="h5" fontWeight={700} gutterBottom>
          Active Plan Required
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {feature
            ? `To ${feature}, you need an active subscription.`
            : 'This feature requires an active subscription.'}
          {' '}Choose a plan from Billing &amp; Plans to get started.
        </Typography>

        <Stack spacing={1.5}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            endIcon={<ArrowRightOutlined />}
            onClick={handleGoToBilling}
            fullWidth
            sx={{ fontWeight: 700 }}
          >
            View Plans &amp; Pricing
          </Button>
          <Button variant="text" color="inherit" onClick={onClose} fullWidth>
            Maybe later
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default PlanGateModal;
