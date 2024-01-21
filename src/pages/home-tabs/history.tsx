/**
 * @file 播放历史记录页面
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

export const HomeHistoryTabContent: ViewComponentWithMenu = (props) => {
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
          //   if (!history) {
          //     return;
          //   }
          //   const { type, media_id } = history;
          //   if (type === MediaTypes.Season) {
          //     seasonPlayingPageV2.query = {
          //       id: media_id,
          //     };
          //     app.showView(seasonPlayingPageV2);
          //     return;
          //   }
          //   if (type === MediaTypes.Movie) {
          //     moviePlayingPageV2.query = {
          //       id: media_id,
          //     };
          //     app.showView(moviePlayingPageV2);
          //     return;
          //   }
        },
        // onLongPress(record) {
        //   console.log("123");
        //   alert(record?.name);
        // },
      })
  );
  const thumbnail = useInstance(
    () =>
      new ImageInListCore({
        scale: 1.38,
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
      <ScrollView className="h-full bg-w-bg-3" store={scrollView}>
        <ListView
          store={historyList}
          className="grid grid-cols-2 gap-2 px-3 md:grid-cols-4 xl:grid-cols-6 pt-4"
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
            const {
              id,
              type,
              name,
              percent,
              media_id,
              episodeText,
              episodeCountText,
              posterPath,
              updated,
              hasUpdate,
              airDate,
              thumbnail_path,
            } = history;
            return (
              <Node
                key={id}
                store={historyCard.bind(history)}
                className="relative flex w-full cursor-pointer select-none"
              >
                <div
                  key={id}
                  className="relative w-full bg-w-bg-2 rounded-lg"
                  onClick={() => {
                    if (type === MediaTypes.Season) {
                      seasonPlayingPageV2.query = {
                        id: media_id,
                      };
                      app.showView(seasonPlayingPageV2);
                    }
                    if (type === MediaTypes.Movie) {
                      moviePlayingPageV2.query = {
                        id: media_id,
                      };
                      app.showView(moviePlayingPageV2);
                    }
                  }}
                >
                  <div className="relative w-full h-[124px] overflow-hidden rounded-t-md">
                    <LazyImage
                      className="w-full h-full object-cover"
                      store={thumbnail.bind(thumbnail_path)}
                      alt={name}
                    />
                    <div className="absolute w-full top-0 flex flex-row-reverse items-center">
                      {/* <div className="absolute z-10 inset-0 opacity-80 bg-gradient-to-t to-transparent from-w-fg-0 dark:from-w-bg-0"></div> */}
                      <div className="relative z-20 p-2 text-[12px] text-w-bg-0 dark:text-w-fg-0">
                        {episodeCountText}
                      </div>
                    </div>
                    <div className="absolute bottom-0 w-full">
                      <div className="w-full h-[2px] rounded-md bg-w-brand" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                  <Show when={!!hasUpdate}>
                    <div className="absolute top-2 left-2">
                      <div className="huizhang">更新</div>
                    </div>
                  </Show>
                  <div className="p-2 pb-4">
                    <div className="text-w-fg-0">{name}</div>
                    <div className="flex items-center mt-2 text-[12px] text-w-fg-1">
                      {updated}
                      <p className="mx-1">·</p>
                      <Show when={!!episodeText}>
                        <p className="">{episodeText}</p>
                        <p className="mx-1">·</p>
                      </Show>
                      {percent}%
                    </div>
                  </div>
                </div>
              </Node>
            );
          })}
        </ListView>
      </ScrollView>
      <Dialog store={deletingConfirmDialog}>
        <div>确认删除吗？</div>
      </Dialog>
    </>
  );
};