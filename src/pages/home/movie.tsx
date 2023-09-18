/**
 * @file 电影列表页
 */
import React, { useEffect, useState } from "react";
import { Loader, Search, SlidersHorizontal, Star } from "lucide-react";

import { BackToTop, ScrollView, Sheet, ListView, Skeleton, Input, LazyImage, CheckboxGroup } from "@/components/ui";
import { CheckboxGroupCore, ScrollViewCore, InputCore, DialogCore } from "@/domains/ui";
import { fetch_movie_list } from "@/domains/movie/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { MovieGenresOptions, MovieSourceOptions } from "@/constants";
import { moviePlayingPage, rootView } from "@/store";
import { ViewComponent } from "@/types";

export const HomeMoviePage: ViewComponent = React.memo((props) => {
  const { app, router, view } = props;

  const scrollView = useInstance(() => new ScrollViewCore());
  const helper = useInstance(
    () =>
      new ListCore(new RequestCore(fetch_movie_list), {
        pageSize: 6,
        onLoadingChange(loading) {
          searchInput.setLoading(!helper.response.initial && loading);
        },
      })
  );
  const settingsSheet = useInstance(() => new DialogCore());
  const searchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索电影",
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
        onClear() {
          helper.search({
            name: "",
          });
        },
      })
  );
  const sourceCheckboxGroup = useInstance(() => {
    const { language = [] } = app.cache.get("movie_search", {
      language: [] as string[],
    });
    return new CheckboxGroupCore({
      values: MovieSourceOptions.filter((opt) => {
        return language.includes(opt.value);
      }).map((opt) => opt.value),
      options: MovieSourceOptions.map((opt) => {
        return {
          ...opt,
          checked: language.includes(opt.value),
        };
      }),
      onChange(options) {
        app.cache.merge("movie_search", {
          language: options,
        });
        setHasSearch(!!options.length);
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
      options: MovieGenresOptions,
      onChange(options) {
        // app.cache.merge("movie_search", {
        //   genres: options,
        // });
        setHasSearch(!!options.length);
        helper.search({
          genres: options.join("|"),
        });
      },
    });
  });

  const [hasSearch, setHasSearch] = useState(
    (() => {
      const { language = [] } = app.cache.get("movie_search", {
        language: [] as string[],
      });
      return language.length !== 0;
    })()
  );
  const [response, setResponse] = useState(helper.response);

  // const [history_response] = useState(history_helper.response);
  useInitialize(() => {
    view.onReady(() => {
      console.log("home/index ready");
    });
    view.onMounted(() => {
      console.log("home/index mounted");
    });
    view.onShow(() => {
      console.log("home/index show");
    });
    view.onHidden(() => {
      console.log("home/index hide");
    });
    scrollView.onPullToRefresh(async () => {
      await helper.refresh();
      app.tip({
        text: ["刷新成功"],
      });
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      console.log("load  more");
      helper.loadMore();
    });
    // page.onReady(() => {
    //   history_helper.init();
    //   helper.init();
    // });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
  });
  useEffect(() => {
    const search = (() => {
      const { language = [] } = app.cache.get("movie_search", {
        language: [] as string[],
      });
      if (!language.length) {
        return {};
      }
      return {
        language: language.join("|"),
      };
    })();
    helper.init(search);
  }, []);

  const { dataSource, error } = response;

  console.log("[PAGE]home - render", dataSource);

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
            className="relative mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
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
              return dataSource.map((movie) => {
                const { id, name, overview, vote, genres, air_date, poster_path = "", runtime } = movie;
                return (
                  <div
                    key={id}
                    className="flex px-4 pb-4 cursor-pointer"
                    onClick={() => {
                      moviePlayingPage.params = {
                        id,
                      };
                      rootView.layerSubView(moviePlayingPage);
                    }}
                  >
                    <div className="relative w-[128px] h-[198px] mr-4">
                      <LazyImage className="w-full h-full rounded-lg object-cover" src={poster_path} alt={name} />
                      <div className="absolute left-2 top-2">
                        {/* <PercentCircle percent={vote * 10} width={80} height={80} style={{ width: 20, height: 20 }} /> */}
                        {/* <div className="absolute">{vote}</div> */}
                      </div>
                    </div>
                    <div className="mt-2 flex-1 max-w-full overflow-hidden">
                      <div className="flex items-center">
                        <h2 className="text-2xl dark:text-white">{name}</h2>
                      </div>
                      <div className="flex items-center mt-1 ">
                        <div>{air_date}</div>
                        <p className="mx-2 ">·</p>
                        <div className="flex items-center">
                          <Star className="mr-1 relative top-[-2px] w-4 h-4" />
                          <div>{vote}</div>
                        </div>
                        {runtime ? (
                          <>
                            <p className="mx-2 ">·</p>
                            <div className="flex items-center">
                              <div>{runtime}</div>
                            </div>
                          </>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap max-w-full">
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
