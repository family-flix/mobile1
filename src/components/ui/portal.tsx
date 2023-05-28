import { createPortal } from "react-dom";

import { useInitialize } from "@/hooks";
import { useEffect } from "react";

export function Portal(props: React.AllHTMLAttributes<HTMLElement>) {
  // useInitialize(() => {
  //   createPortal(props.children, document.body);
  // });
  // useInitialize(() => {
  //   console.log("create portal", props.children);
  //   const $e = document.createElement("div");
  //   document.body.appendChild($e);
  // });

  return createPortal(<div className="content">{props.children}</div>, document.body);
}
