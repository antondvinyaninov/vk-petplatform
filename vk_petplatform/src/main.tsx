import { createRoot } from 'react-dom/client';
import vkBridgeModule from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig.tsx';

// Vite ESM vs CJS interop fix
const vkBridge = (vkBridgeModule && 'send' in vkBridgeModule) 
  ? vkBridgeModule 
  : (vkBridgeModule as any).default;

vkBridge.send('VKWebAppInit');

createRoot(document.getElementById('root')!).render(<AppConfig />);

if (import.meta.env.MODE === 'development') {
  import('./eruda.ts');
}
