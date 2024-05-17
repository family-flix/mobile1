/**
 * @file 播放历史记录页面
 */
import React, { useState } from "react";
import { ArrowLeft, ArrowUp, MoreHorizontal, MoreVertical } from "lucide-react";

import { fetchUpdatedMediaHasHistory, fetchUpdatedMediaHasHistoryProcess } from "@/services/index";
import { ViewComponentProps, ViewComponentWithMenu } from "@/store/types";
import { ScrollView, Skeleton, LazyImage, ListView, Dialog, Node } from "@/components/ui";
import { Affix } from "@/components/ui/affix";
import { AffixCore } from "@/domains/ui/affix";
import { Show } from "@/components/ui/show";
import { useInitialize, useInstance } from "@/hooks/index";
import { RequestCore } from "@/domains/request/index";
import { ListCore } from "@/domains/list/index";
import { ScrollViewCore, DialogCore, ImageInListCore } from "@/domains/ui";
import { PlayHistoryItem, deleteHistory } from "@/domains/media/services";
import { RefCore } from "@/domains/cur/index";

function Page(props: ViewComponentProps) {
  const { app, client } = props;

  const $historyList = new ListCore(
    new RequestCore(fetchUpdatedMediaHasHistory, {
      process: fetchUpdatedMediaHasHistoryProcess,
      client,
    }),
    {
      pageSize: 40,
    }
  );
  const $delete = new RequestCore(deleteHistory, {
    client,
    onLoading(loading) {
      $deletingDialog.okBtn.setLoading(loading);
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
      $deletingDialog.hide();
      $historyList.deleteItem((history) => {
        if (history.id === $cur.value?.id) {
          return true;
        }
        return false;
      });
      $cur.clear();
    },
  });
  const $deletingDialog = new DialogCore({
    onOk() {
      if (!$cur.value) {
        return;
      }
      $delete.run({ history_id: $cur.value.id });
    },
  });
  const $cur = new RefCore<PlayHistoryItem>();
  const $scroll = new ScrollViewCore({
    os: app.env,
    async onPullToRefresh() {
      await $historyList.refresh();
      $scroll.finishPullToRefresh();
    },
    async onReachBottom() {
      await $historyList.loadMore();
      $scroll.finishLoadingMore();
    },
  });
  const $thumbnail = new ImageInListCore({
    scale: 1.38,
  });
  const $affix = new AffixCore({ top: 0 });

  return {
    $historyList,
    ui: {
      $scroll,
      $affix,
      $deletingDialog,
      $thumbnail,
    },
  };
}

export const UpdatedHistoryListPage: ViewComponentWithMenu = React.memo((props) => {
  const { app, client, history, view } = props;

  const $page = useInstance(() => Page(props));

  const [response, setResponse] = useState($page.$historyList.response);

  useInitialize(() => {
    // console.log("[PAGE]history - useInitialize");
    $page.$historyList.onStateChange((v) => setResponse(v));
    $page.$historyList.init();
  });

  const { dataSource } = response;

  return (
    <>
      <Affix store={$page.ui.$affix} className="z-50 w-full bg-w-bg-0">
        <div className="z-100 flex items-center justify-between w-full p-4">
          <div className="flex items-center cursor-pointer">
            <div
              className="inline-block"
              onClick={() => {
                history.back();
              }}
            >
              <ArrowLeft className="w-6 h-6" />
            </div>
          </div>
        </div>
      </Affix>
      <ScrollView className="h-full bg-w-bg-3" store={$page.ui.$scroll}>
        <ListView
          store={$page.$historyList}
          className="grid grid-cols-2 gap-2 px-3 md:grid-cols-4 xl:grid-cols-6 pt-4"
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
          {dataSource.map((record) => {
            const { id, name, thumbnail_path, latest_episode, cur_episode, episode_added } = record;
            return (
              <div key={id} className="relative flex w-full cursor-pointer select-none">
                <div
                  key={id}
                  className="relative w-full bg-w-bg-2 rounded-lg"
                  onClick={() => {
                    history.push("root.season_playing", { id });
                    return;
                  }}
                >
                  <div className="relative w-full h-[124px] overflow-hidden rounded-t-md">
                    <LazyImage
                      className="w-full h-full object-cover"
                      store={$page.ui.$thumbnail.bind(thumbnail_path)}
                      alt={name}
                    />
                  </div>
                  <div className="absolute top-2 left-2">
                    <div className="huizhang">{episode_added}集未看</div>
                  </div>
                  <div className="p-2 pb-4">
                    <div className="text-w-fg-0 truncate text-ellipsis">{name}</div>
                    <div className="flex items-center mt-2 text-sm text-w-fg-1 truncate text-ellipsis">
                      <p className="">当前</p>
                      <p className="mx-1">·</p>
                      <p className=" truncate text-ellipsis">{cur_episode.name}</p>
                    </div>
                    <div className="flex items-center text-sm text-w-fg-1 truncate text-ellipsis">
                      <p className="">最新</p>
                      <p className="mx-1">·</p>
                      <p className=" truncate text-ellipsis">{latest_episode.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </ListView>
      </ScrollView>
      <Dialog store={$page.ui.$deletingDialog}>
        <div>确认删除吗？</div>
      </Dialog>
    </>
  );
});
