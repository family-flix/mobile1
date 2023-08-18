/**
 * @file 我的播放历史页面
 */
import React, { useState } from "react";
import { MoreVertical } from "lucide-react";

import { ScrollView, Skeleton, LazyImage, ListView, BackToTop, Dialog, Node } from "@/components/ui";
import { ScrollViewCore, DialogCore, NodeInListCore } from "@/domains/ui";
import { PlayHistoryItem, delete_history, fetch_play_histories } from "@/domains/tv/services";
import { SelectionCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";

export const HomeHistoryPage: ViewComponent = (props) => {
  const { app, router, view } = props;
  // const [response, helper] = useHelper<PlayHistoryItem>(fetch_play_histories);
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
  const scrollView = useInstance(() => new ScrollViewCore({}));
  const historyCard = useInstance(
    () =>
      new NodeInListCore<PlayHistoryItem>({
        onClick(history) {
          if (!history) {
            return;
          }
          const { tv_id } = history;
          router.push(`/tv/play/${tv_id}`);
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
    // page.onReady(() => {
    //   helper.init();
    // });
    view.onReady(() => {
      console.log("home/history ready");
    });
    view.onMounted(() => {
      console.log("home/history mounted");
    });
    view.onShow(() => {
      console.log("home/history show");
      // helper.refresh();
    });
    view.onHidden(() => {
      console.log("home/history hide");
    });
    scrollView.onPullToRefresh(async () => {
      await helper.refresh();
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      helper.loadMore();
    });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    helper.init();
  });

  const { dataSource } = response;

  return (
    <>
      <ScrollView store={scrollView} className="dark:text-black-200">
        <div className="pt-4">
          <div className="">
            <ListView
              store={helper}
              className="grid grid-cols-1 space-y-4 p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              skeleton={
                <>
                  <div className="flex cursor-pointer">
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
                  tv_id,
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
                        className="absolute bottom-0 h-full bg-gray-600 opacity-50"
                        style={{ width: `${percent}%` }}
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
                      <h2 className="text-2xl dark:text-white">{name}</h2>
                      <div className="flex items-center mt-2 text-xl">
                        <p className="">{episode}</p>
                        <p className="mx-2">·</p>
                        <p className="">{season}</p>
                      </div>
                      <div className="mt-2">{updated} 看过</div>
                      <div className="flex items-center mt-4 space-x-2">
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
                          return nodes;
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
      <BackToTop store={scrollView} />
      <Dialog store={deletingConfirmDialog}>
        <div>确认删除吗？</div>
      </Dialog>
    </>
  );
};
