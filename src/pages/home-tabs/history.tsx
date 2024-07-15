/**
 * @file 播放历史记录页面
 */
import React, { useRef, useState } from "react";
import { Star } from "lucide-react";

import { ViewComponentPropsWithMenu, ViewComponentWithMenu } from "@/store/types";
import { useInitialize, useInstance } from "@/hooks/index";
import { Show } from "@/packages/ui/show";
import { ScrollView, Skeleton, LazyImage, ListView, Dialog, Node, BackToTop } from "@/components/ui";
import {
  PlayHistoryItem,
  deleteHistory,
  fetchPlayingHistories,
  fetchPlayingHistoriesProcess,
} from "@/biz/media/services";
import { ScrollViewCore, DialogCore, NodeInListCore, ImageInListCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { RefCore } from "@/domains/cur";
import { MediaTypes } from "@/constants/index";
import { cn } from "@/utils/index";

function Page(props: ViewComponentPropsWithMenu) {
  const { app, client, history, menu } = props;

  const $scroll = new ScrollViewCore({
    os: app.env,
    async onPullToRefresh() {
      await $list.refresh();
      $scroll.finishPullToRefresh();
    },
    async onReachBottom() {
      await $list.loadMore();
      $scroll.finishLoadingMore();
    },
  });
  const $list = new ListCore(
    new RequestCore(fetchPlayingHistories, {
      process: fetchPlayingHistoriesProcess,
      client,
    }),
    {
      pageSize: 20,
    }
  );
  const $cur = new RefCore<PlayHistoryItem>();
  const $deletingConfirmDialog = new DialogCore({
    onOk() {
      if (!$cur.value) {
        return;
      }
      $deletingRequest.run({ history_id: $cur.value.id });
    },
  });
  const $deletingRequest = new RequestCore(deleteHistory, {
    client,
    onLoading(loading) {
      $deletingConfirmDialog.okBtn.setLoading(loading);
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
      $deletingConfirmDialog.hide();
      $list.deleteItem((history) => {
        if (history.id === $cur.value?.id) {
          return true;
        }
        return false;
      });
      $cur.clear();
    },
  });
  const $poster = new ImageInListCore();
  const $card = new NodeInListCore<PlayHistoryItem>({
    onClick(record) {
      if (!record) {
        return;
      }
      const { type, media_id } = record;
      if (type === MediaTypes.Season) {
        history.push("root.season_playing", { id: media_id });
        return;
      }
      if (type === MediaTypes.Movie) {
        history.push("root.movie_playing", { id: media_id });
        return;
      }
    },
    // onLongPress(record) {
    //   console.log("123");
    //   alert(record?.name);
    // },
  });
  const $thumbnail = new ImageInListCore({
    scale: 1.38,
  });
  return {
    $list,
    ui: {
      $scroll,
      $deletingConfirmDialog,
      $poster,
      $thumbnail,
      $card,
    },
    ready() {
      $list.init();
    },
    handleClickHistory(record: PlayHistoryItem) {
      const { type, media_id } = record;
      if (type === MediaTypes.Season) {
        history.push("root.season_playing", { id: media_id });
        return;
      }
      if (type === MediaTypes.Movie) {
        history.push("root.movie_playing", { id: media_id });
        return;
      }
    },
  };
}

export const HomeHistoryTabContent: ViewComponentWithMenu = React.memo((props) => {
  const { app, client, history, view, menu } = props;

  const $page = useInstance(() => Page(props));

  const [response, setResponse] = useState($page.$list.response);
  const showTipRef = useRef(false);
  const [showTip, setShowTip] = useState(false);

  useInitialize(() => {
    if (menu) {
      menu.onScrollToTop(() => {
        $page.ui.$scroll.scrollTo({ top: 0 });
      });
      menu.onRefresh(async () => {
        $page.ui.$scroll.startPullToRefresh();
        await $page.$list.refresh();
        $page.ui.$scroll.finishPullToRefresh();
      });
    }
    $page.ui.$scroll.onScroll((pos) => {
      let nextShowTip = false;
      if (pos.scrollTop > app.screen.height) {
        nextShowTip = true;
      }
      if (showTipRef.current === nextShowTip) {
        return;
      }
      showTipRef.current = nextShowTip;
      setShowTip(nextShowTip);
    });
    $page.$list.onStateChange((v) => setResponse(v));
    $page.ready();
  });

  return (
    <>
      <ScrollView className="h-full bg-w-bg-3" store={$page.ui.$scroll}>
        <ListView
          store={$page.$list}
          className="grid grid-cols-2 gap-2 px-3 pt-4"
          skeleton={
            <>
              <div className="relative w-full rounded-lg">
                <div className="relative w-full h-[124px] overflow-hidden rounded-t-md">
                  <Skeleton className="w-full h-full object-cover" />
                </div>
                <div className="py-2 pb-4">
                  <Skeleton className="w-[68%] h-[24px]"></Skeleton>
                  <Skeleton className="mt-2 w-[20%] h-[18px]"></Skeleton>
                </div>
              </div>
              <div className="relative w-full rounded-lg">
                <div className="relative w-full h-[124px] overflow-hidden rounded-t-md">
                  <Skeleton className="w-full h-full object-cover" />
                </div>
                <div className="py-2 pb-4">
                  <Skeleton className="w-[38%] h-[24px]"></Skeleton>
                  <Skeleton className="mt-2 w-[72%] h-[18px]"></Skeleton>
                </div>
              </div>
            </>
          }
        >
          {response.dataSource.map((record) => {
            return (
              <div key={record.id} className="relative flex w-full cursor-pointer select-none">
                <div
                  className="relative w-full bg-w-bg-2 rounded-lg"
                  onClick={() => {
                    $page.handleClickHistory(record);
                  }}
                >
                  <div className="relative w-full h-[124px] overflow-hidden rounded-t-md">
                    <LazyImage
                      className="w-full h-full object-cover"
                      store={$page.ui.$thumbnail.bind(record.thumbnail_path)}
                      alt={record.name}
                    />
                    <div className="absolute w-full top-0 flex flex-row-reverse items-center">
                      {/* <div className="absolute z-10 inset-0 opacity-80 bg-gradient-to-t to-transparent from-w-fg-0 dark:from-w-bg-0"></div> */}
                      <div className="relative z-20 p-2 text-[12px] text-w-bg-0 dark:text-w-fg-0">
                        {record.episodeCountText}
                      </div>
                    </div>
                    <div className="absolute bottom-0 w-full">
                      <div
                        className="w-full h-[2px] rounded-md bg-w-brand"
                        style={{ width: `${record.percent}%` }}
                      ></div>
                    </div>
                    <div className="absolute bottom-2 right-2 text-[12px] text-w-bg-0 dark:text-w-fg-0">{record.percent}%</div>
                  </div>
                  <Show when={!!record.hasUpdate}>
                    <div className="absolute top-2 left-2">
                      <div className="huizhang">更新</div>
                    </div>
                  </Show>
                  <div className="p-2 pb-2">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-w-fg-0">{record.name}</div>
                    <div className="flex items-center mt-1 text-sm text-w-fg-1">
                      {record.updated}
                      <Show when={!!record.episodeText}>
                        <>
                          <p className="mx-1">·</p>
                          <p className="">{record.episodeText}</p>
                        </>
                      </Show>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </ListView>
      </ScrollView>
      <BackToTop
        visible={showTip}
        onClick={() => {
          $page.ui.$scroll.scrollTo({ top: 0 });
        }}
      />
      <div
        className={cn("z-100 fixed right-4 bottom-48", showTip ? "block" : "hidden")}
        style={{ zIndex: 100 }}
        onClick={() => {
          history.push("root.history_updated");
        }}
      >
        <div className="flex flex-col items-center justify-center w-[64px] h-[64px] rounded-full bg-w-bg-0 opacity-100">
          <Star className="w-6 h-6" />
        </div>
      </div>
      <Dialog store={$page.ui.$deletingConfirmDialog}>
        <div>确认删除吗？</div>
      </Dialog>
    </>
  );
});
