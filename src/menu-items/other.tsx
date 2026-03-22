// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { ChromeOutlined, QuestionOutlined, DeploymentUnitOutlined, MessageOutlined, RobotOutlined } from '@ant-design/icons';

// type
import { NavItemType } from 'types/menu';

// icons
const icons = {
  ChromeOutlined,
  QuestionOutlined,
  DeploymentUnitOutlined,
  MessageOutlined, RobotOutlined
};

// ==============================|| MENU ITEMS - SUPPORT ||============================== //

const other: NavItemType = {
  id: 'Workspace',
  title: <FormattedMessage id="Workspace" />,
  type: 'group',
  children: [
    {
      id: 'Chats',
      title: <FormattedMessage id="Chats" />,
      type: 'item',
      url: '/chats',
      icon: icons.MessageOutlined
    },
    {
      id: 'Channels',
      title: <FormattedMessage id="Channels" />,
      type: 'item',
      url: '/channels',
      icon: icons.RobotOutlined
    }
  ]
};

export default other;