import { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  heading: string;
  subheading?: string | ReactNode;
  children: ReactNode;
}

// White card + heading + form slot — used inside AuthSplitWrapper
const AuthFormCard = ({ heading, subheading, children }: Props) => (
  <Box>
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>{heading}</Typography>
      {subheading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{subheading}</Typography>
      )}
    </Box>

    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: { xs: 3, md: 3.5 },
        boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {children}
    </Box>
  </Box>
);

export default AuthFormCard;
