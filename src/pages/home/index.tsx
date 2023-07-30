/**
 * @file 首页
 */
import React, { useEffect, useState } from "react";

import { fetch_season_list } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { ScrollView } from "@/components/ui/scroll-view";
import { LazyImage } from "@/components/ui/image";
import { ListView } from "@/components/ui/list-view";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export const HomeIndexPage: ViewComponent = React.memo((props) => {
  const { router, view } = props;

  const scrollView = useInstance(() => new ScrollViewCore());
  const helper = useInstance(() => new ListCore(new RequestCore(fetch_season_list), { pageSize: 6 }));
  const [response, setResponse] = useState(helper.response);
  // const [history_response] = useState(history_helper.response);
  useInitialize(() => {
    view.onReady(() => {
      console.log("home/index ready");
    });
    view.onMounted(() => {
      console.log("home/index mounted");
    });
    view.onShow(() => {
      console.log("home/index show");
    });
    view.onHidden(() => {
      console.log("home/index hide");
    });
    scrollView.onPullToRefresh(async () => {
      await helper.refresh();
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      console.log("load  more");
      helper.loadMore();
    });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    helper.init();
  });

  const { dataSource } = response;

  console.log("[PAGE]home - render", dataSource);

  return (
    <ScrollView store={scrollView}>
      <div className="">
        <div className="mt-4 overflow-hidden">
          <h2 className="h2 pb-4 text-center">所有影片</h2>
          <ListView
            store={helper}
            className="grid grid-cols-1 pb-[24px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
            skeleton={
              <div className="w-full mx-auto">
                <div className="m-4 cursor-pointer">
                  <Skeleton className="w-full h-[512px] dark:bg-gray-800" />
                  <div className="mt-4 max-w-sm overflow-hidden text-ellipsis">
                    <Skeleton className="w-[256px] h-[32px] dark:bg-gray-800"></Skeleton>
                  </div>
                </div>
              </div>
            }
          >
            {(() => {
              return dataSource.map((season) => {
                const { id, tv_id, name, poster_path = "" } = season;
                return (
                  <div
                    key={id}
                    className="m-4 cursor-pointer"
                    onClick={() => {
                      router.push(`/tv/play/${tv_id}?season_id=${id}`);
                    }}
                  >
                    <LazyImage className="w-full h-[512px] object-cover" src={poster_path} alt={name} />
                    <div className="mt-4 max-w-sm overflow-hidden text-ellipsis">
                      <h2 className="truncate text-slate-900 text-2xl">{name}</h2>
                    </div>
                  </div>
                );
              });
            })()}
          </ListView>
        </div>
      </div>
    </ScrollView>
  );
});
