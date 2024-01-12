/**
 * @file 电视剧列表
 */
import React, { useState } from "react";
import { ArrowUp, ChevronLeft, Loader, Pen, Search, SlidersHorizontal, Star } from "lucide-react";

import {
  Skeleton,
  ListView,
  Input,
  ScrollView,
  LazyImage,
  Sheet,
  CheckboxGroup,
  Button,
  Dialog,
} from "@/components/ui";
import { MediaRequestCore } from "@/components/media-request";
import { ScrollViewCore, InputCore, DialogCore, CheckboxGroupCore, ButtonCore, ImageInListCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { TVSourceOptions, TVGenresOptions, MediaTypes } from "@/constants";
import { ViewComponent, ViewComponentWithMenu } from "@/types";
import { moviePlayingPageV2, seasonPlayingPageV2 } from "@/store";
import { fetchMediaList } from "@/services/media";

export const MediaSearchPage: ViewComponent = React.memo((props) => {
  const { app, router, view } = props;

  const seasonList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchMediaList), {
        pageSize: 20,
        beforeSearch() {
          searchInput.setLoading(true);
        },
        afterSearch() {
          searchInput.setLoading(false);
        },
      })
  );
  const scrollView = useInstance(() => new ScrollViewCore({}));
  const settingsSheet = useInstance(() => new DialogCore());
  const poster = useInstance(() => new ImageInListCore());
  const searchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索",
        onEnter(v) {
          seasonList.search({
            name: v,
          });
          scrollView.scrollTo({ top: 0 });
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
        onMounted() {
          searchInput.focus();
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

  useInitialize(() => {
    view.onShow(() => {
      app.setTitle(view.title);
    });
    // scrollView.onPullToRefresh(async () => {
    //   await seasonList.refresh();
    //   app.tip({
    //     text: ["刷新成功"],
    //   });
    //   scrollView.stopPullToRefresh();
    // });
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
  });

  const { dataSource } = response;

  // console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <div className="fixed z-20 top-0 w-full bg-w-bg-0">
        <div className="flex items-center justify-between w-full py-2 px-4 text-w-fg-0 space-x-3">
          <ChevronLeft
            className="w-6 h-6"
            onClick={() => {
              app.back();
            }}
          />
          <div className="flex-1 w-0">
            <Input store={searchInput} prefix={<Search className="w-5 h-5" />} />
          </div>
          {/* <div
            className="relative w-6 h-6 p-2 rounded-md bg-w-bg-3"
            onClick={() => {
              settingsSheet.show();
            }}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasSearch && <div className="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-w-red"></div>}
          </div> */}
        </div>
      </div>
      <ScrollView store={scrollView} className="box-border text-w-fg-1 pt-[56px]">
        <div className="w-full h-full">
          <ListView
            store={seasonList}
            className="h-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
            extraEmpty={
              <div className="mt-2">
                <Button store={mediaRequestBtn} variant="subtle">
                  提交想看的影视剧
                </Button>
              </div>
            }
          >
            {(() => {
              return dataSource.map((season) => {
                const { id, type, name, episode_count_text, vote, genres, air_date, poster_path = "", actors } = season;
                return (
                  <div
                    key={id}
                    className="flex px-4 py-2 mb-3 cursor-pointer"
                    onClick={() => {
                      if (type === MediaTypes.Season) {
                        seasonPlayingPageV2.query = {
                          id,
                        };
                        app.showView(seasonPlayingPageV2);
                        return;
                      }
                      if (type === MediaTypes.Movie) {
                        moviePlayingPageV2.query = {
                          id,
                        };
                        app.showView(moviePlayingPageV2);
                        return;
                      }
                      app.tip({
                        text: ["未知的媒体类型"],
                      });
                    }}
                  >
                    <div className="relative w-[128px] h-[198px] mr-4 rounded-lg overflow-hidden">
                      <LazyImage className="w-full h-full object-cover" store={poster.bind(poster_path)} alt={name} />
                      {episode_count_text && (
                        <div className="absolute w-full bottom-0 flex flex-row-reverse items-center">
                          <div className="absolute z-10 inset-0 opacity-80 bg-gradient-to-t to-transparent from-w-fg-0 dark:from-w-bg-0"></div>
                          <div className="relative z-20 p-2 pt-6 text-[12px] text-w-bg-1 dark:text-w-fg-1">
                            {episode_count_text}
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
                      <div className="mt-2 flex items-center flex-wrap gap-2 max-w-full">
                        {genres.map((tag) => {
                          return (
                            <div
                              key={tag}
                              className="py-1 px-2 text-[12px] leading-none rounded-lg break-keep whitespace-nowrap border border-w-fg-1"
                              style={{
                                lineHeight: "12px",
                              }}
                            >
                              {tag}
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
          <p>输入想看的电视剧</p>
          <div className="mt-4">
            <Input prefix={<Pen className="w-4 h-4" />} store={mediaRequest.input} />
          </div>
        </div>
      </Dialog>
    </>
  );
});
