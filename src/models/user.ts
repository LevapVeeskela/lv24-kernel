import { z } from 'zod';

/**
 * Zod-схема для модели пользователя Instagram.
 * Источник: instagrapi User model + instagram-private-api User entity
 */
export const UserSchema = z.object({
  pk: z.number().or(z.string()).transform((val) =>
    typeof val === 'string' ? BigInt(val) : BigInt(val),
  ),
  username: z.string(),
  full_name: z.string().optional().nullable(),
  is_private: z.boolean().optional().default(false),
  profile_pic_url: z.string().url().optional().nullable(),
  profile_pic_url_hd: z.string().url().optional().nullable(),
  is_verified: z.boolean().optional().default(false),
  media_count: z.number().optional(),
  follower_count: z.number().optional(),
  following_count: z.number().optional(),
  biography: z.string().optional().nullable(),
  external_url: z.string().url().optional().nullable(),
  account_type: z.number().optional(),
  is_business: z.boolean().optional(),
  public_email: z.string().optional().nullable(),
  contact_phone_number: z.string().optional().nullable(),
  public_phone_country_code: z.string().optional().nullable(),
  public_phone_number: z.string().optional().nullable(),
  business_contact_method: z.string().optional(),
  business_category_name: z.string().optional(),
  category_name: z.string().optional(),
  category: z.string().optional(),
  address_street: z.string().optional().nullable(),
  city_id: z.union([z.number(), z.string()]).optional().nullable(),
  city_name: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  zip: z.string().optional().nullable(),
  instagram_location_id: z.string().optional().nullable(),
  interop_messaging_user_fbid: z.union([z.number(), z.string()]).optional().nullable(),
  has_anonymous_profile_picture: z.boolean().optional(),
  has_highlight_reels: z.boolean().optional(),
  has_guides: z.boolean().optional(),
  is_favorite: z.boolean().optional(),
  is_interest_account: z.boolean().optional(),
  has_chaining: z.boolean().optional(),
  hd_profile_pic_versions: z
    .array(
      z.object({
        width: z.number(),
        height: z.number(),
        url: z.string().url(),
      }),
    )
    .optional(),
  hd_profile_pic_url_info: z
    .object({
      url: z.string().url(),
      width: z.number(),
      height: z.number(),
    })
    .optional()
    .nullable(),
  mutual_followers_count: z.number().optional(),
  profile_context: z.string().optional(),
  profile_context_links_with_user_ids: z
    .array(
      z.object({
        username: z.string().optional(),
        user_id: z.number().or(z.string()).optional(),
      }),
    )
    .optional(),
  latest_reel_media: z.number().optional(),
  is_call_to_action_enabled: z.boolean().optional(),
  total_igtv_videos: z.number().optional(),
  total_clips_count: z.number().optional(),
  has_videos: z.boolean().optional(),
  total_ar_effects: z.number().optional(),
  usertags_count: z.number().optional(),
  is_eligible_for_smb_support_flow: z.boolean().optional(),
  is_eligible_for_lead_center: z.boolean().optional(),
  account_badges: z.array(z.string()).optional().default([]),
  fbid_v2: z.string().optional(),
  is_hide_more_comment_enabled: z.boolean().optional(),
  show_account_transparency_details: z.boolean().optional(),
  third_party_downloads_enabled: z.number().optional(),
  // Расширенные данные для статистики
  bio_links: z.array(z.object({
    link_type: z.string().optional(),
    url: z.string().optional(),
    title: z.string().optional(),
    lynx_url: z.string().optional(),
    link_id: z.string().optional(),
  })).optional(),
  can_hide_category: z.boolean().optional(),
  can_hide_public_contacts: z.boolean().optional(),
  should_show_category: z.boolean().optional(),
  should_show_public_contacts: z.boolean().optional(),
  is_category_tappable: z.boolean().optional(),
  is_eligible_for_request_message: z.boolean().optional(),
  is_potential_business: z.boolean().optional(),
  page_id: z.string().optional().nullable(),
  page_name: z.string().optional().nullable(),
  ads_page_id: z.string().optional().nullable(),
  ads_page_name: z.string().optional().nullable(),
  // Бизнес контакты (уже определены выше)
  // public_email, public_phone_number, public_phone_country_code,
  // contact_phone_number, business_contact_method
  whatsapp_number: z.string().optional().nullable(),
  direct_messaging: z.string().optional(),
  fb_page_call_to_action_id: z.string().optional(),
  fb_page_call_to_action_ix_url: z.string().optional(),
  fb_page_call_to_action_ix_label_bundle: z.object({
    label: z.string().optional(),
    action: z.string().optional(),
  }).optional().nullable(),
  // Адрес уже определён выше
  // address_street, city_id, city_name, latitude, longitude, zip, instagram_location_id
  // Дополнительные поля местоположения
  region_name: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  country_name: z.string().optional().nullable(),
  // Дополнительные бизнес данные
  num_of_admined_pages: z.number().optional().nullable(),
  can_use_affiliate_partnership_messaging_as_creator: z.boolean().optional(),
  can_use_affiliate_partnership_messaging_as_brand: z.boolean().optional(),
  has_public_tab_threads: z.boolean().optional(),
  show_insights_terms: z.boolean().optional(),
  allowed_commenter_type: z.string().optional(),
  is_guardian_of_viewer: z.boolean().optional(),
  is_supervised_by_viewer: z.boolean().optional(),
  is_supervision_enabled: z.boolean().optional(),
  guardian_id: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
