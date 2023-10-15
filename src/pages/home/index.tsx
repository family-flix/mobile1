/**
 * @file 首页
 */
import React, { useState } from "react";
import { ArrowUp, Bird } from "lucide-react";

import { fetchCollectionList, fetchUpdatedMediaToday } from "@/services";
import { Skeleton, ListView, ScrollView, LazyImage, BackToTop, Button } from "@/components/ui";
import { MediaRequestCore } from "@/components/media-request";
import { ScrollViewCore, InputCore, ButtonCore } from "@/domains/ui";
import { MediaTypes, fetchPlayingHistories } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent, ViewComponentWithMenu } from "@/types";
import { moviePlayingPage, rootView, tvPlayingPage } from "@/store";
import { cn } from "@/utils";
import { Show } from "@/components/ui/show";

export const HomeIndexPage: ViewComponentWithMenu = React.memo((props) => {
  const { app, router, view, menu } = props;

  const collectionList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchCollectionList), {
        pageSize: 6,
        onLoadingChange(loading) {
          searchInput.setLoading(!collectionList.response.initial && loading);
        },
      })
  );
  const updatedMediaList = useInstance(() => new RequestCore(fetchUpdatedMediaToday));
  const historyList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchPlayingHistories), {
        pageSize: 12,
      })
  );
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
          menu.recover();
        },
        async onPullToRefresh() {
          updatedMediaList.reload();
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
    if (menu) {
      menu.onScrollToTop(() => {
        scrollView.scrollTo({ top: 0 });
      });
      menu.onRefresh(() => {
        scrollView.startPullToRefresh();
      });
    }
    collectionList.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    updatedMediaList.onSuccess((nextState) => {
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
    updatedMediaList.run();
    historyList.init();
  });

  const { dataSource } = response;

  // console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <ScrollView store={scrollView} className="bg-w-bg-0">
        <div className="w-full h-full">
          <ListView
            store={collectionList}
            className="relative h-[50%] space-y-3"
            skeleton={
              <>
                <div className="py-2">
                  <div className="px-4">
                    <Skeleton className="h-[32px] w-[188px]"></Skeleton>
                  </div>
                  <div className={cn("flex mt-2 px-4 space-x-3")}>
                    <div>
                      <div className="relative rounded-lg overflow-hidden">
                        <Skeleton className="w-[138px] h-[265px] object-cover" />
                      </div>
                    </div>
                    <div>
                      <div className="relative rounded-lg overflow-hidden">
                        <Skeleton className="w-[138px] h-[265px] object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <div className="px-4">
                    <Skeleton className="h-[32px] w-[188px]"></Skeleton>
                  </div>
                  <div className={cn("flex mt-2 px-4 space-x-2 hide-scroll")}>
                    <div>
                      <div className="relative w-[240px] h-[206px] rounded-lg overflow-hidden">
                        <Skeleton className="w-full h-full " />
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
                  {(() => {
                    if (!updatedMediaListState) {
                      return null;
                    }
                    const { title, medias } = updatedMediaListState;
                    return (
                      <div className="flex pt-4 text-w-fg-0">
                        <div>
                          <div className="px-4">
                            <h2 className="text-xl">📆{title}</h2>
                          </div>
                          <div
                            className={cn(
                              "flex mt-2 w-screen min-h-[248px] overflow-x-auto px-4 space-x-2 hide-scroll",
                              app.env.ios ? "hide-scroll--fix" : ""
                            )}
                          >
                            {(() => {
                              if (medias.length === 0) {
                                return (
                                  <div className="flex items-center justify-center w-full h-full mt-[68px]">
                                    <div className="flex flex-col items-center justify-center text-w-fg-1">
                                      <Bird className="w-16 h-16" />
                                      <div className="mt-2">暂无数据</div>
                                    </div>
                                  </div>
                                );
                              }
                              return medias.map((media) => {
                                const { id, name, type, tv_id, season_text, poster_path, text, air_date } = media;
                                return (
                                  <div
                                    key={id}
                                    className="w-[138px] rounded-lg bg-w-bg-2"
                                    onClick={() => {
                                      if (type === MediaTypes.TV && tv_id) {
                                        tvPlayingPage.query = {
                                          id: tv_id,
                                          season_id: id,
                                        };
                                        app.showView(tvPlayingPage);
                                      }
                                      if (type === MediaTypes.Movie) {
                                        moviePlayingPage.params = {
                                          id,
                                        };
                                        app.showView(moviePlayingPage);
                                      }
                                    }}
                                  >
                                    <div className="relative w-[138px] rounded-t-lg overflow-hidden">
                                      <LazyImage className="w-full h-full object-cover" src={poster_path} alt={name} />
                                      {text && (
                                        <div className="absolute bottom-0 flex flex-row-reverse items-center w-full h-[24px] px-2 text-sm text-right bg-gradient-to-t from-black to-transparent">
                                          <div
                                            className="text-[12px] text-w-bg-1 dark:text-w-fg-1"
                                            style={{ lineHeight: "12px" }}
                                          >
                                            {text}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-2 flex-1 max-w-full overflow-hidden">
                                      <div className="flex items-center overflow-hidden text-ellipsis">
                                        <h2 className="break-all truncate">{name}</h2>
                                      </div>
                                      <div className="flex items-center text-[12px] text-w-fg-1 overflow-hidden text-ellipsis">
                                        {season_text ? (
                                          <>
                                            <div>{season_text}</div>
                                            <p className="mx-2 ">·</p>
                                          </>
                                        ) : null}
                                        <div className="">{air_date}</div>
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
                  })()}
                  <div className="flex pt-4 text-w-fg-0">
                    <div>
                      <div className="px-4">
                        <h2 className="text-xl">🎬最近观看</h2>
                      </div>
                      <div
                        className={cn(
                          "flex mt-2 w-screen min-h-[184px] overflow-x-auto px-4 space-x-3 hide-scroll",
                          app.env.ios ? "hide-scroll--fix" : ""
                        )}
                      >
                        {(() => {
                          if (historyState.empty) {
                            return (
                              <div className="flex items-center justify-center w-full h-full mt-[68px]">
                                <div className="flex flex-col items-center justify-center text-w-fg-1">
                                  <Bird className="w-16 h-16" />
                                  <div className="mt-2">暂无数据</div>
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
                              episode,
                              season,
                              poster_path,
                              updated,
                              air_date,
                              thumbnail,
                            } = history;
                            return (
                              <div
                                key={id}
                                className="bg-w-bg-2 rounded-lg"
                                onClick={() => {
                                  if (type === MediaTypes.TV && tv_id) {
                                    tvPlayingPage.query = {
                                      id: tv_id,
                                      season_id,
                                    };
                                    app.showView(tvPlayingPage);
                                  }
                                  if (type === MediaTypes.Movie && movie_id) {
                                    moviePlayingPage.params = {
                                      id: movie_id,
                                    };
                                    app.showView(moviePlayingPage);
                                  }
                                }}
                              >
                                <div className="relative w-[240px] h-[148px] rounded-t-lg overflow-hidden">
                                  <LazyImage className="w-full h-full object-cover" src={thumbnail} alt={name} />
                                  <div className="absolute bottom-0 flex flex-row-reverse items-center w-full h-[32px] px-2 text-right bg-gradient-to-t from-black to-transparent">
                                    <div className="text-w-bg-1 text-[12px] dark:text-w-fg-1">看到{percent}%</div>
                                  </div>
                                </div>
                                <div className="p-2">
                                  <div className="">{name}</div>
                                  {/* <div className="mr-4 text-sm">{updated}</div> */}
                                  <Show when={!!episode}>
                                    <div className="flex items-center text-[12px] text-w-fg-1">
                                      <p className="">{episode}</p>
                                      <p className="mx-2">·</p>
                                      <p className="">{season}</p>
                                    </div>
                                  </Show>
                                  <Show when={type === MediaTypes.Movie}>
                                    <div className="flex items-center text-[12px] text-w-fg-1">{air_date}</div>
                                  </Show>
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
                  <div key={id} className="flex pt-4 text-w-fg-0">
                    <div>
                      <div className="px-4">
                        <h2 className="text-xl">{title}</h2>
                        {desc && <div className="text-sm text-w-fg-1">{desc}</div>}
                      </div>
                      <div
                        className={cn(
                          "flex mt-2 py-4 w-screen min-h-[248px] bg-w-bg-2 overflow-x-auto px-4 space-x-3 hide-scroll",
                          app.env.ios ? "hide-scroll--fix" : ""
                        )}
                      >
                        {(() => {
                          if (medias.length === 0) {
                            return (
                              <div className="flex items-center justify-center w-full h-full mt-[68px]">
                                <div className="flex flex-col items-center justify-center text-w-fg-1">
                                  <Bird className="w-16 h-16" />
                                  <div className="mt-2">暂无数据</div>
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
                                    app.showView(tvPlayingPage);
                                    return;
                                  }
                                  if (type === MediaTypes.Movie) {
                                    moviePlayingPage.params = {
                                      id,
                                    };
                                    app.showView(moviePlayingPage);
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
                                        <div
                                          className="text-w-bg-1 text-[12px] dark:text-w-fg-1"
                                          style={{ lineHeight: "12px" }}
                                        >
                                          {episode_count_text}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2 flex-1 max-w-full overflow-hidden">
                                  <div className="flex items-center overflow-hidden text-ellipsis">
                                    <h2 className="break-all truncate">{name}</h2>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="text-[12px] text-w-fg-1">{air_date}</div>
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
