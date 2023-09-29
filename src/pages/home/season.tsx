/**
 * @file 电视剧列表
 */
import React, { useState } from "react";
import { Loader, Search, SlidersHorizontal, Star } from "lucide-react";

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
import { ViewComponent } from "@/types";
import { rootView, tvPlayingPage } from "@/store";
import { MediaRequestCore } from "@/components/media-request";

export const HomeSeasonListPage: ViewComponent = React.memo((props) => {
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
        onClear() {
          // console.log("[PAGE]home/index - onClear", helper, helper.response.search);
          helper.search({
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
      new ListCore(new RequestCore(fetchSeasonList), {
        pageSize: 6,
        onLoadingChange(loading) {
          searchInput.setLoading(!helper.response.initial && loading);
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
      app.tip({
        text: ["刷新成功"],
      });
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      helper.loadMore();
    });
    helper.onStateChange((nextResponse) => {
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
    helper.init(search);
  });

  const { dataSource } = response;

  // console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <div className="relative z-50">
        <div className="fixed top-0 w-full flex items-center justify-between w-full py-2 px-4 space-x-4 bg-white dark:bg-black">
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
        <div className="h-[56px]" />
      </div>
      <ScrollView store={scrollView} className="dark:text-black-200">
        <div className="w-full h-full pt-[56px]">
          <ListView
            store={helper}
            className="relative h-[50%] mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
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
                    <div className="mt-2 flex-1 max-w-full overflow-hidden">
                      <div className="flex items-center">
                        <h2 className="text-2xl dark:text-white">{name}</h2>
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
      <Dialog store={mediaRequest.dialog}>
        <div>
          <p>输入想看的电视剧</p>
          <div className="mt-4">
            <Input store={mediaRequest.input} />
          </div>
        </div>
      </Dialog>
    </>
  );
});
