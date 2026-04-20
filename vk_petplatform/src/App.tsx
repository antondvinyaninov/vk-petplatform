import { useState, useEffect, ReactNode, lazy, Suspense } from 'react';
import bridgeModule, { UserInfo } from '@vkontakte/vk-bridge';
import { View, SplitLayout, SplitCol, ScreenSpinner } from '@vkontakte/vkui';

const bridge = (bridgeModule && 'send' in bridgeModule) 
  ? bridgeModule 
  : (bridgeModule as any).default;
import { DEFAULT_VIEW_PANELS } from './routes';
import { useActiveVkuiLocation, useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

const Home = lazy(() => import('./panels/Home').then(m => ({ default: m.Home })));
const Persik = lazy(() => import('./panels/Persik').then(m => ({ default: m.Persik })));
const Onboarding = lazy(() => import('./panels/Onboarding').then(m => ({ default: m.Onboarding })));

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();
  const routeNavigator = useRouteNavigator();
  const [fetchedUser, setUser] = useState<UserInfo | undefined>();
  const [popout, setPopout] = useState<ReactNode | null>(null);

  useEffect(() => {
    // Проверка контекста запуска: вне сообщества редиректим на лендинг
    const params = new URLSearchParams(window.location.search);
    const hasGroupId = params.has('vk_group_id');
    
    if (!hasGroupId && activePanel !== DEFAULT_VIEW_PANELS.ONBOARDING) {
      routeNavigator.replace('/onboarding');
    }

    async function fetchData() {
      try {
        const user = await bridge.send('VKWebAppGetUserInfo');
        setUser(user);
      } catch (e) {
        console.error('Failed to fetch user', e);
      } finally {
        setPopout(null);
      }
    }
    fetchData();
  }, [activePanel, routeNavigator]);

  return (
    <>
      <SplitLayout>
        <SplitCol>
          <Suspense fallback={popout || <ScreenSpinner />}>
            <View activePanel={activePanel}>
              <Onboarding id="onboarding" />
              <Home id="home" fetchedUser={fetchedUser} />
              <Persik id="persik" />
            </View>
          </Suspense>
        </SplitCol>
      </SplitLayout>
      {popout}
    </>
  );
};
