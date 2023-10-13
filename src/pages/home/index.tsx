/**
 * @file 首页
 */
import React, { useState } from "react";
import { Bird } from "lucide-react";

import { fetchCollectionList, fetchUpdatedMediaToday } from "@/services";
import { Skeleton, ListView, ScrollView, LazyImage, BackToTop, Button } from "@/components/ui";
import { MediaRequestCore } from "@/components/media-request";
import { ScrollViewCore, InputCore, ButtonCore } from "@/domains/ui";
import { MediaTypes, fetchPlayingHistories } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { moviePlayingPage, rootView, tvPlayingPage } from "@/store";

export const HomeIndexPage: ViewComponent = React.memo((props) => {
  const { app, router, view } = props;

  const collectionList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchCollectionList), {
        pageSize: 6,
        onLoadingChange(loading) {
          searchInput.setLoading(!collectionList.response.initial && loading);
        },
      })
  );
  const updatedMediaList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchUpdatedMediaToday), {
        pageSize: 12,
      })
  );
  const historyList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchPlayingHistories), {
        pageSize: 12,
      })
  );
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        async onPullToRefresh() {
          updatedMediaList.refresh();
          historyList.refresh();
          await collectionList.refresh();
          app.tip({
            text: ["刷新成功"],
          });
          scrollView.stopPullToRefresh();
        },
        onReachBottom() {
          collectionList.loadMore();
        },
      })
  );
  const searchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索电视剧",
        onEnter(v) {
          collectionList.search({
            name: v,
          });
        },
        onBlur(v) {
          collectionList.search({
            name: v,
          });
        },
        onClear() {
          // console.log("[PAGE]home/index - onClear", helper, helper.response.search);
          collectionList.search({
            name: "",
          });
        },
      })
  );
  const mediaRequest = useInstance(() => new MediaRequestCore({}));
  const mediaRequestBtn = useInstance(
    () =>
      new ButtonCore({
        onClick() {
          mediaRequest.input.change(searchInput.value);
          mediaRequest.dialog.show();
        },
      })
  );

  const [response, setResponse] = useState(collectionList.response);
  const [updatedMediaListState, setUpdatedMediaListState] = useState(updatedMediaList.response);
  const [historyState, setHistoryState] = useState(historyList.response);
  const [hasSearch, setHasSearch] = useState(
    (() => {
      const { language = [] } = app.cache.get("tv_search", {
        language: [] as string[],
      });
      return language.length !== 0;
    })()
  );

  // const [history_response] = useState(history_helper.response);
  useInitialize(() => {
    collectionList.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    updatedMediaList.onStateChange((nextState) => {
      setUpdatedMediaListState(nextState);
    });
    historyList.onStateChange((nextState) => {
      setHistoryState(nextState);
    });
    mediaRequest.onTip((msg) => {
      app.tip(msg);
    });
    const search = (() => {
      const { language = [] } = app.cache.get("tv_search", {
        language: [] as string[],
      });
      if (!language.length) {
        return {};
      }
      return {
        language: language.join("|"),
      };
    })();
    collectionList.init(search);
    updatedMediaList.init();
    historyList.init();
  });

  const { dataSource } = response;

  // console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <ScrollView store={scrollView} className="dark:text-black-200">
        <div className="w-full h-full">
          <ListView
            store={collectionList}
            className="relative h-[50%] mt-4 space-y-6"
            skeleton={
              <>
                <div className="py-2">
                  <div className="px-4">
                    <Skeleton className="h-[32px] w-[188px] dark:bg-gray-800"></Skeleton>
                  </div>
                  <div className="flex mt-2 w-screen overflow-x-auto px-4 space-x-3 hide-scroll">
                    <div>
                      <div className="relative rounded-lg overflow-hidden">
                        <Skeleton className="w-[138px] h-[207px] object-cover dark:bg-gray-800" />
                      </div>
                      <div className="mt-2 flex-1 max-w-full overflow-hidden">
                        <div className="flex items-center overflow-hidden text-ellipsis">
                          <Skeleton className="h-[28px] w-[80px] dark:bg-gray-800"></Skeleton>
                        </div>
                        <Skeleton className="mt-1 h-[18px] w-[36px] dark:bg-gray-800"></Skeleton>
                      </div>
                    </div>
                    <div>
                      <div className="relative rounded-lg overflow-hidden">
                        <Skeleton className="w-[138px] h-[207px] object-cover dark:bg-gray-800" />
                      </div>
                      <div className="mt-2 flex-1 max-w-full overflow-hidden">
                        <div className="flex items-center overflow-hidden text-ellipsis">
                          <Skeleton className="h-[28px] w-[80px] dark:bg-gray-800"></Skeleton>
                        </div>
                        <Skeleton className="mt-1 h-[18px] w-[36px] dark:bg-gray-800"></Skeleton>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <div className="px-4">
                    <Skeleton className="h-[32px] w-[188px] dark:bg-gray-800"></Skeleton>
                  </div>
                  <div className="flex mt-2 w-screen overflow-x-auto px-4 space-x-2 hide-scroll">
                    <div>
                      <div className="relative w-[240px] h-[135px] rounded-lg overflow-hidden">
                        <Skeleton className="w-full h-full  dark:bg-gray-800" />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Skeleton className="h-[28px] w-[64px] dark:bg-gray-800"></Skeleton>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            }
            extraEmpty={
              <div className="mt-2">
                <Button store={mediaRequestBtn} variant="subtle">
                  提交想看的电视剧
                </Button>
              </div>
            }
          >
            {(() => {
              if (response.initial) {
                return null;
              }
              return (
                <>
                  <div className="flex py-2">
                    <div>
                      <div className="px-4">
                        <h2 className="text-2xl dark:text-white">📆今日更新</h2>
                      </div>
                      <div className="flex mt-2 w-screen min-h-[248px] overflow-x-auto px-4 space-x-3 hide-scroll">
                        {(() => {
                          if (updatedMediaListState.empty) {
                            return (
                              <div className="flex items-center justify-center w-full h-full mt-[68px]">
                                <div className="flex flex-col items-center justify-center text-slate-500">
                                  <Bird className="w-16 h-16" />
                                  <div className="mt-2 text-xl">暂无数据</div>
                                </div>
                              </div>
                            );
                          }
                          return updatedMediaListState.dataSource.map((media) => {
                            const { id, name, type, tv_id, poster_path, text, air_date } = media;
                            return (
                              <div
                                key={id}
                                className="w-[138px]"
                                onClick={() => {
                                  if (type === MediaTypes.TV && tv_id) {
                                    tvPlayingPage.query = {
                                      id: tv_id,
                                      season_id: id,
                                    };
                                    rootView.layerSubView(tvPlayingPage);
                                  }
                                  if (type === MediaTypes.Movie) {
                                    moviePlayingPage.params = {
                                      id,
                                    };
                                    rootView.layerSubView(moviePlayingPage);
                                  }
                                }}
                              >
                                <div className="relative w-[138px] h-[207px] rounded-lg overflow-hidden">
                                  <LazyImage className="w-full h-full object-cover" src={poster_path} alt={name} />
                                  {text && (
                                    <div className="absolute bottom-0 flex flex-row-reverse items-center w-full h-[24px] px-2 text-sm text-right text-white bg-gradient-to-t from-black to-transparent">
                                      <div className="text-[12px] text-white-900" style={{ lineHeight: "12px" }}>
                                        {text}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 flex-1 max-w-full overflow-hidden">
                                  <div className="flex items-center overflow-hidden text-ellipsis">
                                    <h2 className="break-all text-lg truncate">{name}</h2>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="text-sm">{air_date}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex py-2">
                    <div>
                      <div className="px-4">
                        <h2 className="text-2xl dark:text-white">🎬最近观看</h2>
                      </div>
                      <div className="flex mt-2 w-screen min-h-[184px] overflow-x-auto px-4 space-x-3 hide-scroll">
                        {(() => {
                          if (historyState.empty) {
                            return (
                              <div className="flex items-center justify-center w-full h-full mt-[68px]">
                                <div className="flex flex-col items-center justify-center text-slate-500">
                                  <Bird className="w-16 h-16" />
                                  <div className="mt-2 text-xl">暂无数据</div>
                                </div>
                              </div>
                            );
                          }
                          return historyState.dataSource.map((history) => {
                            const {
                              id,
                              type,
                              name,
                              percent,
                              tv_id,
                              season_id,
                              movie_id,
                              poster_path,
                              updated,
                              thumbnail,
                            } = history;
                            return (
                              <div
                                key={id}
                                onClick={() => {
                                  if (type === MediaTypes.TV && tv_id) {
                                    tvPlayingPage.query = {
                                      id: tv_id,
                                      season_id,
                                    };
                                    rootView.layerSubView(tvPlayingPage);
                                  }
                                  if (type === MediaTypes.Movie && movie_id) {
                                    moviePlayingPage.params = {
                                      id: movie_id,
                                    };
                                    rootView.layerSubView(moviePlayingPage);
                                  }
                                }}
                              >
                                <div className="relative w-[240px] h-[148px] rounded-lg overflow-hidden">
                                  <LazyImage className="w-full h-full object-cover" src={thumbnail} alt={name} />
                                  <div className="absolute bottom-0 flex flex-row-reverse items-center w-full h-[32px] px-2 text-sm text-right text-white bg-gradient-to-t from-black to-transparent">
                                    <div className="">看到{percent}%</div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="text-lg">{name}</div>
                                  {/* <div className="mr-4 text-sm">{updated}</div> */}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
            {(() => {
              return dataSource.map((collection) => {
                const { id, title, desc, medias } = collection;
                return (
                  <div key={id} className="flex py-2">
                    <div>
                      <div className="px-4">
                        <h2 className="text-2xl dark:text-white">{title}</h2>
                        {desc && <div>{desc}</div>}
                      </div>
                      <div className="flex mt-2 w-screen min-h-[248px] overflow-x-auto px-4 space-x-3 hide-scroll">
                        {(() => {
                          if (medias.length === 0) {
                            return (
                              <div className="flex items-center justify-center w-full h-full mt-[68px]">
                                <div className="flex flex-col items-center justify-center text-slate-500">
                                  <Bird className="w-16 h-16" />
                                  <div className="mt-2 text-xl">暂无数据</div>
                                </div>
                              </div>
                            );
                          }
                          return medias.map((media) => {
                            const { id, name, type, tv_id, poster_path, text: episode_count_text, air_date } = media;
                            return (
                              <div
                                key={id}
                                className="w-[128px]"
                                onClick={() => {
                                  if (type === MediaTypes.TV && tv_id) {
                                    tvPlayingPage.query = {
                                      id: tv_id,
                                      season_id: id,
                                    };
                                    rootView.layerSubView(tvPlayingPage);
                                    return;
                                  }
                                  if (type === MediaTypes.Movie) {
                                    moviePlayingPage.params = {
                                      id,
                                    };
                                    rootView.layerSubView(moviePlayingPage);
                                    return;
                                  }
                                  app.tip({
                                    text: ["数据异常"],
                                  });
                                }}
                              >
                                <div className="relative w-[128px] h-[192px] rounded-lg overflow-hidden">
                                  <LazyImage className="w-full h-full object-cover" src={poster_path} alt={name} />
                                  {episode_count_text && (
                                    <div className="z-20 absolute bottom-1 right-1">
                                      <div className="inline-flex items-center py-1 px-2 rounded-sm">
                                        <div className="text-[12px] text-white-900" style={{ lineHeight: "12px" }}>
                                          {episode_count_text}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 flex-1 max-w-full overflow-hidden">
                                  <div className="flex items-center overflow-hidden text-ellipsis">
                                    <h2 className="break-all text-lg truncate">{name}</h2>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="text-sm">{air_date}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </ListView>
        </div>
      </ScrollView>
      <BackToTop store={scrollView} />
    </>
  );
});
