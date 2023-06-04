import { useState } from "react";

import { ToggleCore } from "@/domains/ui/toggle";
import { useInitialize } from "@/hooks";

export function ToggleView(props: { store: ToggleCore } & React.AllHTMLAttributes<HTMLDivElement>) {
  const { store } = props;
  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const { boolean } = state;
  if (boolean) {
    return <div>{props.children}</div>;
  }
  return null;
}
