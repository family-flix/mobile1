/**
 * @file 电影列表页
 */
import React, { useEffect, useState } from "react";
import { ArrowUp, Loader, Pen, Search, SlidersHorizontal, Star } from "lucide-react";

// import { moviePlayingPage } from "@/store/views";
import { ViewComponentWithMenu } from "@/store/types";
import {
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
import { MediaRequestCore } from "@/components/media-request";
import { CheckboxGroupCore, ScrollViewCore, InputCore, DialogCore, ButtonCore, ImageInListCore } from "@/domains/ui";
import { fetchMovieList, fetchMovieListProcess } from "@/domains/movie/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { MovieGenresOptions, MovieOriginCountryOptions } from "@/constants";
import { ListCoreV2 } from "@/domains/list/v2";
import { RequestCoreV2 } from "@/domains/request/v2";

export const HomeMoviePage: ViewComponentWithMenu = React.memo((props) => {
  const { app, history, client, storage, view, menu } = props;

  const movieList = useInstance(
    () =>
      new ListCoreV2(new RequestCoreV2({ fetch: fetchMovieList, process: fetchMovieListProcess, client }), {
        pageSize: 6,
        beforeSearch() {
          searchInput.setLoading(true);
        },
        afterSearch() {
          searchInput.setLoading(false);
        },
      })
  );
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onScroll(pos) {
          console.log("[PAGE]home/movie - onScroll", pos.scrollTop);
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
          if (pos.scrollTop <= 0) {
            menu.setCanRefresh();
            return;
          }
          if (pos.scrollTop >= 5) {
            menu.disable();
          }
        },
      })
  );
  const poster = useInstance(() => new ImageInListCore());
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
    const { language = [] } = storage.get("movie_search");
    return new CheckboxGroupCore({
      values: MovieOriginCountryOptions.filter((opt) => {
        return language.includes(opt.value);
      }).map((opt) => opt.value),
      options: MovieOriginCountryOptions.map((opt) => {
        return {
          ...opt,
          checked: language.includes(opt.value),
        };
      }),
      onChange(options) {
        storage.merge("movie_search", {
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
  const mediaRequest = useInstance(() => new MediaRequestCore({ client }));
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
      const { language = [] } = storage.get("movie_search");
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
      const { language = [] } = storage.get("movie_search");
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
            <Input store={searchInput} prefix={<Search className="w-5 h-5" />} />
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
      <ScrollView store={scrollView} className="box-border bg-w-bg-0 pt-[56px]">
        <div className="w-full h-full">
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
                const { id, name, vote, genres, air_date, poster_path = "", runtime, actors } = movie;
                return (
                  <div
                    key={id}
                    className="flex px-4 py-2 mb-3 bg-w-bg-2 cursor-pointer"
                    onClick={() => {
                      // moviePlayingPage.params = {
                      //   id,
                      // };
                      // app.showView(moviePlayingPage);
                      history.push("root.movie_playing", { id });
                    }}
                  >
                    <div className="relative w-[128px] h-[198px] mr-4">
                      <LazyImage
                        className="w-full h-full rounded-lg object-cover"
                        store={poster.bind(poster_path)}
                        alt={name}
                      />
                      {runtime && (
                        <div className="absolute w-full bottom-0 flex flex-row-reverse items-center">
                          <div className="absolute z-10 inset-0 opacity-80 bg-gradient-to-t to-transparent from-w-fg-0 dark:from-w-bg-0"></div>
                          <div className="relative z-20 p-2 pt-6 text-[12px] text-w-bg-1 dark:text-w-fg-1">
                            {runtime}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex-1 max-w-full overflow-hidden">
                      <div className="flex items-center">
                        <h2 className="text-xl text-w-fg-0">{name}</h2>
                      </div>
                      <div className="flex items-center mt-1">
                        <div>{air_date}</div>
                        <p className="mx-2 ">·</p>
                        <div className="relative flex items-center">
                          <Star className="absolute top-[50%] w-4 h-4 transform translate-y-[-50%]" />
                          <div className="pl-4">{vote}</div>
                        </div>
                      </div>
                      {actors ? (
                        <div className="mt-1 text-sm overflow-hidden text-ellipsis break-keep whitespace-nowrap">
                          {actors}
                        </div>
                      ) : null}
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
        <div style={{ height: 1 }} />
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
