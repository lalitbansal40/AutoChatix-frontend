// material-ui
// import { useTheme } from '@mui/material/styles';

const LogoIcon = () => {
  // const theme = useTheme();

  return (
    <img
      src="https://autochatix-assets.s3.ap-south-1.amazonaws.com/AutoChatix_Icon_Square.png"
      alt="logo"
      width="60"
      height="60"
      style={{
        objectFit: 'contain'
      }}
    />
  );
};

export default LogoIcon;