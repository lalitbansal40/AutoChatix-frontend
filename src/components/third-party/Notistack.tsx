// material-ui
import { styled } from '@mui/material/styles';

// third-party
import { SnackbarProvider } from 'notistack';

// project import
import { useSelector } from 'store';

// assets
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

//   FIX: style wrapper correctly target content
const StyledSnackbarProvider = styled(SnackbarProvider)(({ theme }) => ({
  '& .notistack-MuiContent-success': {
    backgroundColor: theme.palette.success.main
  },
  '& .notistack-MuiContent-error': {
    backgroundColor: theme.palette.error.main
  },
  '& .notistack-MuiContent-info': {
    backgroundColor: theme.palette.info.main
  },
  '& .notistack-MuiContent-warning': {
    backgroundColor: theme.palette.warning.main
  },
  '& .notistack-MuiContent-default': {
    backgroundColor: theme.palette.primary.main
  }
}));

// ===========================|| SNACKBAR - NOTISTACK ||=========================== //

const Notistack = ({ children }: any) => {
  const snackbar = useSelector((state) => state.snackbar);
  const iconSX = { marginRight: 8, fontSize: '1.15rem' };

  return (
    <StyledSnackbarProvider
      maxSnack={snackbar?.maxStack || 3}
      dense={snackbar?.dense || false}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      autoHideDuration={3000}
      iconVariant={
        snackbar?.iconVariant === 'useemojis'
          ? {
              success: <CheckCircleOutlined style={iconSX} />,
              error: <CloseCircleOutlined style={iconSX} />,
              warning: <WarningOutlined style={iconSX} />,
              info: <InfoCircleOutlined style={iconSX} />
            }
          : undefined
      }
      hideIconVariant={snackbar?.iconVariant === 'hide'}
    >
      {children}
    </StyledSnackbarProvider>
  );
};

export default Notistack;