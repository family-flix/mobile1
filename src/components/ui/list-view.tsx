/**
 * @file 提供 加载中、没有数据、加载更多等内容的组件
 */
import React, { useState } from "react";
import { AlertCircle, ArrowDown, Bird, Loader } from "lucide-react";

import { ListCore } from "@/domains/list";
import { ButtonCore } from "@/domains/ui";
import { useInitialize, useInstance } from "@/hooks";
import { app } from "@/store";
import { cn } from "@/utils";

import { Button } from "./button";
import { Show } from "./show";

export const ListView = React.memo(
  (
    props: {
      wrapClassName?: string;
      store: ListCore<any, any>;
      skeleton?: React.ReactElement;
      extraEmpty?: React.ReactElement;
    } & React.HTMLAttributes<HTMLDivElement>
  ) => {
    const { store, skeleton = null, extraEmpty = null } = props;
    const [response, setResponse] = useState(store.response);

    const loginBtn = useInstance(
      () =>
        new ButtonCore({
          async onClick() {
            app.cache.clear("user");
            const r = await app.user.validate({
              token: app.router.query.token,
              force: "1",
            });
            if (r.error) {
              return;
            }
            app.router.reload();
          },
        })
    );

    useInitialize(() => {
      store.onStateChange((nextState) => {
        console.log("[COMPONENT]ListView - store.onStateChange", nextState);
        setResponse(nextState);
      });
    });

    return (
      <div className={cn("relative z-40 text-w-fg-1", props.wrapClassName)}>
        <div className={props.className}>
          <Show when={!!(response.initial && skeleton)}>{skeleton}</Show>
          <Show
            when={!response.empty}
            fallback={
              <div className="w-full h-[240px] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <Bird className="w-24 h-24" />
                  <div className="mt-4 flex items-center space-x-2">
                    <Show when={response.loading}>
                      <Loader className="w-6 h-6 animate-spin" />
                    </Show>
                    <div className="text-xl">{response.loading ? "加载中" : "列表为空"}</div>
                  </div>
                  {extraEmpty}
                </div>
              </div>
            }
          >
            {props.children}
          </Show>
        </div>
        <Show
          when={!!response.error}
          fallback={
            <Show when={!response.noMore && !response.initial}>
              <div className="flex justify-center py-8">
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
          }
        >
          <div className="w-full h-[240px] flex items-center justify-center py-24">
            <div className="flex flex-col items-center justify-center px-8">
              <AlertCircle className="w-24 h-24" />
              <div className="mt-4 flex items-center space-x-2">
                <div className="text-center text-xl">{response.error?.message}</div>
              </div>
              <Show when={!!response.error?.message.includes("timestamp check failed")}>
                <Button store={loginBtn} variant="subtle" size="sm" className="mt-4 py-8 px-4">
                  点击刷新
                </Button>
              </Show>
            </div>
          </div>
        </Show>
        <Show when={response.noMore && !response.empty}>
          <div className="flex justify-center py-8">
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
);
