import { CSSProperties } from "react";

import { NodeCore } from ".";

export function connect(node: HTMLDivElement, store: NodeCore<any>) {
  store.setStyles = (text: string) => {
    node.style.cssText = text;
  };

  node.classList.add("__a");
  node.addEventListener("click", () => {
    store.handleClick();
  });
  node.addEventListener("animationend", () => {
    store.handleMounted();
  });
}
