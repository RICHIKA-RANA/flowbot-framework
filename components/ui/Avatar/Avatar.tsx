import React, { useEffect, useState } from 'react';
import { AvatarProps } from '@/types/ui';

const imageCache = new Map<string, string>();

export function Avatar({ id, hasImage, fetchImage, fallback }: AvatarProps) {
  const [objectUrl, setObjectUrl] = useState<string>(
    () => imageCache.get(id) || '',
  );

  useEffect(() => {
    if (!hasImage || imageCache.has(id)) return;
    let cancelled = false;

    fetchImage(id).then((url) => {
      if (!url) return;
      imageCache.set(id, url);
      if (!cancelled) setObjectUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [id, hasImage, fetchImage]);

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-blue-50 text-blue-500">
      {objectUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={objectUrl}
          alt=""
          width={36}
          height={36}
          className="h-full w-full object-cover"
        />
      ) : (
        fallback
      )}
    </div>
  );
}
