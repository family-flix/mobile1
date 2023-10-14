/**
 * @file 电视剧列表
 */
import React, { useState } from "react";
import { ArrowUp, Loader, Pen, Search, SlidersHorizontal, Star } from "lucide-react";

import {
  Skeleton,
  ListView,
  Input,
  ScrollView,
  LazyImage,
  Sheet,
  CheckboxGroup,
  BackToTop,
  Button,
  Dialog,
} from "@/components/ui";
import { ScrollViewCore, InputCore, DialogCore, CheckboxGroupCore, ButtonCore } from "@/domains/ui";
import { fetchSeasonList } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { TVSourceOptions, TVGenresOptions } from "@/constants";
import { ViewComponent, ViewComponentWithMenu } from "@/types";
import { rootView, tvPlayingPage } from "@/store";
import { MediaRequestCore } from "@/components/media-request";

export const HomeSeasonListPage: ViewComponentWithMenu = React.memo((props) => {
  const { app, router, view, menu } = props;

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
      })
  );
  const settingsSheet = useInstance(() => new DialogCore());
  const searchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索电视剧",
        onEnter(v) {
          seasonList.search({
            name: v,
          });
        },
        onBlur(v) {
          seasonList.search({
            name: v,
          });
        },
        onClear() {
          // console.log("[PAGE]home/index - onClear", helper, helper.response.search);
          seasonList.search({
            name: "",
          });
        },
      })
  );
  const sourceCheckboxGroup = useInstance(() => {
    const { language = [] } = app.cache.get("tv_search", {
      language: [] as string[],
    });
    return new CheckboxGroupCore({
      values: TVSourceOptions.filter((opt) => {
        return language.includes(opt.value);
      }).map((opt) => opt.value),
      options: TVSourceOptions.map((opt) => {
        return {
          ...opt,
          checked: language.includes(opt.value),
        };
      }),
      onChange(options) {
        app.cache.merge("tv_search", {
          language: options,
        });
        setHasSearch(!!options.length);
        seasonList.search({
          language: options.join("|"),
        });
      },
    });
  });
  const genresCheckboxGroup = useInstance(() => {
    // const { genres = [] } = app.cache.get("tv_search", {
    //   genres: [] as string[],
    // });
    return new CheckboxGroupCore({
      options: TVGenresOptions,
      onChange(options) {
        // app.cache.merge("tv_search", {
        //   genres: options,
        // });
        setHasSearch(!!options.length);
        // settingsSheet.hide();
        seasonList.search({
          genres: options.join("|"),
        });
      },
    });
  });
  const seasonList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchSeasonList), {
        pageSize: 6,
        onLoadingChange(loading) {
          searchInput.setLoading(!seasonList.response.initial && loading);
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

  const [response, setResponse] = useState(seasonList.response);
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
    scrollView.onPullToRefresh(async () => {
      await seasonList.refresh();
      app.tip({
        text: ["刷新成功"],
      });
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      seasonList.loadMore();
    });
    seasonList.onStateChange((nextResponse) => {
      setResponse(nextResponse);
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
    seasonList.init(search);
  });

  const { dataSource } = response;

  // console.log("[PAGE]home - render", dataSource);

  return (
    <div className="bg-w-bg-0">
      <div className="relative z-50">
        <div className="fixed top-0 w-full flex items-center justify-between w-full py-2 px-4 bg-w-bg-0 text-w-fg-2 space-x-3">
          <div className="relative w-full">
            <Input store={searchInput} prefix={<Search className="w-4 h-4" />} />
          </div>
          <div
            className="relative p-2 rounded-md bg-w-bg-2"
            onClick={() => {
              settingsSheet.show();
            }}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasSearch && <div className="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-w-red"></div>}
          </div>
        </div>
        <div className="h-[56px]" />
      </div>
      <ScrollView store={scrollView} className="">
        <div className="w-full h-full pt-[56px]">
          <ListView
            store={seasonList}
            className="relative h-[50%] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
            skeleton={
              <>
                <div className="flex px-4 py-2 mb-3 bg-w-bg-2 cursor-pointer">
                  <div className="relative w-[128px] h-[198px] mr-4">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <div className="mt-2 flex-1 max-w-full overflow-hidden text-ellipsis">
                    <Skeleton className="w-full h-[32px]"></Skeleton>
                    <Skeleton className="mt-1 w-24 h-[24px]"></Skeleton>
                    <Skeleton className="mt-2 w-32 h-[22px]"></Skeleton>
                  </div>
                </div>
                <div className="flex px-4 py-2 mb-3 bg-w-bg-2 cursor-pointer">
                  <div className="relative w-[128px] h-[198px] mr-4">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <div className="mt-2 flex-1 max-w-full overflow-hidden text-ellipsis">
                    <Skeleton className="w-full h-[32px]"></Skeleton>
                    <Skeleton className="mt-1 w-24 h-[24px]"></Skeleton>
                    <Skeleton className="mt-2 w-32 h-[22px]"></Skeleton>
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
              return dataSource.map((season) => {
                const {
                  id,
                  tv_id,
                  name,
                  season_text,
                  episode_count_text,
                  vote,
                  genres,
                  air_date,
                  poster_path = "",
                } = season;
                return (
                  <div
                    key={id}
                    className="flex px-4 py-2 mb-3 bg-w-bg-2 cursor-pointer"
                    onClick={() => {
                      tvPlayingPage.query = {
                        id: tv_id,
                        season_id: id,
                      };
                      app.showView(tvPlayingPage);
                    }}
                  >
                    <div className="relative w-[128px] h-[198px] mr-4 rounded-lg overflow-hidden">
                      <LazyImage className="w-full h-full object-cover" src={poster_path} alt={name} />
                      <div className="z-10 absolute bottom-0 w-full h-[36px] bg-gradient-to-t from-gray-600 to-transparent opacity-30"></div>
                      {episode_count_text && (
                        <div className="z-20 absolute bottom-1 right-1">
                          <div className="inline-flex items-center py-1 px-2 rounded-sm">
                            <div className="text-[12px] text-w-fg-1" style={{ lineHeight: "12px" }}>
                              {episode_count_text}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex-1 max-w-full overflow-hidden">
                      <div className="flex items-center">
                        <h2 className="text-2xl text-w-fg-0">{name}</h2>
                      </div>
                      <div className="flex items-center mt-1 ">
                        <div>{air_date}</div>
                        <p className="mx-2 ">·</p>
                        <p className="whitespace-nowrap">{season_text}</p>
                        <p className="mx-2 ">·</p>
                        <div className="flex items-center">
                          <Star className="mr-1 relative top-[-2px] w-4 h-4" />
                          <div>{vote}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center flex-wrap gap-2 max-w-full">
                        {genres.map((g) => {
                          return (
                            <div
                              key={g}
                              className="py-1 px-2 text-[12px] leading-none rounded-lg break-keep whitespace-nowrap border border-w-fg-1"
                              style={{
                                lineHeight: "12px",
                              }}
                            >
                              {g}
                            </div>
                          );
                        })}
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
      <Sheet store={settingsSheet}>
        <div className="relative h-[320px] py-4 pb-8 px-2 overflow-y-auto">
          {response.loading && (
            <>
              <div className="absolute inset-0 bg-w-bg-0 opacity-50" />
              <div className="absolute w-full h-[120px] flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin" />
              </div>
            </>
          )}
          <div>
            <div>
              <CheckboxGroup store={sourceCheckboxGroup} />
            </div>
            <div>
              <CheckboxGroup store={genresCheckboxGroup} />
            </div>
          </div>
        </div>
      </Sheet>
      <Dialog store={mediaRequest.dialog}>
        <div className="text-w-fg-1">
          <p>输入想看的电视剧</p>
          <div className="mt-4">
            <Input prefix={<Pen className="w-4 h-4" />} store={mediaRequest.input} />
          </div>
        </div>
      </Dialog>
    </div>
  );
});
