import { z } from 'zod';

/**
 * Zod-схема для метрик аккаунта (Insights).
 * Источник: Graph API insights edge + instagrapi insights
 */
export const AccountInsightSchema = z.object({
  name: z.string(),
  period: z.string(),
  values: z.array(
    z.object({
      value: z.number().optional().nullable(),
      end_time: z.string().optional(),
      max_value: z.number().optional().nullable(),
    }),
  ),
  title: z.string(),
  description: z.string(),
  id: z.string().or(z.number()),
});

export type AccountInsight = z.infer<typeof AccountInsightSchema>;

/**
 * Сводные метрики аккаунта
 */
export const AccountMetricsSchema = z.object({
  follower_count: z.number().optional(),
  following_count: z.number().optional(),
  media_count: z.number().optional(),
  impressions: z.number().optional(),
  reach: z.number().optional(),
  profile_views: z.number().optional(),
  website_clicks: z.number().optional(),
  email_contacts: z.number().optional(),
  phone_call_clicks: z.number().optional(),
  text_message_clicks: z.number().optional(),
  get_directions_clicks: z.number().optional(),
  engagement: z.number().optional(),
  saves: z.number().optional(),
  video_views: z.number().optional(),
  accounts_engaged: z.number().optional(),
  accounts_reached: z.number().optional(),
  accounts_impressed: z.number().optional(),
  total_interactions: z.number().optional(),
  follower_demographics: z
    .object({
      age_gender: z
        .array(
          z.object({
            age_range: z.string(),
            male: z.number().optional(),
            female: z.number().optional(),
            other: z.number().optional(),
          }),
        )
        .optional(),
      top_cities: z
        .array(
          z.object({
            city: z.string(),
            count: z.number(),
          }),
        )
        .optional(),
      top_countries: z
        .array(
          z.object({
            country: z.string(),
            count: z.number(),
          }),
        )
        .optional(),
    })
    .optional(),
  period: z.string().optional(),
  since: z.string().optional(),
  until: z.string().optional(),
});

export type AccountMetrics = z.infer<typeof AccountMetricsSchema>;

/**
 * Метрики медиа-поста
 */
export const MediaInsightSchema = z.object({
  media_id: z.number().or(z.string()),
  impressions: z.number().optional(),
  reach: z.number().optional(),
  engagement: z.number().optional(),
  saved: z.number().optional(),
  likes: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  profile_visits: z.number().optional(),
  follows: z.number().optional(),
  video_views: z.number().optional(),
  video_avg_watch_time: z.number().optional(),
  video_plays: z.number().optional(),
  accounts_engaged: z.number().optional(),
  accounts_reached: z.number().optional(),
  accounts_impressed: z.number().optional(),
  total_interactions: z.number().optional(),
  discovery: z
    .object({
      from_hashtags: z.number().optional(),
      from_explore: z.number().optional(),
      from_home: z.number().optional(),
      from_profile: z.number().optional(),
      from_other: z.number().optional(),
    })
    .optional(),
  audience: z
    .object({
      followers: z.number().optional(),
      non_followers: z.number().optional(),
    })
    .optional(),
  period: z.string().optional(),
  since: z.string().optional(),
  until: z.string().optional(),
});

export type MediaInsight = z.infer<typeof MediaInsightSchema>;

/**
 * Story insights
 */
export const StoryInsightSchema = z.object({
  story_id: z.number().or(z.string()),
  impressions: z.number().optional(),
  reach: z.number().optional(),
  replies: z.number().optional(),
  shares: z.number().optional(),
  sticker_taps: z.number().optional(),
  link_clicks: z.number().optional(),
  navigation_forward: z.number().optional(),
  navigation_back: z.number().optional(),
  navigation_exit: z.number().optional(),
  completion_rate: z.number().optional(),
  accounts_reached: z.number().optional(),
  accounts_impressed: z.number().optional(),
  period: z.string().optional(),
});

export type StoryInsight = z.infer<typeof StoryInsightSchema>;

/**
 * Reels insights
 */
export const ReelsInsightSchema = z.object({
  reel_id: z.number().or(z.string()),
  plays: z.number().optional(),
  accounts_reached: z.number().optional(),
  accounts_impressed: z.number().optional(),
  total_interactions: z.number().optional(),
  likes: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  saves: z.number().optional(),
  video_views: z.number().optional(),
  avg_watch_time: z.number().optional(),
  completion_rate: z.number().optional(),
  replay_count: z.number().optional(),
  period: z.string().optional(),
});

export type ReelsInsight = z.infer<typeof ReelsInsightSchema>;
