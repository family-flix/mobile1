import React, { useState } from "react";

import { StepCore } from "@/domains/step";
import { useInitialize } from "@/hooks";

export const StepSwitch = (
  props: { store: StepCore; options: Record<number, React.ReactNode> } & React.AllHTMLAttributes<HTMLDivElement>
) => {
  const { store, options } = props;

  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const elm = options[state.value];

  return <>{elm}</>;
};
