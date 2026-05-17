// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { ChromeOutlined, QuestionOutlined, DeploymentUnitOutlined, MessageOutlined, RobotOutlined, ApiOutlined, TagsOutlined, PhoneOutlined, ShoppingOutlined, WalletOutlined, ThunderboltOutlined, CreditCardOutlined, BranchesOutlined, ContactsOutlined, BookOutlined } from '@ant-design/icons';

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
  ThunderboltOutlined,
  CreditCardOutlined,
  BranchesOutlined,
  ContactsOutlined,
  BookOutlined,
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
      id: 'AutomationLibrary',
      title: <FormattedMessage id="Automation Library" defaultMessage="Automation Library" />,
      type: 'item',
      url: '/automation-library',
      icon: icons.BookOutlined
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
      id: 'Leads',
      title: <FormattedMessage id="Leads" defaultMessage="Leads" />,
      type: 'item',
      url: '/leads',
      icon: icons.ContactsOutlined
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
    },
    {
      id: 'AiConfigs',
      title: <FormattedMessage id="AI Configs" defaultMessage="AI Configs" />,
      type: 'item',
      url: '/ai-configs',
      icon: icons.ThunderboltOutlined
    },
    {
      id: 'FlowBuilder',
      title: <FormattedMessage id="WA Flows" defaultMessage="WA Flows" />,
      type: 'item',
      url: '/flow-builder',
      icon: icons.BranchesOutlined
    },
    {
      id: 'Wallet',
      title: <FormattedMessage id="Wallet" defaultMessage="Wallet" />,
      type: 'item',
      url: '/wallet',
      icon: icons.WalletOutlined
    },
    {
      id: 'Billing',
      title: <FormattedMessage id="Billing" defaultMessage="Billing & Plans" />,
      type: 'item',
      url: '/billing',
      icon: icons.CreditCardOutlined
    }
  ]
};

export default other;