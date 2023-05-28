/**
 * @file 首页
 */
import { useEffect, useRef, useState } from "react";

import LazyImage from "@/components/LazyImage";
// import useHelper from "@/domains/list-helper-hook";
import { UserCore } from "@/domains/user";
import { fetch_tv_list, fetch_play_histories, PlayHistoryItem, TVItem } from "@/domains/tv/services";
import { useInitialize } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { ListCore } from "@/domains/list";
import { NavigatorCore } from "@/domains/navigator";
import { RouteViewCore } from "@/domains/route_view";
import { PageView } from "@/components/ui/scroll-view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";

// @ts-ignore
const helper = new ListCore<TVItem>(fetch_tv_list, { pageSize: 6 });
const history_helper = new ListCore<PlayHistoryItem>(fetch_play_histories, {});
const scrollView = new ScrollViewCore();

interface IProps {
  router: NavigatorCore;
  view: RouteViewCore;
  user: UserCore;
}
export const HomePage: React.FC<IProps> = (props) => {
  const { router, view, user } = props;
  const [response, setResponse] = useState(helper.response);
  const [history_response] = useState(history_helper.response);
  // const [response, helper] = useHelper<TVItem>(fetch_tv_list, { pageSize: 6 });
  // const [history_response, history_helper] = useHelper<PlayHistoryItem>(
  //   fetch_play_histories,
  //   {
  //     pageSize: 6,
  //   }
  // );
  const { toast } = useToast();
  useInitialize(() => {
    // page.onReady(() => {
    //   history_helper.init();
    //   helper.init();
    // });
    // page.onPullToRefresh(() => {
    //   helper.init();
    //   history_helper.init();
    //   return true;
    // });
    // page.onReachBottom(() => {
    //   helper.loadMore();
    // });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    helper.init();
  });

  const { dataSource, initial, error } = response;

  if (error && dataSource.length === 0) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center w-screen h-screen"
        onClick={() => {
          router.reload();
        }}
      >
        <div className="">
          <div className="text-3xl text-center">{error.message}</div>
          <div className="mt-4 text-center">网站出错了，点击刷新</div>
        </div>
      </div>
    );
  }

  console.log("[PAGE]home - render", dataSource);

  return (
    <PageView store={scrollView}>
      <div className="">
        {(() => {
          const { dataSource } = history_response;
          if (dataSource.length === 0) {
            return null;
          }
          return (
            <div className="mt-4 overflow-hidden">
              <h2 className="h2 pb-4 text-center">最近播放</h2>
              <div className="grid grid-cols-1 pl-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {dataSource.map((history) => {
                  const {
                    id,
                    name,
                    original_name,
                    poster_path,
                    episode,
                    season,
                    updated,
                    cur_episode_count,
                    episode_count,
                    has_update,
                  } = history;
                  return (
                    <div
                      key={id}
                      className="flex mt-4 cursor-pointer rounded-sm overflow-hidden"
                      onClick={() => {
                        router.push(`/play/${id}`);
                      }}
                    >
                      <div className="relative">
                        <LazyImage className="w-[120px] object-cover" src={poster_path} alt={name || original_name} />
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
                      <div className="relative flex-1 max-w-sm overflow-hidden p-4 pt-0 text-ellipsis">
                        <h2 className="text-2xl">{name}</h2>
                        <div className="flex items-center mt-2 text-xl">
                          <p className="">{episode}</p>
                          <p className="mx-2 text-gray-500">·</p>
                          <p className="text-gray-500">{season}</p>
                        </div>
                        <div className="mt-2">{updated} 看过</div>
                        <div className="flex items-center mt-4 space-x-2">
                          {(() => {
                            if (has_update) {
                              return (
                                <div className="inline-flex items-center py-1 px-2 rounded-sm bg-green-300 dark:bg-green-800">
                                  <div className="text-[14px] leading-none text-gray-800 dark:text-gray-300 ">
                                    在你看过后有更新
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="my-6 text-center"
                onClick={() => {
                  router.push("/history");
                }}
              >
                点击查看所有播放记录
              </div>
            </div>
          );
        })()}
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
          <div
            className="text-center mt-4 py-2"
            onClick={() => {
              helper.loadMore();
            }}
          >
            加载更多
          </div>
        </div>
      </div>
      {/* <div className="fixed right-8 bottom-4 xl:right-12 xl:bottom-12">
        <div
          className="flex items-center justify-center bg-gray-100 rounded-full cursor-pointer w-12 h-12 xl:w-24 xl:h-24 dark:bg-gray-800"
          onClick={() => {
            router.push("/search");
          }}
        >
          <Search className="w-4 h-4 text-gray-800 xl:w-12 xl:h-12 dark:text-gray-100" />
        </div>
      </div> */}
    </PageView>
  );
};
