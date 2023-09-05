/**
 * @file 我的播放历史页面
 */
import React, { useState } from "react";
import { MoreVertical } from "lucide-react";

import { ScrollView, Skeleton, LazyImage, ListView, Dialog, Node } from "@/components/ui";
import { ScrollViewCore, DialogCore, NodeInListCore } from "@/domains/ui";
import { PlayHistoryItem, delete_history, fetch_play_histories } from "@/domains/tv/services";
import { SelectionCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { moviePlayingPage, rootView, tvPlayingPage } from "@/store";
import { ViewComponent } from "@/types";
import { Show } from "@/components/ui/show";

export const HomeHistoryPage: ViewComponent = (props) => {
  const { app, router, view } = props;

  const cur = useInstance(() => new SelectionCore<PlayHistoryItem>());
  const deletingRequest = useInstance(
    () =>
      new RequestCore(delete_history, {
        onLoading(loading) {
          deletingConfirmDialog.okBtn.setLoading(loading);
        },
        onFailed(error) {
          app.tip({
            text: ["删除失败", error.message],
          });
        },
        onSuccess(v) {
          app.tip({
            text: ["删除成功"],
          });
          deletingConfirmDialog.hide();
          helper.deleteItem((history) => {
            if (history.id === cur.value?.id) {
              return true;
            }
            return false;
          });
          cur.clear();
        },
      })
  );
  const deletingConfirmDialog = useInstance(
    () =>
      new DialogCore({
        onOk() {
          if (!cur.value) {
            return;
          }
          deletingRequest.run({ history_id: cur.value.id });
        },
      })
  );
  const helper = useInstance(() => new ListCore(new RequestCore(fetch_play_histories)));
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        async onPullToRefresh() {
          await helper.refresh();
          scrollView.stopPullToRefresh();
        },
        onReachBottom() {
          helper.loadMore();
        },
      })
  );
  const historyCard = useInstance(
    () =>
      new NodeInListCore<PlayHistoryItem>({
        onClick(history) {
          if (!history) {
            return;
          }
          const { tv_id, movie_id } = history;
          if (tv_id) {
            tvPlayingPage.params = {
              id: tv_id,
            };
            rootView.layerSubView(tvPlayingPage);
            return;
          }
          if (movie_id) {
            moviePlayingPage.params = {
              id: movie_id,
            };
            rootView.layerSubView(moviePlayingPage);
            return;
          }
        },
        // onLongPress(record) {
        //   console.log("123");
        //   alert(record?.name);
        // },
      })
  );

  const [response, setResponse] = useState(helper.response);

  useInitialize(() => {
    // console.log("[PAGE]history - useInitialize");
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    helper.init();
  });

  const { dataSource } = response;

  return (
    <>
      <ScrollView store={scrollView} className="dark:text-black-200">
        <div className="min-h-screen w-full">
          <div className="">
            <ListView
              store={helper}
              className="grid grid-cols-1 space-y-4 p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              skeleton={
                <>
                  <div className="flex cursor-pointer">
                    <Skeleton className="relative w-[128px] h-[198px] mr-4 dark:bg-gray-800"></Skeleton>
                    <div className="relative flex-1 mt-2">
                      <Skeleton className="w-full h-[32px] dark:bg-gray-800"></Skeleton>
                      <div className="flex items-center mt-2 text-xl">
                        <Skeleton className="w-24 h-[28px] dark:bg-gray-800"></Skeleton>
                      </div>
                      <Skeleton className="mt-2 w-36 h-[24px] dark:bg-gray-800"></Skeleton>
                    </div>
                  </div>
                </>
              }
            >
              {dataSource.map((history) => {
                const {
                  id,
                  tv_id,
                  movie_id,
                  name,
                  poster_path,
                  episode,
                  season,
                  updated,
                  episode_count_text,
                  has_update,
                  percent,
                } = history;
                return (
                  <Node key={id} store={historyCard.bind(history)} className="relative flex cursor-pointer select-none">
                    <div className="z-50 absolute right-0 bottom-0">
                      <div
                        className="p-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          cur.select(history);
                          deletingConfirmDialog.show();
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="z-10 relative w-[128px] h-[198px] rounded-lg overflow-hidden mr-4">
                      <LazyImage className="w-full h-full object-cover" src={poster_path} alt={name} />
                      <div
                        className="absolute w-full bottom-0 bg-gray-600 opacity-50"
                        style={{ height: `${percent}%` }}
                      ></div>
                      {(() => {
                        if (episode_count_text) {
                          return (
                            <div className="absolute bottom-1 right-1">
                              <div className="inline-flex items-center py-1 px-2 rounded-sm">
                                <div
                                  className="text-[12px] text-white-900 dark:text-gray-300 "
                                  style={{ lineHeight: "12px" }}
                                >
                                  {episode_count_text}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                    <div className="relative flex-1 max-w-sm overflow-hidden text-ellipsis mt-2">
                      <h2 className="text-2xl dark:text-white">
                        {/* <span className="mr-2">
                          {(() => {
                            if (tv_id) {
                              return (
                                <span className="text-[14px] leading-none text-gray-800 dark:text-gray-300">
                                  电视剧
                                </span>
                              );
                            }
                            if (movie_id) {
                              return (
                                <span className="text-[14px] leading-none text-gray-800 dark:text-gray-300">电影</span>
                              );
                            }
                            return null;
                          })()}
                        </span> */}
                        <span className="">{name}</span>
                      </h2>
                      <Show when={!!episode}>
                        <div className="flex items-center mt-2">
                          <p className="">{episode}</p>
                          <p className="mx-2">·</p>
                          <p className="">{season}</p>
                        </div>
                      </Show>
                      <div className="mt-2">{updated} 看过</div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap max-w-full">
                        <div
                          className="py-1 px-2 text-[12px] leading-none rounded-lg break-keep whitespace-nowrap border dark:border-black-200"
                          style={{
                            lineHeight: "12px",
                          }}
                        >
                          {tv_id ? "电视剧" : "电影"}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
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
                          if (!nodes.length) {
                            return null;
                          }
                          return <div className="mt-4">{nodes}</div>;
                        })()}
                      </div>
                    </div>
                  </Node>
                );
              })}
            </ListView>
          </div>
        </div>
      </ScrollView>
      {/* <BackToTop store={scrollView} /> */}
      <Dialog store={deletingConfirmDialog}>
        <div>确认删除吗？</div>
      </Dialog>
    </>
  );
};
