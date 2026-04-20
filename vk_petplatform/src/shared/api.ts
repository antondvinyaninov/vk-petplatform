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

/**
 * Создает новое объявление в базе данных
 */
export const createAd = async (text: string) => {
  try {
    const search = window.location.search;
    
    // Формируем заголовок из первых 50 символов
    const title = text.length > 50 ? text.substring(0, 47) + '...' : text;

    const response = await fetch(`${API_URL}/ads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vk-sign': search.slice(1),
      },
      body: JSON.stringify({
        title,
        description: text,
        type: 'LOST', // По умолчанию для упрощенной формы
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create ad');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create ad:', error);
    throw error;
  }
};
