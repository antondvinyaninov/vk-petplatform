import { UserInfo } from '@vkontakte/vk-bridge';

const API_URL = 'http://localhost:3000/api';

/**
 * Синхронизирует данные пользователя VK с нашим бэкендом
 */
export const syncUserWithBackend = async (user: UserInfo) => {
  try {
    const search = window.location.search;
    const params = new URLSearchParams();
    
    params.append('firstName', user.first_name);
    params.append('lastName', user.last_name);
    params.append('photo200', user.photo_200);
    if (user.city?.title) {
      params.append('cityTitle', user.city.title);
    }

    const response = await fetch(`${API_URL}/users/me?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-vk-sign': search.slice(1), // Отправляем параметры запуска без знака '?'
      },
    });

    if (!response.ok) {
      throw new Error(`Sync failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('User synced successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to sync user with backend:', error);
    return null;
  }
};
