import React, { useState } from "react";

import { CheckboxCore } from "@/domains/ui/checkbox";
import { CheckboxGroupCore } from "@/domains/ui/checkbox/group";
import { cn } from "@/utils";
import { useInitialize } from "@/hooks";

export const CheckboxOption = (
  props: { label: string; store: CheckboxCore } & React.HTMLAttributes<HTMLDivElement>
) => {
  const { label, store } = props;

  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      console.log("[COMPONENT]CheckboxGroup - Option store.onStateChange", nextState);
      setState(nextState);
    });
  });

  return (
    <div
      className={cn(
        "py-2 px-4 mb-2 rounded-lg border",
        state.checked ? "bg-slate-500 text-slate-200 dark:text-slate-600" : "",
        {
          "bg-slate-500": state.checked,
        }
      )}
      onClick={() => {
        store.toggle();
      }}
    >
      <div className="text-sm">{label}</div>
    </div>
  );
};

export const CheckboxGroup = <T extends any>(
  props: { store: CheckboxGroupCore<T> } & React.HTMLAttributes<HTMLDivElement>
) => {
  const { store } = props;

  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  return (
    <div className="flex flex-wrap space-x-2">
      {state.options.map((option) => {
        const { label, value, core } = option;
        return <CheckboxOption key={label} store={core} label={label} />;
      })}
    </div>
  );
};
