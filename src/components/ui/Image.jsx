import { useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * Product imagery is the heaviest thing this site ships. Every image goes
 * through here so lazy loading, async decoding, an explicit aspect ratio
 * (which prevents layout shift) and a broken-image fallback are the
 * default rather than something each page has to remember.
 */
export function Image({
  src,
  alt,
  ratio = '1',
  eager = false,
  className = '',
  sizes,
  objectFit = 'cover',
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`img-wrap ${className}`} style={{ aspectRatio: ratio }}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding={eager ? 'sync' : 'async'}
          fetchPriority={eager ? 'high' : 'auto'}
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={loaded ? 'is-loaded' : ''}
          style={{ objectFit }}
          {...rest}
        />
      )}
      {failed && (
        <div className="img-wrap__fallback">
          <ImageOff size={26} strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}
