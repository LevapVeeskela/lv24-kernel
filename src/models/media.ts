import { z } from 'zod';
import { UserSchema } from './user.js';

/**
 * Schema для базового изображения
 */
export const ImageVersionSchema = z.object({
  width: z.number(),
  height: z.number(),
  url: z.string().url(),
  scans_profile: z.string().optional(),
  estimated_duration: z.number().optional(),
  blend_duration: z.number().optional(),
  transparency_profile: z.string().optional(),
  is_hvdc: z.boolean().optional(),
  is_reuse_allowed: z.boolean().optional(),
});

export type ImageVersion = z.infer<typeof ImageVersionSchema>;

/**
 * Schema для видео версии
 */
export const VideoVersionSchema = z.object({
  type: z.number().optional(),
  width: z.number(),
  height: z.number(),
  url: z.string().url(),
  id: z.string().optional(),
  num_of_frames: z.number().optional(),
  duration: z.number().optional(),
  max_num_visible_frames: z.number().optional(),
  progressive_download_url: z.string().url().optional(),
  dash_manifest: z.string().optional(),
  has_audio: z.boolean().optional(),
  video_codec: z.string().optional(),
  file_size: z.number().optional(),
  play_count: z.number().optional(),
  download_url: z.string().url().optional(),
});

export type VideoVersion = z.infer<typeof VideoVersionSchema>;

/**
 * Schema для изображения кандидата (carousel media)
 */
export const CandidateSchema = z.object({
  width: z.number(),
  height: z.number(),
  url: z.string().url(),
  scans_profile: z.string().optional(),
});

export type Candidate = z.infer<typeof CandidateSchema>;

/**
 * Schema для изображения с несколькими кандидатами
 */
export const ImageVersions2Schema = z.object({
  candidates: z.array(CandidateSchema),
});

export type ImageVersions2 = z.infer<typeof ImageVersions2Schema>;

/**
 * Schema для комментария (forward reference для избежания циклической зависимости)
 */
const CommentBriefSchema = z.object({
  pk: z.number().or(z.string()),
  user_id: z.number().or(z.string()),
  text: z.string(),
  type: z.number().optional(),
  created_at: z.number(),
  created_at_utc: z.number(),
  content_type: z.string(),
  status: z.string(),
  user: UserSchema.optional(),
  media_id: z.number().or(z.string()),
});

/**
 * Schema для базовой медиа-записи
 * Источник: instagrapi Media model + instagram-private-api Media entity
 */
const MediaBaseSchema = z.object({
  taken_at: z.number(),
  pk: z.number().or(z.string()).transform((val) =>
    typeof val === 'string' ? BigInt(val) : BigInt(val),
  ),
  id: z.string(),
  device_timestamp: z.number().or(z.string()).optional(),
  client_cache_key: z.string().optional(),
  filter_type: z.number().optional(),
  caption_is_edited: z.boolean().optional(),
  like_and_view_counts_disabled: z.boolean().optional(),
  is_reshare_of_text_post_app_media_in_ig: z.boolean().optional(),
  is_post_live_clips_media: z.boolean().optional(),
  deleted_reason: z.number().optional(),
  integrity_review_decision: z.string().optional(),
  has_shared_to_fb: z.number().optional(),
  is_unified_video: z.boolean().optional(),
  should_request_ads: z.boolean().optional(),
  is_visual_reply_commenter_notice_enabled: z.boolean().optional(),
  commerciality_status: z.string().optional(),
  explore_hide_comments: z.boolean().optional(),
  shop_routing_user_id: z.string().optional().nullable(),
  can_see_insights_as_brand: z.boolean().optional(),
  is_organic_product_tagging_eligible: z.boolean().optional(),
  has_liked: z.boolean().optional(),
  like_count: z.number().optional(),
  image_versions2: ImageVersions2Schema.optional(),
  original_width: z.number().optional(),
  original_height: z.number().optional(),
  video_versions: z.array(VideoVersionSchema).optional(),
  video_duration: z.number().optional(),
  view_count: z.number().optional(),
  play_count: z.number().optional(),
  has_audio: z.boolean().optional(),
  video_codec: z.string().optional(),
  number_of_qualities: z.number().optional(),
  video_dash_manifest: z.string().optional(),
  video_url: z.string().url().optional(),
  media_type: z.number(),
  code: z.string().optional(),
  caption: z
    .object({
      pk: z.number().or(z.string()),
      user_id: z.number().or(z.string()),
      text: z.string(),
      type: z.number(),
      created_at: z.number(),
      created_at_utc: z.number(),
      content_type: z.string(),
      status: z.string(),
      bit_flags: z.number().optional(),
      did_report_as_spam: z.boolean().optional(),
      share_enabled: z.boolean().optional(),
      user: UserSchema.optional(),
      is_covered: z.boolean().optional(),
      is_ranked_comment: z.boolean().optional(),
      media_id: z.number().or(z.string()),
      has_translation: z.boolean().optional(),
      private_reply_status: z.number().optional(),
    })
    .optional()
    .nullable(),
  caption_position: z.number().optional(),
  is_dash_eligible: z.number().optional(),
  video_dash_manifest_url: z.string().optional(),
  comment_likes_enabled: z.boolean().optional(),
  comment_threading_enabled: z.boolean().optional(),
  max_num_visible_preview_comments: z.number().optional(),
  has_more_comments: z.boolean().optional(),
  preview_comments: z.array(CommentBriefSchema).optional(),
  comments: z.array(CommentBriefSchema).optional(),
  comment_count: z.number().optional(),
  can_view_more_preview_comments: z.boolean().optional(),
  hide_view_all_comment_entrypoint: z.boolean().optional(),
  photo_of_you: z.boolean().optional(),
  can_see_insights: z.boolean().optional(),
  user: UserSchema.optional(),
  can_viewer_reshare: z.boolean().optional(),
  can_viewer_save: z.boolean().optional(),
  is_in_profile_grid: z.boolean().optional(),
  profile_grid_control_enabled: z.boolean().optional(),
  featured_products: z.array(z.unknown()).optional(),
  is_comments_gif_composer_enabled: z.boolean().optional(),
  product_suggestions: z.array(z.unknown()).optional(),
  organic_tracking_token: z.string().optional(),
  sharing_friction_info: z
    .object({
      should_have_sharing_friction: z.boolean(),
      bloks_app_url: z.string().optional().nullable(),
      sharing_friction_payload: z.string().optional().nullable(),
    })
    .optional(),
  can_reshare: z.boolean().optional(),
  can_save: z.boolean().optional(),
  is_saved: z.boolean().optional(),
  is_pride_media: z.boolean().optional(),
  usertags: z
    .object({
      in: z.array(
        z.object({
          user: UserSchema,
          position: z.array(z.number()),
          start_time_in_video_in_sec: z.number().optional(),
          duration_in_video_in_sec: z.number().optional(),
        }),
      ),
    })
    .optional(),
  location: z
    .object({
      pk: z.number(),
      short_name: z.string(),
      facebook_places_id: z.number().optional(),
      external_source: z.string(),
      name: z.string(),
      address: z.string().optional(),
      city: z.string().optional(),
      has_viewer_saved: z.boolean().optional(),
      lng: z.number().optional(),
      lat: z.number().optional(),
      is_eligible_for_guides: z.boolean().optional(),
    })
    .optional()
    .nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  carousel_media_count: z.number().optional(),
  is_paid_partnership: z.boolean().optional(),
  music_metadata: z
    .object({
      music_canonical_id: z.string().optional(),
      audio_type: z.string().optional(),
      music_info: z.unknown().optional(),
      original_sound_info: z.unknown().optional(),
      pinned_media_ids: z.array(z.string()).optional(),
    })
    .optional()
    .nullable(),
  social_context: z.array(z.unknown()).optional(),
  is_artist_pick: z.boolean().optional(),
  enable_media_notes_production: z.boolean().optional(),
  product_type: z.string().optional(),
  clips_metadata: z.unknown().optional(),
  media_cropping_info: z
    .object({
      square_crop: z
        .object({
          crop_left: z.number(),
          crop_right: z.number(),
          crop_top: z.number(),
          crop_bottom: z.number(),
        })
        .optional(),
    })
    .optional(),
  owner: UserSchema.optional(),
  accessibility_caption: z.string().optional(),
  is_quiet_post: z.boolean().optional(),
  mezql_token: z.string().optional(),
  logging_info_token: z.string().optional(),
  media_notes: z
    .object({
      items: z.array(z.unknown()),
    })
    .optional(),
  has_delayed_metadata: z.boolean().optional(),
  comment_inform_treatment: z
    .object({
      should_have_inform_treatment: z.boolean(),
      text: z.string(),
      url: z.string().optional(),
      action_type: z.string().optional(),
    })
    .optional(),
  is_cutout_sticker_allowed: z.boolean().optional(),
  enable_waist: z.boolean().optional(),
  is_fan_club_promo_media: z.boolean().optional(),
});

type MediaBase = z.infer<typeof MediaBaseSchema>;

/**
 * Рекурсивный тип медиа: carousel_media ссылается на Media.
 * Явный интерфейс + аннотация z.ZodType разрывают цикл вывода типов
 * (TS7022/TS7024) — схема остаётся lazy, infer сохраняется.
 */
export interface Media extends MediaBase {
  carousel_media?: Media[];
}

export const MediaSchema: z.ZodType<Media> = z.lazy((): z.ZodType<Media> =>
  MediaBaseSchema.extend({
    carousel_media: z.array(MediaSchema).optional(),
  }),
);
