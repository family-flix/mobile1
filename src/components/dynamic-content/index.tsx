import React, { useState } from "react";

import { DynamicContentCore } from "@/domains/ui/dynamic-content";
import { useInitialize } from "@/hooks";

export const DynamicContent = React.memo(
  (
    props: {
      store: DynamicContentCore;
      options: { value: number; content: null | React.ReactElement }[];
    } & React.HTMLAttributes<HTMLDivElement>
  ) => {
    const { store, options } = props;

    const [state, setState] = useState(store.state);

    useInitialize(() => {
      store.onStateChange((v) => {
        setState(v);
      });
    });

    return (
      <div className={props.className}>
        {(() => {
          const matched = options.find((opt) => opt.value === state.value);
          if (!matched) {
            return null;
          }
          return matched.content;
        })()}
      </div>
    );
  }
);
