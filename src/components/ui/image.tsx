import { useEffect, useState } from "react";
import { Image, ImageOff } from "lucide-react";

import { ImageCore, ImageStep } from "@/domains/ui/image";
import { connect } from "@/domains/ui/image/connect.web";
import { cn } from "@/utils";

export function LazyImage(props: { src?: string; alt?: string } & React.HTMLAttributes<HTMLImageElement>) {
  let $img: HTMLImageElement | undefined = undefined;

  const image = new ImageCore({ width: 200, height: 100, src: props.src, alt: props.alt });
  const [state, setState] = useState(image.state);
  image.onStateChange((nextState) => {
    // console.log("[COMPONENT]LazyImage - image.onStateChange", nextState);
    setState(nextState);
  });
  useEffect(() => {
    if (!$img) {
      return;
    }
    connect($img, image);
  }, []);
  useEffect(() => {
    if (!props.src) {
      return;
    }
    image.updateSrc(props.src);
  }, [props.src]);

  if (state.step === ImageStep.Failed) {
    return (
      <div className={cn(props.className, "flex items-center justify-center bg-w-bg-0")}>
        <ImageOff className="w-8 h-8 text-w-fg-2" />
      </div>
    );
  }
  if (state.step === ImageStep.Pending) {
    return (
      <div ref={$img} className={cn(props.className, "flex items-center justify-center bg-w-bg-0")}>
        <Image className="w-8 h-8 text-w-fg-2" />
      </div>
    );
  }
  if ([ImageStep.Loading, ImageStep.Loaded].includes(state.step)) {
    return (
      <img
        className={props.className}
        style={{ objectFit: state.fit }}
        src={state.src}
        alt={state.alt}
        onError={() => {
          image.handleError();
        }}
      />
    );
  }

  return null;
}
