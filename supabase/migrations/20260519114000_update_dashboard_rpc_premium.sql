-- Update get_dashboard_stats to select is_premium and premium_until fields from profiles
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'profiles', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'full_name', full_name,
          'avatar_url', avatar_url,
          'birth_date', birth_date,
          'gender', gender,
          'location_city', location_city,
          'created_at', created_at,
          'is_premium', is_premium,
          'premium_until', premium_until
        )
      ) FROM profiles
    ),
    'matches', (
      SELECT json_agg(
        json_build_object(
          'user1_id', user1_id,
          'user2_id', user2_id
        )
      ) FROM matches
    ),
    'swipes', (
      SELECT json_agg(
        json_build_object(
          'swiper_id', swiper_id,
          'swiped_id', swiped_id,
          'type', type
        )
      ) FROM swipes
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;
NOTIFY pgrst, 'reload schema';
