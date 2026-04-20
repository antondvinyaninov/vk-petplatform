import { createRoot } from 'react-dom/client';
import vkBridgeModule from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig.tsx';

// Vite ESM vs CJS interop fix
const vkBridge = (vkBridgeModule && 'send' in vkBridgeModule) 
  ? vkBridgeModule 
  : (vkBridgeModule as any).default;

vkBridge.send('VKWebAppInit');

// Проверка версии кода
alert('PetPlatform: V2 Debug - Check 1');

// Пытаемся загрузить консоль без ожидания
import('./eruda.ts').catch(err => console.error('Eruda load failed', err));

createRoot(document.getElementById('root')!).render(<AppConfig />);

if (import.meta.env.MODE === 'development') {
  import('./eruda.ts');
}
