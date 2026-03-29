// material-ui
import { Badge } from '@mui/material';

// project imports
import AvatarStatus from './AvatarStatus';
import { UserProfile } from 'types/user-profile';
import Avatar from 'components/@extended/Avatar';

//   Webpack version (CRA compatible)
const avatarImage = require.context(
  'assets/images/users',
  false,
  /\.(png|jpe?g|svg)$/
);

interface UserAvatarProps {
  user: UserProfile;
}

const UserAvatar = ({ user }: UserAvatarProps) => {
  const imagePath = user.avatar
    ? avatarImage(`./${user.avatar}`)
    : undefined;

  return (
    <Badge
      overlap="circular"
      badgeContent={<AvatarStatus status={user.online_status!} />}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      sx={{
        '& .MuiBox-root': { width: 6, height: 6 },
        padding: 0,
        minWidth: 12,
        '& svg': { background: '#fff', borderRadius: '50%' }
      }}
    >
      <Avatar alt={user.name} src={imagePath} />
    </Badge>
  );
};

export default UserAvatar;