/**
 * @file div
 */
import React, { useState } from "react";

import { NodeCore } from "@/domains/ui/node";

function Node<T = unknown>(
  props: {
    store: NodeCore<T>;
  } & React.HTMLAttributes<HTMLDivElement>
) {
  const { store } = props;

  const [state, setState] = useState(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div
      className={props.className}
      onClick={(event) => {
        event.preventDefault();
        store.click();
      }}
      onTouchStart={() => {
        store.handleMouseDown();
      }}
      onTouchEnd={() => {
        store.handleMouseUp();
      }}
      onMouseDown={() => {
        store.handleMouseDown();
      }}
      onMouseUp={() => {
        store.handleMouseUp();
      }}
      onMouseOut={() => {
        store.handleMouseOut();
      }}
    >
      {props.children}
    </div>
  );
}

export { Node };
