import React, { ReactElement, useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

import { InputCore } from "@/domains/ui/input";
import { connect } from "@/domains/ui/input/connect.web";
import { useInitialize } from "@/hooks";
import { cn, sleep } from "@/utils";

const Input = (props: { store: InputCore; focus?: boolean; prefix?: ReactElement; className?: string }) => {
  const { store, prefix, focus } = props;

  const ref = useRef<HTMLInputElement>(null);
  const [state, setState] = useState(store.state);

  useEffect(() => {
    const $input = ref.current;
    if (!$input) {
      return;
    }
    connect(store, $input);
    if (focus) {
      setTimeout(() => {
        $input.focus();
      }, 500);
    }
    store.setMounted();
  }, []);
  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const { loading, value, placeholder, disabled, allowClear, type } = state;

  // React.useEffect(() => {
  //   return () => {
  //     console.log("Input unmounted");
  //   };
  // }, []);
  // console.log("[]Input");
  return (
    <div className="relative">
      <div className="absolute left-3 top-[50%] translate-y-[-50%] text-w-fg-1">
        {(() => {
          if (!prefix) {
            return null;
          }
          if (loading) {
            return <Loader2 className="w-5 h-5 animate-spin" />;
          }
          return prefix;
        })()}
      </div>
      <input
        ref={ref}
        className={cn(
          "flex items-center h-10 w-full rounded-md leading-none border border-w-bg-2 bg-w-bg-3 text-w-fg-0 py-2 px-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-fg-4 focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "placeholder:text-w-fg-1",
          prefix ? "pl-10" : "",
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
      <div
        className="absolute right-3 top-[50%] p-2 translate-y-[-50%]"
        onClick={async () => {
          store.clear();
          store.focus();
        }}
      >
        {(() => {
          if (!allowClear) {
            return null;
          }
          if (!value) {
            return null;
          }
          return (
            <div className="p-1 rounded-full bg-w-fg-1 text-w-bg-0">
              <X className="w-2 h-2" />
            </div>
          );
        })()}
      </div>
    </div>
  );
};
Input.displayName = "Input";

export { Input };
