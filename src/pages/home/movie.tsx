/**
 * @file 电影列表页
 */
import React, { useEffect, useState } from "react";

import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { ScrollView } from "@/components/ui/scroll-view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { LazyImage } from "@/components/ui/image";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { fetch_movie_list } from "@/domains/movie/services";
import { ListView } from "@/components/ui/list-view";
import { Skeleton } from "@/components/ui/skeleton";

export const HomeMoviePage: ViewComponent = React.memo((props) => {
  const { router, view } = props;

  const scrollView = useInstance(() => new ScrollViewCore());
  const helper = useInstance(() => new ListCore(new RequestCore(fetch_movie_list), { pageSize: 6 }));
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
    // page.onReady(() => {
    //   history_helper.init();
    //   helper.init();
    // });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
  });
  useEffect(() => {
    helper.init();
  }, []);

  const { dataSource, error } = response;

  console.log("[PAGE]home - render", dataSource);

  return (
    <ScrollView store={scrollView}>
      <div className="">
        <div className="mt-4 overflow-hidden">
          <h2 className="h2 pb-4 text-center">所有电影</h2>
          <ListView
            store={helper}
            className="grid grid-cols-1 pb-[24px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
            skeleton={
              <div className="w-full mx-auto">
                <div className="m-4 cursor-pointer">
                  <Skeleton className="w-full h-[524px] dark:bg-gray-800" />
                  <div className="mt-4 max-w-sm overflow-hidden text-ellipsis">
                    <Skeleton className="w-[256px] h-[32px] dark:bg-gray-800"></Skeleton>
                  </div>
                </div>
              </div>
            }
          >
            {(() => {
              return dataSource.map((tv) => {
                const { id, name, overview, poster_path = "" } = tv;
                return (
                  <div
                    key={id}
                    className="m-4 cursor-pointer"
                    onClick={() => {
                      router.push(`/movie/play/${id}`);
                    }}
                  >
                    <LazyImage className="w-full h-[512px] object-cover" src={poster_path} alt={name} />
                    <div className="mt-4 max-w-sm overflow-hidden text-ellipsis">
                      <h2 className="truncate text-2xl">{name}</h2>
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
