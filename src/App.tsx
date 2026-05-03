// project import
import Routes from 'routes';
import ThemeCustomization from 'themes';
import Locales from 'components/Locales';
// import RTLLayout from 'components/RTLLayout';
import ScrollTop from 'components/ScrollTop';
import Notistack from 'components/third-party/Notistack';
import 'react-phone-input-2/lib/style.css';
// auth-provider
import { JWTProvider as AuthProvider } from 'contexts/JWTContext';
import { WebSocketProvider } from 'contexts/WebSocketContext';

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

const App = () => (
  <ThemeCustomization>
    {/* <RTLLayout> */}
    <Locales>
      <ScrollTop>
        <AuthProvider>
          <WebSocketProvider>
            <Notistack>
              <Routes />
            </Notistack>
          </WebSocketProvider>
        </AuthProvider>
      </ScrollTop>
    </Locales>
    {/* </RTLLayout> */}
  </ThemeCustomization>
);

export default App;
