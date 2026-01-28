// src/pages/inPersonResults/photoLogic.ts

import { supabase } from "../../supabaseClient";

/* =======================================================
   Types
======================================================= */

export type PhotoRefs = {
  legacyUrls: string[];
  storagePaths: string[];
};

type StoredPhoto = {
  id?: string;
  stepId?: string;
  dataUrl?: string;      // legacy base64 / blob / remote
  storagePath?: string;  // preferred
  path?: string;         // legacy alt key
  bucket?: string;       // optional override
};

/* =======================================================
   Guards & normalisation
======================================================= */

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isProbablyBase64OrRemoteImage(value: unknown): value is string {
  if (typeof value !== "string") return false;

  return (
    value.startsWith("data:image/") ||
    value.startsWith("blob:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

function normaliseStoragePath(
  raw: unknown,
  bucketName: string
): string | null {
  if (typeof raw !== "string") return null;

  let path = raw.trim();
  if (!path) return null;

  // Remove leading slash
  if (path.startsWith("/")) path = path.slice(1);

  // Remove accidental bucket prefix
  if (path.startsWith(`${bucketName}/`)) {
    path = path.replace(`${bucketName}/`, "");
  }

  // Remove accidental "public/" prefix
  if (path.startsWith("public/")) {
    path = path.replace("public/", "");
  }

  return path || null;
}

/* =======================================================
   Extraction
======================================================= */

/**
 * Extracts photo references from progress data.
 * Supports:
 * - legacy base64 / blob / remote URLs
 * - Supabase storage paths
 *
 * This function is intentionally defensive:
 * - tolerates old schemas
 * - tolerates mixed formats
 * - de-dupes aggressively
 */
export function extractPhotoRefs(
  progress: any,
  bucketName: string
): PhotoRefs {
  const legacyUrls: string[] = [];
  const storagePaths: string[] = [];

  const sources: unknown[] = [];

  // Step photos
  if (Array.isArray(progress?.photos)) {
    sources.push(...progress.photos);
  }

  // Follow-up photos
  if (Array.isArray(progress?.followUpPhotos)) {
    sources.push(...progress.followUpPhotos);
  }

  // Imperfection photos (future-proofing)
  if (Array.isArray(progress?.imperfections)) {
    sources.push(...progress.imperfections);
  }

  for (const item of sources) {
    // String form
    if (typeof item === "string") {
      const s = item.trim();
      if (!s) continue;

      if (isProbablyBase64OrRemoteImage(s)) {
        legacyUrls.push(s);
      } else {
        const norm = normaliseStoragePath(s, bucketName);
        if (norm) storagePaths.push(norm);
      }
      continue;
    }

    // Object form
    if (isRecord(item)) {
      const maybe = item as StoredPhoto;

      const rawStorage =
        (typeof maybe.storagePath === "string" && maybe.storagePath.trim()) ||
        (typeof maybe.path === "string" && maybe.path.trim()) ||
        "";

      const rawDataUrl =
        typeof maybe.dataUrl === "string" ? maybe.dataUrl.trim() : "";

      if (rawStorage) {
        const norm = normaliseStoragePath(rawStorage, bucketName);
        if (norm) storagePaths.push(norm);
      } else if (
        rawDataUrl &&
        isProbablyBase64OrRemoteImage(rawDataUrl)
      ) {
        legacyUrls.push(rawDataUrl);
      }
    }
  }

  const dedupe = (arr: string[]) => Array.from(new Set(arr));

  return {
    legacyUrls: dedupe(legacyUrls),
    storagePaths: dedupe(storagePaths),
  };
}

/* =======================================================
   Signed URL resolution
======================================================= */

/**
 * Safely creates a signed URL for a Supabase storage object.
 * Returns null instead of throwing on failure.
 */
export async function createSignedUrlSafe(
  bucket: string,
  path: string,
  ttlSeconds: number
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, ttlSeconds);

    if (error) {
      console.warn(
        "[photoLogic] createSignedUrl failed:",
        error.message
      );
      return null;
    }

    return data?.signedUrl ?? null;
  } catch (e) {
    console.warn("[photoLogic] createSignedUrl exception:", e);
    return null;
  }
}

/* =======================================================
   High-level resolver
======================================================= */

/**
 * Resolves all photos for display:
 * - Legacy URLs are returned immediately
 * - Storage paths are converted to signed URLs
 * - Order is preserved (legacy first, then storage)
 */
export async function resolvePhotoUrls(
  progress: any,
  options: {
    bucket: string;
    ttlSeconds: number;
  }
): Promise<{
  urls: string[];
  capturedCount: number;
}> {
  const { legacyUrls, storagePaths } = extractPhotoRefs(
    progress,
    options.bucket
  );

  const signedUrls: string[] = [];

  for (const path of storagePaths) {
    const url = await createSignedUrlSafe(
      options.bucket,
      path,
      options.ttlSeconds
    );
    if (url) signedUrls.push(url);
  }

  return {
    urls: [...legacyUrls, ...signedUrls],
    capturedCount: legacyUrls.length + storagePaths.length,
  };
}
