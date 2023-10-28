/**
 * @file 电影列表页
 */
import React, { useEffect, useState } from "react";
import { ArrowUp, Loader, Pen, Search, SlidersHorizontal, Star } from "lucide-react";

import {
  BackToTop,
  ScrollView,
  Sheet,
  ListView,
  Skeleton,
  Input,
  LazyImage,
  CheckboxGroup,
  Button,
  Dialog,
} from "@/components/ui";
import { CheckboxGroupCore, ScrollViewCore, InputCore, DialogCore, ButtonCore } from "@/domains/ui";
import { fetchMovieList } from "@/domains/movie/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { MovieGenresOptions, MovieSourceOptions } from "@/constants";
import { moviePlayingPage, rootView } from "@/store";
import { ViewComponent, ViewComponentWithMenu } from "@/types";
import { MediaRequestCore } from "@/components/media-request";

export const HomeMoviePage: ViewComponentWithMenu = React.memo((props) => {
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
          if (pos.scrollTop === 0) {
            menu.setCanRefresh();
            return;
          }
          menu.disable();
        },
      })
  );
  const movieList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchMovieList), {
        pageSize: 6,
        beforeSearch() {
          searchInput.setLoading(true);
        },
        afterSearch() {
          searchInput.setLoading(false);
        },
      })
  );
  const settingsSheet = useInstance(() => new DialogCore());
  const searchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索电影",
        onEnter(v) {
          movieList.search({
            name: v,
          });
          scrollView.scrollTo({ top: 0 });
        },
        onBlur(v) {
          movieList.search({
            name: v,
          });
        },
        onClear() {
          movieList.search({
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
        movieList.search({
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
      async onChange(options) {
        // app.cache.merge("movie_search", {
        //   genres: options,
        // });
        setHasSearch(!!options.length);
        movieList.search({
          genres: options.join("|"),
        });
      },
    });
  });
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

  const [hasSearch, setHasSearch] = useState(
    (() => {
      const { language = [] } = app.cache.get("movie_search", {
        language: [] as string[],
      });
      return language.length !== 0;
    })()
  );
  const [response, setResponse] = useState(movieList.response);

  // const [history_response] = useState(history_helper.response);
  useInitialize(() => {
    view.onShow(() => {
      app.setTitle(view.title);
    });
    if (menu) {
      menu.onScrollToTop(() => {
        scrollView.scrollTo({ top: 0 });
      });
      menu.onRefresh(async () => {
        scrollView.startPullToRefresh();
        await movieList.refresh();
        scrollView.stopPullToRefresh();
      });
    }
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
    // scrollView.onPullToRefresh(async () => {
    //   await helper.refresh();
    //   app.tip({
    //     text: ["刷新成功"],
    //   });
    //   scrollView.stopPullToRefresh();
    // });
    scrollView.onReachBottom(() => {
      // console.log("load  more");
      movieList.loadMore();
    });
    // page.onReady(() => {
    //   history_helper.init();
    //   helper.init();
    // });
    movieList.onStateChange((nextResponse) => {
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
    movieList.init(search);
  }, []);

  const { dataSource, error } = response;

  console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <div className="fixed z-20 top-0 w-full">
        <div className="flex items-center justify-between w-full py-2 px-4 bg-w-bg-0 text-w-fg-2 space-x-3">
          <div className="w-full">
            <Input store={searchInput} prefix={<Search className="w-4 h-4" />} />
          </div>
          <div
            className="relative p-2 rounded-md bg-w-bg-2"
            onClick={() => {
              settingsSheet.show();
            }}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasSearch && <div className="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-red-500"></div>}
          </div>
        </div>
      </div>
      <ScrollView store={scrollView} className="bg-w-bg-0 pt-[56px]">
        <div className="w-full min-h-screen">
          <ListView
            store={movieList}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
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
                  提交想看的电影
                </Button>
              </div>
            }
          >
            {(() => {
              return dataSource.map((movie) => {
                const { id, name, overview, vote, genres, air_date, poster_path = "", runtime } = movie;
                return (
                  <div
                    key={id}
                    className="flex px-4 py-2 mb-3 bg-w-bg-2 cursor-pointer"
                    onClick={() => {
                      moviePlayingPage.params = {
                        id,
                      };
                      app.showView(moviePlayingPage);
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
                        <h2 className="text-xl text-w-fg-0">{name}</h2>
                      </div>
                      <div className="flex items-center mt-1 ">
                        <div>{air_date}</div>
                        <p className="mx-2 ">·</p>
                        <div className="relative flex items-center">
                          <Star className="absolute top-[50%] w-4 h-4 transform translate-y-[-50%]" />
                          <div className="pl-4">{vote}</div>
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
          <p>输入想看的电影</p>
          <div className="mt-4">
            <Input prefix={<Pen className="w-4 h-4" />} store={mediaRequest.input} />
          </div>
        </div>
      </Dialog>
    </>
  );
});
