import { CSSProperties } from "react";

import { NodeCore } from "./index";

export function connect(node: HTMLDivElement, store: NodeCore<any>) {
  store.scrollTo = (pos: { top: number }) => {
    node.scrollTo({ top: pos.top });
  };
  store.setStyles = (text: string) => {
    node.style.cssText = text;
  };
  const { width, height } = node.getBoundingClientRect();
  // console.log(node.scrollHeight, node.clientHeight);
  store.setRect({
    width,
    height,
    scrollHeight: node.scrollHeight,
  });
  // node.classList.add("__a");
  node.addEventListener("click", () => {
    store.handleClick();
  });
  store.setMounted();
  // node.addEventListener("animationend", () => {
  //   store.handleMounted();
  // });
}
