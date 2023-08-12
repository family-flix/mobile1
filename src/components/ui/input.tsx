import React, { ReactElement, useEffect, useRef, useState } from "react";

import { cn } from "@/utils";
import { InputCore } from "@/domains/ui/input";
import { useInitialize } from "@/hooks";
import { connect } from "@/domains/ui/input/connect.web";
import { Loader2 } from "lucide-react";

const Input = (props: { store: InputCore; prefix?: ReactElement; className?: string }) => {
  const { store, prefix } = props;

  const ref = useRef<HTMLInputElement>(null);
  const [state, setState] = useState(store.state);

  useEffect(() => {
    const $input = ref.current;
    if (!$input) {
      return;
    }
    connect(store, $input);
    store.setMounted();
  }, []);
  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const { loading, value, placeholder, disabled, type } = state;

  // React.useEffect(() => {
  //   return () => {
  //     console.log("Input unmounted");
  //   };
  // }, []);
  // console.log("[]Input");
  return (
    <div className="relative">
      <div className="absolute left-3 top-[50%] translate-y-[-50%] text-slate-400 ">
        {(() => {
          if (!prefix) {
            return null;
          }
          if (loading) {
            return <Loader2 className="w-4 h-4 animate-spin" />;
          }
          return prefix;
        })()}
      </div>
      <input
        ref={ref}
        className={cn(
          "flex items-center h-10 w-full rounded-md leading-none border border-slate-300 bg-transparent py-2 px-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
          "placeholder:text-slate-400",
          prefix ? "pl-8" : "",
          props.className
        )}
        style={{
          verticalAlign: "bottom",
        }}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        type={type}
        onChange={(event: React.ChangeEvent & { target: HTMLInputElement }) => {
          const { value: v } = event.target;
          // console.log("[COMPONENT]ui/input onchange", v);
          store.change(v);
        }}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === "Enter") {
            store.handleEnter();
          }
        }}
        onBlur={() => {
          // console.log("[COMPONENT]ui/input onBlur");
          store.handleBlur();
        }}
      />
    </div>
  );
};
Input.displayName = "Input";

export { Input };
