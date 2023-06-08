/**
 * @file 首页
 */
import React, { useEffect, useState } from "react";

import { fetch_tv_list, fetch_play_histories, PlayHistoryItem, TVItem } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { ScrollView } from "@/components/ui/scroll-view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { LazyImage } from "@/components/ui/image";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";

export const HomeIndexPage: ViewComponent = React.memo((props) => {
  const { router, view } = props;

  const scrollView = useInstance(() => new ScrollViewCore());
  const helper = useInstance(() => new ListCore(new RequestCore(fetch_tv_list), { pageSize: 6 }));
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
          <h2 className="h2 pb-4 text-center">所有影片</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {(() => {
              // if (initial) {
              //   return (
              //     <div className="w-[320px] mx-auto">
              //       <div className="m-4 cursor-pointer">
              //         <LazyImage className="w-full h-[524px] bg-gray-200 object-cover dark:bg-gray-800" />
              //         <div className="mt-4 max-w-sm overflow-hidden text-ellipsis">
              //           <h2 className="w-[256px] h-[32px] bg-gray-200 truncate text-2xl dark:bg-gray-800"></h2>
              //           <div className="mt-4">
              //             <p className="w-[375px] h-[24px] bg-gray-200 truncate dark:bg-gray-800"></p>
              //           </div>
              //         </div>
              //       </div>
              //     </div>
              //   );
              // }
              if (error) {
                return (
                  <div className="center text-center">
                    <div className="text-xl">获取电视剧列表失败</div>
                    <div className="mt-2 text-2xl">{error.message}</div>
                  </div>
                );
              }
              return dataSource.map((tv) => {
                const { id, name, original_name, overview, poster_path = "" } = tv;
                return (
                  <div
                    key={id}
                    className="m-4 cursor-pointer"
                    onClick={() => {
                      router.push(`/play/${id}`);
                    }}
                  >
                    <LazyImage
                      className="w-full min-h-[384px] object-cover"
                      src={poster_path}
                      alt={name || original_name}
                    />
                    <div className="mt-4 max-w-sm overflow-hidden text-ellipsis">
                      <h2 className="truncate text-2xl">{name}</h2>
                      <div className="">
                        <p className="truncate">{overview}</p>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </ScrollView>
  );
});
