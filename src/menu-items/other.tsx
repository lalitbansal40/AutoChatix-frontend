// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { ChromeOutlined, QuestionOutlined, DeploymentUnitOutlined, MessageOutlined, RobotOutlined, ApiOutlined } from '@ant-design/icons';

// type
import { NavItemType } from 'types/menu';

// icons
const icons = {
  ChromeOutlined,
  QuestionOutlined,
  DeploymentUnitOutlined,
  MessageOutlined,
  RobotOutlined,
  ApiOutlined,
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
    },
    {
      id: 'Automations',
      title: <FormattedMessage id="Automations" />,
      type: 'item',
      url: '/automations',
      icon: icons.DeploymentUnitOutlined
    },
    {
      id: 'Integrations',
      title: <FormattedMessage id="Integrations" />,
      type: 'item',
      url: '/integrations',
      icon: icons.ApiOutlined
    }
  ]
};

export default other;