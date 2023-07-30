/**
 * @file 我的播放历史页面
 */
import React, { useState } from "react";

import { fetch_play_histories, PlayHistoryItem } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { RequestCore } from "@/domains/client";
import { ViewComponent } from "@/types";
import { useInitialize, useInstance } from "@/hooks";
import { ScrollView } from "@/components/ui/scroll-view";
import { LazyImage } from "@/components/ui/image";
import { sleep } from "@/utils";
import { ListView } from "@/components/ui/list-view";
import { Skeleton } from "@/components/ui/skeleton";

export const HomeHistoryPage: ViewComponent = (props) => {
  const { router, view } = props;
  // const [response, helper] = useHelper<PlayHistoryItem>(fetch_play_histories);
  const helper = useInstance(() => new ListCore(new RequestCore(fetch_play_histories)));
  const scrollView = useInstance(() => new ScrollViewCore({}));
  const [response, setResponse] = useState(helper.response);

  useInitialize(() => {
    // console.log("[PAGE]history - useInitialize");
    // page.onReady(() => {
    //   helper.init();
    // });
    view.onReady(() => {
      console.log("home/history ready");
    });
    view.onMounted(() => {
      console.log("home/history mounted");
    });
    view.onShow(() => {
      console.log("home/history show");
      // helper.refresh();
    });
    view.onHidden(() => {
      console.log("home/history hide");
    });
    scrollView.onPullToRefresh(async () => {
      await helper.refresh();
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      helper.loadMore();
    });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    helper.init();
  });

  const { dataSource } = response;

  return (
    <ScrollView store={scrollView}>
      <div className="pt-4">
        <h2 className="h2 pb-4 text-center">我的所有播放记录</h2>
        <div className="">
          <ListView
            store={helper}
            className="grid grid-cols-1 space-y-4 p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
            skeleton={
              <>
                <div className="flex cursor-pointer">
                  <div className="relative mr-4">
                    <Skeleton className="w-[120px] h-[180px]" />
                  </div>
                  <div className="relative flex-1 mt-2">
                    <Skeleton className="w-36 h-[32px]"></Skeleton>
                    <div className="flex items-center mt-2 text-xl">
                      <Skeleton className="w-24 h-[28px]"></Skeleton>
                    </div>
                    <Skeleton className="mt-2 w-12 h-[24px]"></Skeleton>
                  </div>
                </div>
              </>
            }
          >
            {dataSource.map((history) => {
              const {
                id,
                tv_id,
                name,
                poster_path,
                episode,
                season,
                updated,
                cur_episode_count,
                episode_count,
                has_update,
                percent,
              } = history;
              return (
                <div
                  key={tv_id}
                  className="flex cursor-pointer"
                  onClick={() => {
                    router.push(`/tv/play/${tv_id}`);
                  }}
                >
                  <div className="relative mr-4">
                    <LazyImage className="w-[120px] object-cover" src={poster_path} alt={name} />
                    {(() => {
                      if (episode_count && cur_episode_count !== episode_count) {
                        return (
                          <div className="absolute top-1 left-1">
                            <div className="inline-flex items-center py-1 px-2 rounded-sm bg-green-300 dark:bg-green-800">
                              <div className="text-[12px] leading-none text-gray-800 dark:text-gray-300 ">
                                更新到第{cur_episode_count}集
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                  <div className="relative flex-1 max-w-sm overflow-hidden text-ellipsis mt-2">
                    <h2 className="text-2xl">{name}</h2>
                    <div className="flex items-center mt-2 text-xl">
                      <p className="">{episode}</p>
                      <p className="mx-2 text-gray-500">·</p>
                      <p className="text-gray-500">{season}</p>
                    </div>
                    <div className="mt-2">
                      {updated} 看到 {percent}
                    </div>
                    <div className="flex items-center mt-4 space-x-2">
                      {(() => {
                        const nodes: React.ReactNode[] = [];
                        if (has_update) {
                          nodes.push(
                            <div
                              key="update_1"
                              className="inline-flex items-center py-1 px-2 rounded-sm bg-green-300 dark:bg-green-800"
                            >
                              <div className="text-[14px] leading-none text-gray-800 dark:text-gray-300 ">
                                在你看过后有更新
                              </div>
                            </div>
                          );
                        }
                        return nodes;
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </ListView>
        </div>
      </div>
    </ScrollView>
  );
};
