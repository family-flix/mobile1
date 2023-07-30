/**
 * @file 提供 加载中、没有数据、加载更多等内容的组件
 */
import { useState } from "react";
import { AlertCircle, ArrowDown, Bird, Loader } from "lucide-react";

import { ListCore } from "@/domains/list";
import { Show } from "./show";
import { cn } from "@/utils";

export function ListView(
  props: { store: ListCore<any, any>; skeleton?: React.ReactElement } & React.HTMLAttributes<HTMLDivElement>
) {
  const { store, skeleton = null } = props;
  const [response, setResponse] = useState(store.response);

  store.onStateChange((nextState) => {
    console.log("[COMPONENT]ListView - store.onStateChange", nextState);
    setResponse(nextState);
  });

  return (
    <div className={cn("relative", props.className)}>
      <Show
        when={!response.error}
        fallback={
          <div className="w-full h-[480px] center flex items-center justify-center">
            <div className="flex flex-col items-center justify-center text-slate-500">
              <AlertCircle className="w-24 h-24" />
              <div className="mt-4 flex items-center space-x-2">
                <div className="text-xl">{response.error?.message}</div>
              </div>
            </div>
          </div>
        }
      >
        <Show when={response.empty}>
          <div className="w-full h-[480px] center flex items-center justify-center">
            <div className="flex flex-col items-center justify-center text-slate-500">
              <Bird className="w-24 h-24" />
              <div className="mt-4 flex items-center space-x-2">
                <Show when={response.loading}>
                  <Loader className="w-6 h-6 animate-spin" />
                </Show>
                <div className="text-xl">{response.loading ? "加载中" : "列表为空"}</div>
              </div>
            </div>
          </div>
        </Show>
        <Show when={!!(response.initial && skeleton)}>{skeleton}</Show>
        {props.children}
        <Show when={!response.noMore && !response.initial}>
          <div className="mt-4 flex justify-center py-4 text-slate-500">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => {
                store.loadMore();
              }}
            >
              <Show when={response.loading} fallback={<ArrowDown className="w-6 h-6" />}>
                <Loader className="w-6 h-6 animate-spin" />
              </Show>
              <div className="text-center">{response.loading ? "加载中" : "加载更多"}</div>
            </div>
          </div>
        </Show>
      </Show>
      <Show when={response.noMore && !response.empty}>
        <div className="mt-4 flex justify-center py-4 text-slate-500">
          <div className="flex items-center space-x-2">
            <Show when={response.loading}>
              <Loader className="w-6 h-6 animate-spin" />
            </Show>
            <div className="text-center">没有数据了</div>
          </div>
        </div>
      </Show>
    </div>
  );
}
