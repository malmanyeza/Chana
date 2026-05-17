-- 1. Add location columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- 2. Add premium and swipe limit columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS swipes_remaining INTEGER DEFAULT 20; -- Default of 20 free swipes per day
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_swipe_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create the get_discovery_profiles RPC function for proximity filtering and sorting
CREATE OR REPLACE FUNCTION get_discovery_profiles(
  swiper_id UUID,
  swiper_lat NUMERIC,
  swiper_lng NUMERIC,
  gender_filter TEXT,
  min_age INT,
  max_age INT,
  max_dist_km NUMERIC DEFAULT 100.0
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  birth_date DATE,
  gender TEXT,
  bio TEXT,
  interests TEXT[],
  photos TEXT[],
  preferences JSONB,
  location_city TEXT,
  country TEXT,
  is_onboarded BOOLEAN,
  distance_km DOUBLE PRECISION
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.birth_date,
    p.gender,
    p.bio,
    p.interests,
    p.photos,
    p.preferences,
    p.location_city,
    p.country,
    p.is_onboarded,
    -- Haversine formula to compute distance in km
    (6371 * acos(
      least(1.0, greatest(-1.0, 
        cos(radians(swiper_lat)) * cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians(swiper_lng)) + 
        sin(radians(swiper_lat)) * sin(radians(p.latitude))
      ))
    ))::DOUBLE PRECISION AS distance_km
  FROM profiles p
  WHERE p.is_onboarded = TRUE
    AND p.id != swiper_id
    -- Exclude profiles already swiped by this swiper
    AND p.id NOT IN (
      SELECT s.swiped_id 
      FROM swipes s 
      WHERE s.swiper_id = get_discovery_profiles.swiper_id
    )
    -- Filter by gender
    AND (
      gender_filter = 'everyone' OR
      (gender_filter = 'men' AND p.gender = 'man') OR
      (gender_filter = 'women' AND p.gender = 'woman')
    )
    -- Filter by age range
    AND (
      p.birth_date IS NOT NULL AND 
      (date_part('year', age(p.birth_date)) >= min_age) AND 
      (date_part('year', age(p.birth_date)) <= max_age)
    )
    -- Filter by distance if coordinates exist
    AND (
      p.latitude IS NULL OR p.longitude IS NULL OR 
      (6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(swiper_lat)) * cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(swiper_lng)) + 
          sin(radians(swiper_lat)) * sin(radians(p.latitude))
        ))
      )) <= max_dist_km
    )
  ORDER BY 
    CASE WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
      (6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(swiper_lat)) * cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(swiper_lng)) + 
          sin(radians(swiper_lat)) * sin(radians(p.latitude))
        ))
      ))
    ELSE
      99999.0
    END ASC
  LIMIT 20;
END;
$$;
