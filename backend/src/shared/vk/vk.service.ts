import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';
import { logger } from '../logger';

export class VKService {
  private static readonly API_VERSION = '5.199';

  static async callMethod(method: string, params: any, accessToken: string) {
    try {
      const response = await axios.get(`https://api.vk.com/method/${method}`, {
        params: {
          ...params,
          access_token: accessToken,
          v: this.API_VERSION,
        },
      });

      if (response.data.error) {
        logger.error({ error: response.data.error, method }, 'VK API Error');
        throw new Error(`VK API Error: ${response.data.error.error_msg}`);
      }

      return response.data.response;
    } catch (error) {
      logger.error({ error, method }, 'VK Request Failed');
      throw error;
    }
  }

  static async uploadPhotoToWall(groupId: string, photoUrl: string, accessToken: string) {
    try {
      // 1. Get upload server
      const { upload_url } = await this.callMethod('photos.getWallUploadServer', {
        group_id: Math.abs(Number(groupId)),
      }, accessToken);

      // 2. Download photo
      const photoResponse = await axios.get(photoUrl, { responseType: 'arraybuffer' });
      
      // 3. Upload to VK
      const form = new FormData();
      form.append('photo', Buffer.from(photoResponse.data), { filename: 'photo.jpg' });
      
      const uploadResponse = await axios.post(upload_url, form, {
        headers: form.getHeaders(),
      });

      // 4. Save photo
      const savedPhotos = await this.callMethod('photos.saveWallPhoto', {
        group_id: Math.abs(Number(groupId)),
        ...uploadResponse.data,
      }, accessToken);

      return savedPhotos[0];
    } catch (error) {
      logger.error({ error, photoUrl }, 'Failed to upload photo to VK');
      return null;
    }
  }

  static async publishToCommunityWall(ad: any, accessToken: string) {
    try {
      const groupId = ad.vkGroupId.toString();
      const ownerId = -Math.abs(Number(groupId)); // Must be negative for groups
      
      let message = `📢 ${ad.type === 'LOST' ? 'ПРОПАЛ ПИТОМЕЦ' : ad.type === 'FOUND' ? 'НАЙДЕН ПИТОМЕЦ' : 'ПРИСТРОЙСТВО'}\n\n`;
      message += `🐾 ${ad.title}\n\n`;
      message += `${ad.description}\n\n`;
      message += `🔗 Посмотреть подробнее и связаться: https://vk.com/app${config.vk.appId}#ad_${ad.id}`;

      const attachments: string[] = [];
      
      // Handle photo
      if (ad.photoUrl) {
        const photo = await this.uploadPhotoToWall(groupId, ad.photoUrl, accessToken);
        if (photo) {
          attachments.push(`photo${photo.owner_id}_${photo.id}`);
        }
      }

      const params: any = {
        owner_id: ownerId,
        from_group: 1,
        message,
        attachments: attachments.join(','),
      };

      if (ad.scheduledAt) {
        params.publish_date = Math.floor(new Date(ad.scheduledAt).getTime() / 1000);
      }

      const result = await this.callMethod('wall.post', params, accessToken);
      return result.post_id;
    } catch (error) {
      logger.error({ error, adId: ad.id }, 'Failed to publish to community wall');
      throw error;
    }
  }
}
