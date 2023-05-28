import React, { useState } from "react";

import { cn } from "@/utils";
import { InputCore } from "@/domains/ui/input";
import { useInitialize } from "@/hooks";

const Input = (props: { store: InputCore } & React.AllHTMLAttributes<HTMLInputElement>) => {
  const { store } = props;

  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const { value, placeholder, disabled, type } = state;

  // React.useEffect(() => {
  //   return () => {
  //     console.log("Input unmounted");
  //   };
  // }, []);
  // console.log("[]Input");
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
        props.className
      )}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      onChange={(event: React.ChangeEvent & { currentTarget: HTMLInputElement }) => {
        const { value } = event.currentTarget;
        store.change(value);
      }}
    />
  );
};
Input.displayName = "Input";

export { Input };
