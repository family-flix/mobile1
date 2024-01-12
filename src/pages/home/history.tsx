/**
 * @file 我的播放历史页面
 */
import React, { useState } from "react";
import { ArrowUp, MoreHorizontal, MoreVertical } from "lucide-react";

import { ScrollView, Skeleton, LazyImage, ListView, Dialog, Node } from "@/components/ui";
import { ScrollViewCore, DialogCore, NodeInListCore, ImageInListCore } from "@/domains/ui";
import { PlayHistoryItem, delete_history, fetchPlayingHistories } from "@/domains/media/services";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { moviePlayingPage, moviePlayingPageV2, rootView, seasonPlayingPageV2, tvPlayingPage } from "@/store";
import { MediaTypes } from "@/constants";
import { ViewComponent, ViewComponentWithMenu } from "@/types";
import { Show } from "@/components/ui/show";

export const HomeHistoryPage: ViewComponentWithMenu = (props) => {
  const { app, router, view, menu } = props;

  const historyList = useInstance(() => new ListCore(new RequestCore(fetchPlayingHistories)));
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
          historyList.deleteItem((history) => {
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
  const poster = useInstance(() => new ImageInListCore());
  const cur = useInstance(() => new RefCore<PlayHistoryItem>());
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onScroll(pos) {
          if (!menu) {
            return;
          }
          if (pos.scrollTop > app.screen.height) {
            menu.setCanTop({
              icon: <ArrowUp className="w-6 h-6" />,
              text: "回到顶部",
            });
            return;
          }
          if (pos.scrollTop === 0) {
            menu.setCanRefresh();
            return;
          }
          menu.disable();
        },
        // async onPullToRefresh() {
        //   await historyList.refresh();
        //   scrollView.stopPullToRefresh();
        // },
        onReachBottom() {
          historyList.loadMore();
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
          const { type, media_id } = history;
          if (type === MediaTypes.Season) {
            seasonPlayingPageV2.query = {
              id: media_id,
            };
            app.showView(seasonPlayingPageV2);
            return;
          }
          if (type === MediaTypes.Movie) {
            moviePlayingPageV2.query = {
              id: media_id,
            };
            app.showView(moviePlayingPageV2);
            return;
          }
        },
        // onLongPress(record) {
        //   console.log("123");
        //   alert(record?.name);
        // },
      })
  );

  const [response, setResponse] = useState(historyList.response);

  useInitialize(() => {
    if (menu) {
      menu.onScrollToTop(() => {
        scrollView.scrollTo({ top: 0 });
      });
      menu.onRefresh(async () => {
        scrollView.startPullToRefresh();
        await historyList.refresh();
        scrollView.stopPullToRefresh();
      });
    }
    // console.log("[PAGE]history - useInitialize");
    historyList.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    historyList.init();
  });

  const { dataSource } = response;

  return (
    <>
      <ScrollView store={scrollView} className="">
        <div className="min-h-screen w-full">
          <div className="">
            <ListView
              store={historyList}
              className="grid grid-cols-1 space-y-3 px-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              skeleton={
                <>
                  <div className="flex py-2 cursor-pointer">
                    <Skeleton className="relative w-[128px] h-[198px] mr-4"></Skeleton>
                    <div className="relative flex-1 mt-2">
                      <Skeleton className="w-full h-[32px]"></Skeleton>
                      <div className="flex items-center mt-2 text-xl">
                        <Skeleton className="w-24 h-[28px]"></Skeleton>
                      </div>
                      <Skeleton className="mt-2 w-36 h-[24px]"></Skeleton>
                    </div>
                  </div>
                </>
              }
            >
              {dataSource.map((history) => {
                const { id, type, name, poster_path, updated, episode_text, episode_count_text, has_update, percent } =
                  history;
                return (
                  <Node
                    key={id}
                    store={historyCard.bind(history)}
                    className="relative flex py-2 cursor-pointer select-none"
                  >
                    <div className="z-50 absolute right-2 bottom-2">
                      <div
                        className="px-2 py-1 bg-w-bg-2 rounded-md"
                        onClick={(event) => {
                          event.stopPropagation();
                          cur.select(history);
                          deletingConfirmDialog.show();
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="z-10 relative w-[128px] h-[198px] rounded-lg overflow-hidden mr-4">
                      <LazyImage className="w-full h-full object-cover" store={poster.bind(poster_path)} alt={name} />
                      <div
                        className="absolute w-full bottom-0 bg-gray-600 opacity-50"
                        style={{ height: `${percent}%` }}
                      ></div>
                      {(() => {
                        if (episode_count_text) {
                          return (
                            <div className="absolute w-full bottom-0 flex flex-row-reverse items-center">
                              <div className="absolute z-10 inset-0 opacity-80 bg-gradient-to-t to-transparent from-w-fg-0 dark:from-w-bg-0"></div>
                              <div className="relative z-20 p-2 pt-6 text-[12px] text-w-bg-1 dark:text-w-fg-1">
                                {episode_count_text}
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                    {(() => {
                      if (has_update) {
                        return (
                          <div className="absolute z-50 left-[-4px] top-6">
                            <div className="huizhang">有更新</div>
                          </div>
                        );
                      }
                    })()}
                    <div className="relative flex-1 max-w-sm overflow-hidden text-ellipsis">
                      <h2 className="text-xl">
                        <span className="text-w-fg-0">{name}</span>
                      </h2>
                      <Show when={!!episode_text}>
                        <div className="flex items-center mt-2">
                          <p className="">{episode_text}</p>
                        </div>
                      </Show>
                      <div className="mt-2">{updated} 看过</div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap max-w-full">
                        <div
                          className="py-1 px-2 text-[12px] leading-none rounded-lg break-keep whitespace-nowrap border border-w-fg-1"
                          style={{
                            lineHeight: "12px",
                          }}
                        >
                          {(() => {
                            if (type === MediaTypes.Season) {
                              return "电视剧";
                            }
                            if (type === MediaTypes.Movie) {
                              return "电影";
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </Node>
                );
              })}
            </ListView>
          </div>
        </div>
      </ScrollView>
      <Dialog store={deletingConfirmDialog}>
        <div>确认删除吗？</div>
      </Dialog>
    </>
  );
};
