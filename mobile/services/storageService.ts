import { supabase } from '../lib/supabase';

const BUCKET = 'avatars';

/**
 * Uploads a local image URI to Supabase Storage using fetch + Blob.
 * No extra packages required — works natively in Expo/React Native.
 * Returns the public URL of the uploaded file.
 */
export async function uploadPhoto(userId: string, localUri: string): Promise<string> {
  // Fetch the file and get it as an ArrayBuffer (most reliable for Expo)
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  // Derive file extension and MIME type
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const fileName = `${Date.now()}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Deletes a photo from Supabase Storage given its public URL.
 */
export async function deletePhoto(publicUrl: string): Promise<void> {
  // Extract the storage path from the public URL
  // Format: https://.../storage/v1/object/public/avatars/{userId}/{fileName}
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;

  const filePath = publicUrl.slice(idx + marker.length);

  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) throw error;
}

/**
 * Background task to upload photos and update the user profile.
 * This runs asynchronously without blocking the UI flow.
 */
export async function backgroundUploadAndFinalize(userId: string, photos: string[]): Promise<void> {
  try {
    console.log('[Background Upload] Starting for user:', userId);
    
    // 1. Upload all local photos
    const uploadedUrls = await Promise.all(
      photos.map(async (uri) => {
        if (!uri) return '';
        if (uri.startsWith('http')) return uri; // Already a URL
        try {
          return await uploadPhoto(userId, uri);
        } catch (e) {
          console.error('[Background Upload] Failed for uri:', uri, e);
          return '';
        }
      })
    );

    const finalUrls = uploadedUrls.filter(p => p !== '');

    if (finalUrls.length === 0) {
      console.warn('[Background Upload] No photos were successfully uploaded.');
      return;
    }

    // 2. Update the profile with final URLs
    const { error } = await supabase
      .from('profiles')
      .update({
        photos: finalUrls,
        avatar_url: finalUrls[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[Background Upload] Final profile update failed:', error);
    } else {
      console.log('[Background Upload] Success! Profile updated with', finalUrls.length, 'photos.');
    }
  } catch (err) {
    console.error('[Background Upload] Critical error:', err);
  }
}
