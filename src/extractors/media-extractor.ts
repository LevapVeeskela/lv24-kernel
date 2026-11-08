import { Media, MediaSchema } from '../models/media.js';
import { IResult, Result } from '../result/result.js';

/**
 * Экстрактор для преобразования raw JSON в типизированную модель Media.
 */
export class MediaExtractor {
  /**
   * Извлекает модель Media из raw JSON ответа Instagram.
   *
   * @param data - Raw JSON от Instagram API
   * @returns IResult<Media> - типизированный результат
   */
  static extract(data: unknown): IResult<Media> {
    try {
      const media = MediaSchema.parse(data);
      return Result.success(media);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown extraction error';
      return Result.fail<Media>(`Failed to extract media: ${message}`, undefined, undefined, error instanceof Error ? error : new Error(message));
    }
  }

  /**
   * Извлекает массив медиа из raw JSON.
   *
   * @param data - Raw JSON (массив или объект с items/media полем)
   * @returns IResult<Media[]> - массив типизированных медиа
   */
  static extractMany(data: unknown): IResult<Media[]> {
    try {
      let mediaData: unknown[];

      if (Array.isArray(data)) {
        mediaData = data;
      } else if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.items)) {
          mediaData = obj.items;
        } else if (Array.isArray(obj.media)) {
          mediaData = obj.media;
        } else if (Array.isArray(obj.carousel_media)) {
          mediaData = obj.carousel_media;
        } else if (Array.isArray(obj.xma_clip)) {
          // Поддержка xma_clip item_types (instagrapi #2342)
          mediaData = obj.xma_clip;
        } else {
          return Result.fail('Invalid data format: expected array or object with items/media/carousel_media/xma_clip field', undefined, []);
        }
      } else {
        return Result.fail('Invalid data format: expected array or object', undefined, []);
      }

      const media: Media[] = [];
      for (const mediaDatum of mediaData) {
        const result = this.extract(mediaDatum);
        if (result.succeeded) {
          media.push(result.value);
        }
      }

      return Result.success(media);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown extraction error';
      return Result.fail(`Failed to extract media: ${message}`, undefined, [], error instanceof Error ? error : new Error(message));
    }
  }

  /**
   * Извлекает краткую информацию о медиа (только основные поля).
   *
   * @param data - Raw JSON
   * @returns IResult<Partial<Media>> - частичная модель медиа
   */
  static extractBrief(data: unknown): IResult<Partial<Media>> {
    try {
      const media = MediaSchema.parse(data);
      const brief: Partial<Media> = {
        pk: media.pk,
        id: media.id,
        code: media.code,
        media_type: media.media_type,
        like_count: media.like_count,
        comment_count: media.comment_count,
        taken_at: media.taken_at,
        user: media.user,
        image_versions2: media.image_versions2,
      };
      return Result.success(brief);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown extraction error';
      return Result.fail(`Failed to extract brief media: ${message}`, undefined, {} as Partial<Media>, error instanceof Error ? error : new Error(message));
    }
  }

  /**
   * Извлекает информацию о carousel media (альбом).
   *
   * @param data - Raw JSON carousel media
   * @returns IResult<Media[]> - массив медиа из альбома
   */
  static extractCarousel(data: unknown): IResult<Media[]> {
    try {
      const media = MediaSchema.parse(data);
      if (!media.carousel_media || media.carousel_media.length === 0) {
        return Result.fail('No carousel media found', undefined, []);
      }
      return Result.success(media.carousel_media);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown extraction error';
      return Result.fail(`Failed to extract carousel media: ${message}`, undefined, [], error instanceof Error ? error : new Error(message));
    }
  }
}
