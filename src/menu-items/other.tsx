// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { ChromeOutlined, QuestionOutlined, DeploymentUnitOutlined, MessageOutlined, RobotOutlined, ApiOutlined, TagsOutlined, PhoneOutlined, ShoppingOutlined, WalletOutlined } from '@ant-design/icons';

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
  TagsOutlined,
  PhoneOutlined,
  ShoppingOutlined,
  WalletOutlined,
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
      id: 'CallLogs',
      title: <FormattedMessage id="Call Logs" />,
      type: 'item',
      url: '/calls',
      icon: icons.PhoneOutlined
    },
    {
      id: 'ECommerce',
      title: <FormattedMessage id="E-Commerce" />,
      type: 'item',
      url: '/ecommerce',
      icon: icons.ShoppingOutlined
    },
    {
      id: 'Integrations',
      title: <FormattedMessage id="Integrations" />,
      type: 'item',
      url: '/integrations',
      icon: icons.ApiOutlined
    },
    {
      id: 'ContactFields',
      title: <FormattedMessage id="Contact Fields" />,
      type: 'item',
      url: '/contact-fields',
      icon: icons.TagsOutlined
    },
    {
      id: 'Payments',
      title: <FormattedMessage id="Payments" />,
      type: 'item',
      url: '/payments',
      icon: icons.WalletOutlined
    }
  ]
};

export default other;