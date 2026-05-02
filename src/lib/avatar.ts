import { supabase } from "@/integrations/supabase/client";

const AVATAR_BUCKET = "health-records";
const AVATAR_SIGNED_URL_TTL = 60 * 60 * 24 * 7;
const AVATAR_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

// Avatars are stored under the user's own folder so the bucket's owner-scoped
// RLS policy (path prefix == auth.uid()) allows reads/writes.
const avatarFolderForUser = (userId: string) => `${userId}/avatars`;

function appendCacheBuster(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isSupabaseStorageAvatarUrl(value: string) {
  return value.includes("/storage/v1/object/") && value.includes(`/${AVATAR_BUCKET}/`);
}

function extractAvatarPath(value?: string | null) {
  if (!value) return null;

  const sanitized = value.split("?")[0];
  if (sanitized.includes("/avatars/")) return sanitized;
  if (!isHttpUrl(sanitized)) return null;

  try {
    const url = new URL(sanitized);
    const marker = `/${AVATAR_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

async function createSignedAvatarUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, AVATAR_SIGNED_URL_TTL);

  if (error || !data?.signedUrl) return null;
  return appendCacheBuster(data.signedUrl);
}

async function compressAvatar(file: File): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 512 / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.9,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    image.src = objectUrl;
  });
}

export async function resolveAvatarUrl({
  userId,
  storedAvatar,
  oauthAvatarUrl,
}: {
  userId?: string | null;
  storedAvatar?: string | null;
  oauthAvatarUrl?: string | null;
}) {
  if (storedAvatar && isHttpUrl(storedAvatar) && !isSupabaseStorageAvatarUrl(storedAvatar)) {
    return storedAvatar;
  }

  const storedPath = extractAvatarPath(storedAvatar);
  const candidatePaths = [
    ...(storedPath ? [storedPath] : []),
    ...(userId
      ? AVATAR_EXTENSIONS.map((ext) => `${avatarFolderForUser(userId)}/avatar.${ext}`)
      : []),
  ].filter((path, index, allPaths) => !!path && allPaths.indexOf(path) === index);

  for (const path of candidatePaths) {
    const signedUrl = await createSignedAvatarUrl(path);
    if (signedUrl) return signedUrl;
  }

  return oauthAvatarUrl ?? null;
}

export async function uploadAvatar(file: File, userId: string) {
  const compressedAvatar = await compressAvatar(file);
  const filePath = `${avatarFolderForUser(userId)}/avatar.jpg`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, compressedAvatar, {
      upsert: true,
      cacheControl: "3600",
      contentType: "image/jpeg",
    });

  if (error) throw error;

  const signedUrl = await createSignedAvatarUrl(filePath);
  if (!signedUrl) throw new Error("Failed to create avatar URL");

  return { filePath, signedUrl };
}
