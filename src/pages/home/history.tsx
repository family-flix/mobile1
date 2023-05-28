/**
 * @file 我的播放历史页面
 */
import { useState } from "react";

import { UserCore } from "@/domains/user";
import LazyImage from "@/components/LazyImage";
import { useInitialize } from "@/hooks";
import { fetch_play_histories, PlayHistoryItem } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { NavigatorCore } from "@/domains/navigator";
import { RouteViewCore } from "@/domains/route_view";
import { ViewComponent } from "@/types";

const helper = new ListCore<PlayHistoryItem>(fetch_play_histories);

interface IProps {
  router: NavigatorCore;
  page: RouteViewCore;
  user: UserCore;
}
export const PlayHistoryPage: ViewComponent = (props) => {
  const { router } = props;
  // const [response, helper] = useHelper<PlayHistoryItem>(fetch_play_histories);
  const [response, setResponse] = useState(helper.response);

  useInitialize(() => {
    // console.log("[PAGE]history - useInitialize");
    // page.onReady(() => {
    //   helper.init();
    // });
    // page.onPullToRefresh(() => {
    //   helper.init();
    // });
    // page.onReachBottom(() => {
    //   helper.loadMore();
    // });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    helper.init();
  });

  const { dataSource } = response;

  return (
    <div className="overflow-hidden">
      <div />
      <h2 className="h2 mt-8 pb-4 text-center">我的所有播放记录</h2>
      <div className="">
        <div className="grid grid-cols-1 space-y-4 p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {dataSource.map((history) => {
            const { id, name, poster_path, episode, season, updated, cur_episode_count, episode_count, has_update } =
              history;
            return (
              <div
                key={id}
                className="flex cursor-pointer"
                onClick={() => {
                  router.push(`/play/${id}`);
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
                    if (episode_count && cur_episode_count === episode_count) {
                      return (
                        <div className="absolute top-1 left-1">
                          <div className="inline-flex items-center py-1 px-2 rounded-sm bg-green-300 dark:bg-green-800">
                            <div className="text-[12px] leading-none text-gray-800 dark:text-gray-300 ">
                              全{episode_count}集
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
                <div className="relative flex-1 max-w-sm overflow-hidden text-ellipsis">
                  <h2 className="text-2xl">{name}</h2>
                  <div className="flex items-center mt-2 text-xl">
                    <p className="">{episode}</p>
                    <p className="mx-2 text-gray-500">·</p>
                    <p className="text-gray-500">{season}</p>
                  </div>
                  <div className="mt-2">{updated} 看过</div>
                  <div className="flex items-center mt-4 space-x-2">
                    {(() => {
                      const nodes: React.ReactNode[] = [];
                      if (has_update) {
                        nodes.push(
                          <div className="inline-flex items-center py-1 px-2 rounded-sm bg-green-300 dark:bg-green-800">
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
        </div>
      </div>
    </div>
  );
};
