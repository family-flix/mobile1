/**
 * @file 首页
 */
import React, { useState } from "react";
import { Loader, Search, SlidersHorizontal, Star } from "lucide-react";

import { Skeleton, ListView, Input, ScrollView, LazyImage, Sheet, CheckboxGroup, BackToTop } from "@/components/ui";
import { ScrollViewCore, InputCore, DialogCore, CheckboxGroupCore } from "@/domains/ui";
import { fetch_season_list } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { useInitialize, useInstance } from "@/hooks";
import { TVSourceOptions, TVGenresOptions } from "@/constants";
import { ViewComponent } from "@/types";
import { rootView, tvPlayingPage } from "@/store";

export const HomeIndexPage: ViewComponent = React.memo((props) => {
  const { app, router, view } = props;

  const scrollView = useInstance(() => new ScrollViewCore());
  const settingsSheet = useInstance(() => new DialogCore());
  const searchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索电视剧",
        onEnter(v) {
          helper.search({
            name: v,
          });
        },
        onBlur(v) {
          helper.search({
            name: v,
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
        // settingsSheet.hide();
        helper.search({
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
        helper.search({
          genres: options.join("|"),
        });
      },
    });
  });
  const helper = useInstance(
    () =>
      new ListCore(new RequestCore(fetch_season_list), {
        pageSize: 6,
        onLoadingChange(loading) {
          searchInput.setLoading(!helper.response.initial && loading);
        },
        search: (() => {
          const { language = [] } = app.cache.get("tv_search", {
            language: [] as string[],
          });
          if (!language.length) {
            return {};
          }
          return {
            language: language.join("|"),
          };
        })(),
      })
  );
  const [response, setResponse] = useState(helper.response);
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

  // console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <ScrollView store={scrollView} className="dark:text-black-200">
        <div className="w-full h-full">
          <div className="flex items-center justify-between w-full p-4 pb-0 space-x-4">
            <div className="relative w-full">
              <Input store={searchInput} prefix={<Search className="w-4 h-4" />} />
            </div>
            <div
              className="relative p-2"
              onClick={() => {
                settingsSheet.show();
              }}
            >
              <SlidersHorizontal className="w-5 h-5 dark:text-black-200" />
              {hasSearch && <div className="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-red-500"></div>}
            </div>
          </div>
          <ListView
            store={helper}
            className="relative h-[50%] mt-6 grid grid-cols-1 pb-[24px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
            skeleton={
              <>
                <div className="flex px-4 pb-4 cursor-pointer">
                  <div className="relative w-[128px] h-[198px] mr-4">
                    <Skeleton className="w-full h-full dark:bg-gray-800" />
                  </div>
                  <div className="mt-2 flex-1 max-w-full overflow-hidden text-ellipsis">
                    <Skeleton className="w-full h-[32px] dark:bg-gray-800"></Skeleton>
                    <Skeleton className="mt-1 w-24 h-[24px] dark:bg-gray-800"></Skeleton>
                    <Skeleton className="mt-2 w-32 h-[22px] dark:bg-gray-800"></Skeleton>
                  </div>
                </div>
                <div className="flex px-4 pb-4 cursor-pointer">
                  <div className="relative w-[128px] h-[198px] mr-4">
                    <Skeleton className="w-full h-full dark:bg-gray-800" />
                  </div>
                  <div className="mt-2 flex-1 max-w-full overflow-hidden text-ellipsis">
                    <Skeleton className="w-full h-[32px] dark:bg-gray-800"></Skeleton>
                    <Skeleton className="mt-1 w-24 h-[24px] dark:bg-gray-800"></Skeleton>
                    <Skeleton className="mt-2 w-32 h-[22px] dark:bg-gray-800"></Skeleton>
                  </div>
                </div>
              </>
            }
          >
            {(() => {
              return dataSource.map((season) => {
                const {
                  id,
                  tv_id,
                  name,
                  overview,
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
                    className="flex px-4 pb-4 cursor-pointer"
                    onClick={() => {
                      tvPlayingPage.params = {
                        id: tv_id,
                      };
                      tvPlayingPage.query = {
                        season_id: id,
                      };
                      rootView.layerSubView(tvPlayingPage);
                    }}
                  >
                    <div className="relative w-[128px] h-[198px] mr-4 rounded-lg overflow-hidden">
                      <LazyImage className="w-full h-full object-cover" src={poster_path} alt={name} />
                      {/* <div className="absolute left-2 top-2">
                          <PercentCircle percent={vote * 10} width={80} height={80} style={{ width: 20, height: 20 }} />
                          <div className="absolute">{vote}</div>
                        </div> */}
                      <div className="z-10 absolute bottom-0 w-full h-[36px] bg-gradient-to-t from-gray-600 to-transparent opacity-30"></div>
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
                    <div className="mt-2 flex-1 max-w-full overflow-hidden text-ellipsis">
                      <div className="flex items-center">
                        <h2 className="truncate text-2xl dark:text-white">{name}</h2>
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
                              className="py-1 px-2 text-[12px] leading-none rounded-lg break-keep whitespace-nowrap border dark:border-black-200"
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
              <div className="absolute inset-0 bg-white opacity-50 dark:bg-black-900" />
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
    </>
  );
});
