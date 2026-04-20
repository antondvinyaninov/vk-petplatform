import { UserInfo } from '@vkontakte/vk-bridge';

const API_URL = '/api';

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

/**
 * Получает список всех активных объявлений
 */
export const getAllAds = async () => {
  try {
    const search = window.location.search;
    const response = await fetch(`${API_URL}/ads`, {
      headers: {
        'x-vk-sign': search.slice(1),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ads: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch global ads:', error);
    return [];
  }
};

/**
 * Получает детали объявления по ID
 */
export const getAdById = async (id: string | number) => {
  try {
    const search = window.location.search;
    const response = await fetch(`${API_URL}/ads/${id}`, {
      headers: {
        'x-vk-sign': search.slice(1),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ad detail: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ad ${id}:`, error);
    return null;
  }
};
