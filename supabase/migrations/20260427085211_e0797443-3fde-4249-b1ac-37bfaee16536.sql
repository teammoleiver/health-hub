-- Replace the partial post URL index with a full unique index so API upserts can target it reliably.
DROP INDEX IF EXISTS public.social_posts_user_url_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS social_posts_user_url_uniq
  ON public.social_posts (user_id, post_url);