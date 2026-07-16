import React, { useEffect, useRef } from 'react';
import type { AnimationItem } from 'lottie-web';

interface LoaderProps {
  loader?: string;
}

const Loader: React.FC<LoaderProps> = ({ loader }) => {
  const container = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (container.current) {
      import('lottie-web').then((lottie) => {
        // destroying the existing loader
        animationRef.current?.destroy();
        animationRef.current = lottie.default.loadAnimation({
          container: container.current!,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: loader ? loader : 'https://lottie.host/d1fd738a-f930-465e-b6ff-cf2412f791db/8r36ZWTWb2.json'
        });
      });
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
      }
    };
  }, [loader]);

  return <div ref={container}></div>;
};

export default Loader;
