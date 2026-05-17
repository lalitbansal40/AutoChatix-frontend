import { useRoutes } from 'react-router-dom';
import { lazy } from 'react';
import Loadable from 'components/Loadable';

// project import
import LoginRoutes from './LoginRoutes';
import MainRoutes from './MainRoutes';

// Meta OAuth callback — no auth guard (works for both logged-in and guest users)
const MetaCallback = Loadable(lazy(() => import('pages/auth/meta-callback')));

// ==============================|| ROUTING RENDER ||============================== //

export default function ThemeRoutes() {
  return useRoutes([
    LoginRoutes,
    MainRoutes,
    {
      path: '/auth/meta/callback',
      element: <MetaCallback />,
    },
  ]);
}
