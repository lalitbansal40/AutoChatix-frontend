// material-ui
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';

// types
import { ThemeDirection } from 'types/config';

// ==============================|| AUTH BLUR BACK SVG ||============================== //

const AuthBackground = () => {
  const theme = useTheme();

  const isRTL = theme.direction === ThemeDirection.RTL;

  return (
    <Box
      sx={{
        position: 'absolute',
        filter: 'blur(18px)',
        zIndex: -1,
        bottom: 0,
        transform: isRTL ? 'rotate(180deg)' : 'inherit'
      }}
    >
      <img
        src="https://autochatix-assets.s3.ap-south-1.amazonaws.com/AutoChatix_Icon_Square.png"
        alt="background"
        style={{
          width: '100%',
          height: 'calc(100vh - 90px)',
          objectFit: 'contain',
          transform: isRTL
            ? 'translateX(35%)'   // 👉 RTL = right move
            : 'translateX(-35%)'  // 👉 LTR = left move
        }}
      />
    </Box>
  );
};

export default AuthBackground;
