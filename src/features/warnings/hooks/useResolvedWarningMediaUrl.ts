import { useEffect, useState } from 'react';
import {
  isLocalWarningMediaUrl,
  resolveWarningMedia,
} from '@/features/warnings/services/localWarningMedia';

export function useResolvedWarningMediaUrl(contentUrl?: string | null): string | null {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(contentUrl || null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (!contentUrl) {
      setResolvedUrl(null);
      return () => undefined;
    }

    if (contentUrl.startsWith('blob:') || contentUrl.startsWith('data:')) {
      setResolvedUrl(contentUrl);
      return () => undefined;
    }

    if (!isLocalWarningMediaUrl(contentUrl) && !/^https?:\/\//i.test(contentUrl)) {
      setResolvedUrl(contentUrl || null);
      return () => undefined;
    }

    setResolvedUrl(isLocalWarningMediaUrl(contentUrl) ? null : contentUrl);

    resolveWarningMedia(contentUrl)
      .then((record) => {
        if (!active) return;
        if (!record) {
          setResolvedUrl(isLocalWarningMediaUrl(contentUrl) ? null : contentUrl);
          return;
        }

        objectUrl = URL.createObjectURL(record.blob);
        setResolvedUrl(objectUrl);
      })
      .catch(() => {
        if (active) {
          setResolvedUrl(null);
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [contentUrl]);

  return resolvedUrl;
}
