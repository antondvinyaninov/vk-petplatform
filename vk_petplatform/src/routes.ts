import {
  createHashRouter,
  createPanel,
  createRoot,
  createView,
  RoutesConfig,
} from '@vkontakte/vk-mini-apps-router';

export const DEFAULT_ROOT = 'default_root';

export const DEFAULT_VIEW = 'default_view';

export const DEFAULT_VIEW_PANELS = {
  HOME: 'home',
  PERSIK: 'persik',
  ONBOARDING: 'onboarding',
  PROFILE: 'profile',
  MY_ADS: 'my_ads',
} as const;

export const routes = RoutesConfig.create([
  createRoot(DEFAULT_ROOT, [
    createView(DEFAULT_VIEW, [
      createPanel(DEFAULT_VIEW_PANELS.HOME, '/', []),
      createPanel(DEFAULT_VIEW_PANELS.PERSIK, `/${DEFAULT_VIEW_PANELS.PERSIK}`, []),
      createPanel(DEFAULT_VIEW_PANELS.ONBOARDING, `/${DEFAULT_VIEW_PANELS.ONBOARDING}`, []),
      createPanel(DEFAULT_VIEW_PANELS.PROFILE, `/${DEFAULT_VIEW_PANELS.PROFILE}`, []),
      createPanel(DEFAULT_VIEW_PANELS.MY_ADS, `/${DEFAULT_VIEW_PANELS.MY_ADS}`, []),
    ]),
  ]),
]);

export const router = createHashRouter(routes.getRoutes());
