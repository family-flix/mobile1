/**
 * @file 电视剧列表
 */
import React, { useState } from "react";
import dayjs from "dayjs";
import {
  ArrowUp,
  ChevronLeft,
  Loader,
  MoreHorizontal,
  Pen,
  Search,
  SlidersHorizontal,
  Star,
  Trash,
} from "lucide-react";

import { ViewComponent, ViewComponentWithMenu } from "@/store/types";
import { fetchMediaList, fetchMediaListProcess } from "@/services/media";
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
  Node,
} from "@/components/ui";
import { MediaRequestCore } from "@/components/media-request";
import { Affix } from "@/components/ui/affix";
import {
  ScrollViewCore,
  InputCore,
  DialogCore,
  CheckboxGroupCore,
  ButtonCore,
  ImageInListCore,
  NodeCore,
} from "@/domains/ui";
import { AffixCore } from "@/domains/ui/affix";
import { ListCoreV2 } from "@/domains/list/v2";
import { RequestCoreV2 } from "@/domains/request/v2";
import { useInitialize, useInstance } from "@/hooks";
import { TVSourceOptions, TVGenresOptions, MediaTypes } from "@/constants";

export const MediaSearchPage: ViewComponent = React.memo((props) => {
  const { app, history, client, storage, view } = props;

  const seasonList = useInstance(
    () =>
      new ListCoreV2(new RequestCoreV2({ fetch: fetchMediaList, process: fetchMediaListProcess, client }), {
        pageSize: 20,
        beforeSearch() {
          searchInput.setLoading(true);
        },
        afterSearch() {
          searchInput.setLoading(false);
        },
      })
  );
  const affix = useInstance(
    () =>
      new AffixCore({
        top: 0,
        defaultHeight: 56,
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
        onChange(v) {
          setKeyword(v);
          if (!v) {
            setShowPlaceholder(true);
            return;
          }
          seasonList.searchDebounce({
            name: v,
          });
        },
        onBlur(v) {
          if (!v) {
            return;
          }
          if (v === seasonList.params.name) {
            return;
          }
          seasonList.search({
            name: v,
          });
        },
        onClear() {
          setKeyword("");
          setShowPlaceholder(true);
        },
        onMounted() {
          searchInput.focus();
        },
      })
  );
  const sourceCheckboxGroup = useInstance(() => {
    const { language = [] } = storage.get("tv_search");
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
        storage.merge("tv_search", {
          language: options,
        });
        // setHasSearch(!!options.length);
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
        // setHasSearch(!!options.length);
        // settingsSheet.hide();
        seasonList.search({
          genres: options.join("|"),
        });
      },
    });
  });
  const mediaRequest = useInstance(() => new MediaRequestCore({ client }));
  const node = useInstance(
    () =>
      new NodeCore({
        onMounted(params) {
          if (!params.canScroll) {
            return;
          }
        },
      })
  );
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
  const [keyword, setKeyword] = useState(searchInput.value);
  const [height, setHeight] = useState(affix.height);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [histories, setHistories] = useState(storage.values.media_search_histories);
  // const [hasSearch, setHasSearch] = useState(
  //   (() => {
  //     const { language = [] } = storage.get("tv_search");
  //     return language.length !== 0;
  //   })()
  // );

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
    affix.onMounted((rect) => {
      setHeight(rect.height);
    });
    seasonList.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    seasonList.onAfterSearch(({ params }) => {
      const { name } = params as { name: string };
      if (!storage.values.media_search_histories.find((h) => h.text === name)) {
        storage.merge(
          "media_search_histories",
          [
            {
              sort: dayjs().valueOf(),
              text: name,
            },
          ],
          { reverse: true, limit: 12 }
        );
      }
      setShowPlaceholder(false);
    });
    storage.onStateChange((v) => {
      setHistories(v.values.media_search_histories);
    });
    mediaRequest.onTip((msg) => {
      app.tip(msg);
    });
    // const search = (() => {
    //   const { language = [] } = storage.get("tv_search");
    //   if (!language.length) {
    //     return {};
    //   }
    //   return {
    //     language: language.join("|"),
    //   };
    // })();
  });

  const { dataSource } = response;

  // console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <Affix store={affix} className="z-50 w-full bg-w-bg-0">
        <div className="flex items-center justify-between w-full py-2 px-4 text-w-fg-0 space-x-3">
          <div className="flex-1 w-0">
            <Input store={searchInput} prefix={<Search className="w-5 h-5" />} />
          </div>
          <div
            className="relative py-2 w-12 text-center"
            onClick={() => {
              history.back();
            }}
          >
            取消
          </div>
        </div>
      </Affix>
      {(() => {
        if (showPlaceholder) {
          return (
            <div className="absolute inset-0 box-border text-w-fg-1" style={{ top: height }}>
              <div className="relative p-4">
                <div className="flex items-center justify-between">
                  <div className="">搜索历史</div>
                  <div
                    onClick={() => {
                      storage.clear("media_search_histories");
                    }}
                  >
                    <Trash className="w-4 h-4" />
                  </div>
                </div>
                <Node
                  store={node}
                  className="relative flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto scroll--hidden"
                >
                  {histories.map((keyword, i) => {
                    const { text } = keyword;
                    return (
                      <div
                        key={i}
                        className="px-4 py-2 rounded-md text-sm bg-w-bg-2"
                        onClick={() => {
                          searchInput.change(text);
                          searchInput.enter();
                        }}
                      >
                        {text}
                      </div>
                    );
                  })}
                </Node>
                {/* <div
                  className="flex items-center justify-center absolute right-6 bottom-6 w-6 h-6 rounded-full bg-w-bg-3 shadow-xl"
                  onClick={() => {
                    node.scrollTo({ top: node.rect.scrollHeight });
                  }}
                >
                  <MoreHorizontal className="w-4 h-4 text-w-fg-2" />
                </div> */}
              </div>
            </div>
          );
        }
        return (
          <ScrollView store={scrollView} className="absolute inset-0 box-border text-w-fg-1" style={{ top: height }}>
            <ListView
              store={seasonList}
              className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 pt-4"
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
                  const {
                    id,
                    type,
                    name,
                    episode_count_text,
                    vote,
                    genres,
                    air_date,
                    poster_path = "",
                    actors,
                  } = season;
                  return (
                    <div
                      key={id}
                      className="flex px-3 mb-2 cursor-pointer"
                      onClick={() => {
                        if (type === MediaTypes.Season) {
                          // seasonPlayingPageV2.query = {
                          //   id,
                          // };
                          // app.showView(seasonPlayingPageV2);
                          history.push("root.season_playing", { id });
                          return;
                        }
                        if (type === MediaTypes.Movie) {
                          // moviePlayingPageV2.query = {
                          //   id,
                          // };
                          // app.showView(moviePlayingPageV2);
                          history.push("root.movie_playing", { id });
                          return;
                        }
                        app.tip({
                          text: ["未知的媒体类型"],
                        });
                      }}
                    >
                      <div className="relative w-[128px] h-[198px] mr-4 rounded-lg overflow-hidden">
                        <LazyImage className="w-full h-full object-cover" store={poster.bind(poster_path)} alt={name} />
                        <div className="absolute top-2 left-2">
                          <div className="relative z-20 py-[1px] px-[2px] border text-[12px] rounded-md text-w-bg-1 dark:border-w-fg-1 dark:text-w-fg-1">
                            {(() => {
                              if (type === MediaTypes.Season) {
                                return "电视剧";
                              }
                              if (type === MediaTypes.Movie) {
                                return "电影";
                              }
                              return null;
                            })()}
                          </div>
                        </div>
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
                          {genres.map((tag, i) => {
                            return (
                              <div
                                key={i}
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
            <div style={{ height: 1 }} />
          </ScrollView>
        );
      })()}
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
