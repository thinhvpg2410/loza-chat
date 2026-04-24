import type { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';

/**
 * Absolute URL for reading uploaded media (avatar, chat attachments).
 * Prefer `S3_PUBLIC_BASE_URL` + key; in STORAGE_MOCK use `API_PUBLIC_BASE_URL` + mock-public;
 * otherwise derive from S3 endpoint or virtual-hosted AWS URL.
 */
export function publicMediaUrlForStorageKey(
  config: ConfigService<AppConfiguration, true>,
  storageKey: string,
): string {
  const storage = config.get('storage', { infer: true });
  const base = storage.publicBaseUrl;
  if (base && base.trim().length > 0) {
    const trimmed = base.replace(/\/$/, '');
    return `${trimmed}/${storageKey}`;
  }
  const api = (config.get('apiPublicBaseUrl', { infer: true }) ?? '').trim();
  if (storage.mock && api.length > 0) {
    return `${api.replace(/\/$/, '')}/uploads/mock-public?key=${encodeURIComponent(storageKey)}`;
  }
  if (!storage.mock && storage.bucket) {
    const endpoint = storage.endpoint?.trim();
    if (endpoint) {
      return `${endpoint.replace(/\/$/, '')}/${storage.bucket}/${storageKey}`;
    }
    const region = storage.region || 'us-east-1';
    return `https://${storage.bucket}.s3.${region}.amazonaws.com/${storageKey}`;
  }
  return `https://mock-storage.local/public/${storageKey}`;
}
