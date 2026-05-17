-- Create a function to get dashboard stats that bypasses RLS
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
          'created_at', created_at
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

-- Grant access to the anonymous user so the dashboard can call it
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;

-- Force Supabase PostgREST to reload the schema cache so the new function is immediately available
NOTIFY pgrst, 'reload schema';
