import { useState, useEffect, ReactNode, lazy, Suspense } from 'react';
import bridgeModule, { UserInfo } from '@vkontakte/vk-bridge';
import { View, SplitLayout, SplitCol, ScreenSpinner } from '@vkontakte/vkui';

const bridge = (bridgeModule && 'send' in bridgeModule) 
  ? bridgeModule 
  : (bridgeModule as any).default;
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';

import { DEFAULT_VIEW_PANELS } from './routes';

const Home = lazy(() => import('./panels/Home').then(m => ({ default: m.Home })));
const Persik = lazy(() => import('./panels/Persik').then(m => ({ default: m.Persik })));

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();
  const [fetchedUser, setUser] = useState<UserInfo | undefined>();
  const [popout, setPopout] = useState<ReactNode | null>(<ScreenSpinner />);

  useEffect(() => {
    async function fetchData() {
      const user = await bridge.send('VKWebAppGetUserInfo');
      setUser(user);
      setPopout(null);
    }
    fetchData();
  }, []);

  return (
    <>
      <SplitLayout>
        <SplitCol>
          <View activePanel={activePanel}>
            <Suspense fallback={<ScreenSpinner />}>
              <Home id="home" fetchedUser={fetchedUser} />
            </Suspense>
            <Suspense fallback={<ScreenSpinner />}>
              <Persik id="persik" />
            </Suspense>
          </View>
        </SplitCol>
      </SplitLayout>
      {popout}
    </>
  );
};
