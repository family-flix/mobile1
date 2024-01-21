/**
 * @file 电视剧选择
 */
import { useState } from "react";
// import { For, Show, createSignal } from "solid-js";
import { Calendar, Send } from "lucide-react";

import { BaseDomain } from "@/domains/base";
import { ButtonCore, DialogCore, DialogProps, ImageInListCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { Button, Input, LazyImage, ListView, ScrollView, Skeleton } from "@/components/ui";

import { TVSeasonSelectCore } from "./store";
import { Show } from "@/packages/ui/show";
import { cn } from "@/utils";
import { useInitialize, useInstance } from "@/hooks";

export const TVSeasonSelect = (props: { store: TVSeasonSelectCore }) => {
  const { store } = props;

  const [tvListResponse, setTVListResponse] = useState(store.response);
  const [curSeason, setCurSeason] = useState(store.value);

  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onReachBottom() {
          store.list.loadMore();
        },
      })
  );
  const poster = useInstance(() => new ImageInListCore());

  useInitialize(() => {
    store.onResponseChange((nextState) => {
      setTVListResponse(nextState);
    });
    store.onCurSeasonChange((nextState) => {
      //     console.log("[COMPONENT]TVSeasonSelect - store.onCurSeasonChange", nextState);
      setCurSeason(nextState);
    });
    store.list.init();
  });

  return (
    <div>
      <div className="flex items-center space-x-2 mt-4">
        <Input store={store.nameInput} />
        <Button store={store.searchBtn} variant="subtle">
          搜索
        </Button>
      </div>
      <ScrollView className="mt-2 h-[240px] overflow-y-auto scroll--hidden" store={scrollView}>
        <ListView
          store={store.list}
          skeleton={
            <div>
              <div className="rounded-md border border-slate-300 bg-white shadow-sm">
                <div className="flex">
                  <div className="overflow-hidden mr-2 rounded-sm">
                    <Skeleton className="w-[120px] h-[180px]" />
                  </div>
                  <div className="flex-1 p-4">
                    <Skeleton className="h-[36px] w-[180px]"></Skeleton>
                    <div className="mt-2 space-y-1">
                      <Skeleton className="h-[24px] w-[120px]"></Skeleton>
                      <Skeleton className="h-[24px] w-[240px]"></Skeleton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {tvListResponse.dataSource.map((season) => {
              const { id, name, overview, cur_episode_count, episode_count, air_date, poster_path } = season;
              return (
                <div
                  className={cn({
                    "rounded-md border bg-white shadow-sm": true,
                    "border-green-500": curSeason?.id === id,
                    "border-slate-300 ": curSeason?.id !== id,
                  })}
                  onClick={() => {
                    store.select(season);
                  }}
                >
                  <div className="flex">
                    <div className="overflow-hidden mr-2 rounded-sm">
                      <LazyImage className="w-[120px] h-[180px]" store={poster.bind(poster_path)} alt={name} />
                    </div>
                    <div className="flex-1 w-0 p-4">
                      <div className="flex items-center">
                        <h2 className="text-2xl text-slate-800">{name}</h2>
                      </div>
                      <div className="mt-2 overflow-hidden text-ellipsis">
                        <p className="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-3">{overview}</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 break-keep overflow-hidden">
                        <div className="flex items-center space-x-1 px-2 border border-slate-600 rounded-xl text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-800" />
                          <div className="break-keep whitespace-nowrap">{air_date}</div>
                        </div>
                        <Show
                          when={cur_episode_count !== episode_count}
                          fallback={
                            <div className="flex items-center space-x-1 px-2 border border-green-600 rounded-xl text-green-600">
                              <div>全{episode_count}集</div>
                            </div>
                          }
                        >
                          <div className="flex items-center space-x-1 px-2 border border-blue-600 rounded-xl text-blue-600">
                            <Send className="w-4 h-4" />
                            <div>
                              {cur_episode_count}/{episode_count}
                            </div>
                          </div>
                        </Show>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ListView>
      </ScrollView>
    </div>
  );
};
