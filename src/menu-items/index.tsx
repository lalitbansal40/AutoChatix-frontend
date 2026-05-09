// project import
import other from './other';
import useAuth from 'hooks/useAuth';

// types
import { NavItemType } from 'types/menu';
import { TeamOutlined, CrownOutlined } from '@ant-design/icons';
import { FormattedMessage } from 'react-intl';

// ==============================|| MENU ITEMS ||============================== //

// Static fallback (used by any non-hook import)
const menuItems: { items: NavItemType[] } = {
  items: [other]
};

export default menuItems;

// Hook for role-aware dynamic navigation
export const useMenuItems = (): { items: NavItemType[] } => {
  const { user } = useAuth();
  const role = (user as any)?.role;

  const workspaceChildren: NavItemType[] = [...((other.children as NavItemType[]) || [])];

  // 'admin' is the legacy role name for owner
  if (role === 'owner' || role === 'superadmin' || role === 'admin') {
    workspaceChildren.push({
      id: 'Users',
      title: <FormattedMessage id="Team" defaultMessage="Team" />,
      type: 'item',
      url: '/users',
      icon: TeamOutlined,
    } as NavItemType);
  }

  const items: NavItemType[] = [{ ...other, children: workspaceChildren }];

  if (role === 'superadmin') {
    items.push({
      id: 'admin',
      title: <FormattedMessage id="Admin" defaultMessage="Admin" />,
      type: 'group',
      children: [
        {
          id: 'SuperAdmin',
          title: <FormattedMessage id="SuperAdmin" defaultMessage="Super Admin" />,
          type: 'item',
          url: '/superadmin',
          icon: CrownOutlined,
        } as NavItemType,
      ],
    } as NavItemType);
  }

  return { items };
};
