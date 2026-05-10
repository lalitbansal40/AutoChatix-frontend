import { lazy } from 'react';

// project import
import MainLayout from 'layout/MainLayout';
import CommonLayout from 'layout/CommonLayout';
import Loadable from 'components/Loadable';
import AuthGuard from 'utils/route-guard/AuthGuard';
import SuperAdminGuard from 'utils/route-guard/SuperAdminGuard';
import Channels from 'pages/Channels';
import ChannelManage from 'pages/ChannelMangae';
import Automations from 'pages/Automation';
import AutomationBuilder from 'pages/AutomationBuilder';
import Integrations from 'pages/Integrations';
import ContactFields from 'pages/ContactFields';
import CallLogs from 'pages/CallLogs';
import ECommerce from 'pages/ECommerce';
import SuperAdmin from 'pages/SuperAdmin';
import UsersPage from 'pages/Users';
import Payments from 'pages/Payments';
import AiConfigs from 'pages/AiConfigs';
import Wallet from 'pages/Wallet';

// pages routing
const MaintenanceError = Loadable(lazy(() => import('pages/maintenance/404')));
const MaintenanceError500 = Loadable(lazy(() => import('pages/maintenance/500')));
const MaintenanceUnderConstruction = Loadable(lazy(() => import('pages/maintenance/under-construction')));
const MaintenanceComingSoon = Loadable(lazy(() => import('pages/maintenance/coming-soon')));

// render - sample page
const ChatPage = Loadable(lazy(() => import('pages/Chat')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      element: (
        <AuthGuard>
          <MainLayout />
        </AuthGuard>
      ),
      children: [
        {
          path: 'Chats',
          element: <ChatPage />
        },
        {
          path: 'Channels',
          element: <Channels />
        },
        {
          path: 'Automations',
          element: <Automations />
        },
        {
          path: 'Automations/:id',
          element: <AutomationBuilder />
        },
        {
          path: 'Channels/:id',
          element: <ChannelManage />
        },
        {
          path: 'integrations',
          element: <Integrations />
        },
        {
          path: 'contact-fields',
          element: <ContactFields />
        },
        {
          path: 'calls',
          element: <CallLogs />
        },
        {
          path: 'ecommerce',
          element: <ECommerce />
        },
        {
          path: 'users',
          element: <UsersPage />
        },
        {
          path: 'payments',
          element: <Payments />
        },
        {
          path: 'wallet',
          element: <Wallet />
        },
        {
          path: 'ai-configs',
          element: <AiConfigs />
        },
        {
          path: 'superadmin',
          element: (
            <SuperAdminGuard>
              <SuperAdmin />
            </SuperAdminGuard>
          )
        }
      ]
    },
    {
      path: '/maintenance',
      element: <CommonLayout />,
      children: [
        {
          path: '404',
          element: <MaintenanceError />
        },
        {
          path: '500',
          element: <MaintenanceError500 />
        },
        {
          path: 'under-construction',
          element: <MaintenanceUnderConstruction />
        },
        {
          path: 'coming-soon',
          element: <MaintenanceComingSoon />
        }
      ]
    }
  ]
};

export default MainRoutes;
