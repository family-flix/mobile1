/**
 * @file div
 */
import React, { useEffect, useRef, useState } from "react";

import { NodeCore } from "@/domains/ui/node";
import { connect } from "@/domains/ui/node/connect.web";

function Node<T = unknown>(
  props: {
    store: NodeCore<T>;
  } & React.HTMLAttributes<HTMLDivElement>
) {
  const { store } = props;

  const [state, setState] = useState(store.state);
  const ref = useRef<HTMLDivElement>(null);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    connect(ref.current, store);
  }, []);

  return (
    <div
      ref={ref}
      className={props.className}
      style={props.style}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        // store.click();
      }}
      onTouchStart={() => {
        store.handleMouseDown();
      }}
      onTouchEnd={(event) => {
        store.handleMouseUp({
          type: "touch end",
          stopPropagation() {
            event.stopPropagation();
          },
        });
      }}
      onMouseDown={() => {
        store.handleMouseDown();
      }}
      onMouseUp={(event) => {
        store.handleMouseUp({
          type: "mouse up",
          stopPropagation() {
            event.stopPropagation();
          },
        });
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
