// material-ui
import { useTheme } from '@mui/material/styles';
import { ThemeMode } from 'types/config';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoDark from 'assets/images/logo-dark.svg';
 * import logo from 'assets/images/logo.svg';
 *
 */

// ==============================|| LOGO SVG ||============================== //

const LogoMain = ({ reverse, ...others }: { reverse?: boolean }) => {
  const theme = useTheme();

  return (
    <>
      <img
        src="https://autochatix-assets.s3.ap-south-1.amazonaws.com/AutoChatix_Full_Logo.png"
        alt="logo"
        width={250}
        height={80}
        style={{
          objectFit: 'contain',
          filter:
            theme.palette.mode === ThemeMode.DARK || reverse
              ? 'brightness(0) invert(1)' // 👈 dark mode me white logo
              : 'none'
        }}
        {...others}
      />
    </>
  );
};


export default LogoMain;
