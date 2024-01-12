import React, { useEffect, useState } from "react";

import generateQrcode from "@/utils/qrcode";

export function Qrcode(
  props: {
    text: string;
    //     width: number;
    //     height: number;
    logo?: string;
  } & React.AllHTMLAttributes<HTMLImageElement>
) {
  const { text, logo, ...restProps } = props;

  const [url, setUrl] = useState("");

  useEffect(() => {
    (async () => {
      const nextUrl = await generateQrcode(text, { logo });
      if (!nextUrl) {
        return;
      }
      setUrl(nextUrl);
    })();
  }, []);

  return <img className={props.className} style={props.style} src={url} />;
}
