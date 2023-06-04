import { useEffect, useRef, useState } from "react";

import { ImageCore } from "@/domains/ui/image";
import { useInitialize, useInstance } from "@/hooks";
import { connect } from "@/domains/ui/image/connect.web";

export function LazyImage(props: {} & React.AllHTMLAttributes<HTMLImageElement>) {
  const imgRef = useRef<HTMLImageElement>(null);

  const image = useInstance(() => {
    return new ImageCore({ width: 200, height: 100, src: props.src!, alt: props.alt });
  });
  const [state, setState] = useState(image.state);
  useInitialize(() => {
    image.onStateChange((nextState) => {
      console.log("[COMPONENT]LazyImage - image.onStateChange", nextState);
      setState(nextState);
    });
  });
  useEffect(() => {
    const $img = imgRef.current;
    if ($img === null) {
      return;
    }
    connect($img, image);
  }, []);

  const { src, alt, fit } = state;

  return <img ref={imgRef} className={props.className} style={{ objectFit: fit }} src={src} alt={alt} />;
}
