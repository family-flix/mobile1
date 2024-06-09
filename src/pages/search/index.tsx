/**
 * @file 影视剧搜索
 */
import React, { useState } from "react";
import dayjs from "dayjs";
import { Loader, Pen, Search, Star, Trash } from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { fetchMediaList, fetchMediaListProcess, fetchMediaRanks, fetchMediaRanksProcess } from "@/services/media";
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
} from "@/components/ui/index";
import { MediaRequestCore } from "@/components/media-request/index";
import { useInitialize, useInstance } from "@/hooks/index";
import {
  ScrollViewCore,
  InputCore,
  DialogCore,
  CheckboxGroupCore,
  ButtonCore,
  ImageInListCore,
  NodeCore,
} from "@/domains/ui/index";
import { ListCore } from "@/domains/list/index";
import { RequestCore } from "@/domains/request/index";
import { TVSourceOptions, TVGenresOptions, MediaTypes, CollectionTypes } from "@/constants/index";
import { cn } from "@/utils/index";

function Page(props: ViewComponentProps) {
  const { app, history, client, storage, view } = props;

  const { language = [] } = storage.get("tv_search");

  const $scroll = new ScrollViewCore({
    os: app.env,
    async onPullToRefresh() {
      await $list.refresh();
      app.tip({
        text: ["刷新成功"],
      });
      $scroll.finishPullToRefresh();
    },
    async onReachBottom() {
      await $list.loadMore();
      $scroll.finishLoadingMore();
    },
  });
  const $scroll2 = new ScrollViewCore({ os: app.env });
  const $list = new ListCore(new RequestCore(fetchMediaList, { process: fetchMediaListProcess, client }), {
    pageSize: 20,
    beforeSearch() {
      $search.setLoading(true);
    },
    afterSearch() {
      $search.setLoading(false);
    },
  });
  const $rank = new RequestCore(fetchMediaRanks, { process: fetchMediaRanksProcess, client });
  const $search = new InputCore({
    placeholder: "请输入关键字搜索",
    autoFocus: true,
    onEnter(v) {
      if (v === $list.params.name) {
        return;
      }
      $list.search({
        name: v,
      });
      $scroll.scrollTo({ top: 0 });
    },
    onBlur(v) {
      if (!v) {
        return;
      }
      if (v === $list.params.name) {
        return;
      }
      $list.search({
        name: v,
      });
    },
  });
  const $settings = new DialogCore();
  const $poster = new ImageInListCore();
  const $source = new CheckboxGroupCore({
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
      $list.search({
        language: options.join("|"),
      });
    },
  });
  const $genres = new CheckboxGroupCore({
    options: TVGenresOptions,
    onChange(options) {
      $list.search({
        genres: options.join("|"),
      });
    },
  });
  const $mediaRequest = new MediaRequestCore({ client });
  const $mediaRequest2 = new MediaRequestCore({ client });
  const $mediaRequestBtn = new ButtonCore({
    onClick() {
      $mediaRequest.input.change($search.value);
      $mediaRequest.dialog.show();
    },
  });
  const $node = new NodeCore({
    onMounted(params) {
      if (!params.canScroll) {
        return;
      }
    },
  });
  $mediaRequest.onTip((msg) => {
    app.tip(msg);
  });
  $mediaRequest2.onTip((msg) => {
    app.tip(msg);
  });

  return {
    $list,
    $rank,
    $mediaRequest,
    $mediaRequest2,
    ui: {
      $scroll,
      $scroll2,
      $search,
      $poster,
      $settings,
      $source,
      $genres,
      $mediaRequestBtn,
      $node,
    },
    ready() {
      $rank.run();
    },
  };
}

export const MediaSearchPage: ViewComponent = React.memo((props) => {
  const { app, history, storage, view } = props;

  const $page = useInstance(() => Page(props));

  const [response, setResponse] = useState($page.$list.response);
  const [rankResponse, setRankResponse] = useState($page.$rank.state);
  // const [keyword, setKeyword] = useState($page.ui.$search.value);
  const [height, setHeight] = useState(56);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [histories, setHistories] = useState(storage.values.media_search_histories);

  useInitialize(() => {
    view.onShow(() => {
      app.setTitle(view.title);
    });
    storage.onStateChange((v) => {
      setHistories(v.values.media_search_histories);
    });
    $page.$list.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    $page.$list.onAfterSearch(({ params }) => {
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
    $page.$rank.onStateChange((v) => setRankResponse(v));
    $page.ui.$search.onChange((v) => {
      console.log("$page.ui.$search.onChange", v);
      if (!v) {
        setShowPlaceholder(true);
        return;
      }
      // $page.$list.search({
      //   name: v,
      // });
    });
    $page.ui.$search.onClear(() => {
      setShowPlaceholder(true);
    });
    $page.ready();
  });

  return (
    <>
      <div className="z-50 w-full bg-w-bg-0">
        <div className="flex items-center justify-between w-full py-2 px-4 text-w-fg-0 space-x-3">
          <div className="flex-1 w-0">
            <Input store={$page.ui.$search} focus prefix={<Search className="w-5 h-5" />} />
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
      </div>
      {(() => {
        if (showPlaceholder) {
          return (
            <ScrollView
              store={$page.ui.$scroll2}
              className="absolute bottom-0 left-0 w-full text-w-fg-1"
              style={{ top: height }}
            >
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
                <div className="flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto scroll--hidden">
                  {histories.map((keyword, i) => {
                    const { text } = keyword;
                    return (
                      <div
                        key={i}
                        className="inline-block px-4 py-2 rounded-md text-sm bg-w-bg-2"
                        onClick={() => {
                          $page.ui.$search.change(text);
                          $page.ui.$search.enter();
                        }}
                      >
                        {text}
                      </div>
                    );
                  })}
                </div>
              </div>
              {(() => {
                if (rankResponse.response === null) {
                  return null;
                }
                return (
                  <div
                    className="__a scroll-area flex p-4 space-x-4 overflow-x-auto scroll scroll--hidden"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onTouchStart={(event) => {
                      event.stopPropagation();
                    }}
                    onTouchMove={(event) => {
                      event.stopPropagation();
                    }}
                    onAnimationEnd={(event) => {
                      const $dom = event.currentTarget;
                      $dom.addEventListener("touchstart", (e) => {
                        e.stopPropagation();
                      });
                      $dom.addEventListener("touchmove", (e) => {
                        e.stopPropagation();
                      });
                    }}
                  >
                    {rankResponse.response.map((rank, i) => {
                      const { id, type, title, desc, medias } = rank;
                      return (
                        <div key={id} className="py-4 rounded-md bg-w-bg-2 shadow-lg">
                          <div className="w-[248px]">
                            <div className="flex items-center justify-between px-4">
                              <div className="text-lg text-w-brand">{title}</div>
                            </div>
                            <div className="px-4 italic opacity-500" style={{ fontSize: 12 }}>
                              {desc}
                            </div>
                            <div className="mt-4 px-2 space-y-1">
                              {medias.map((media, i) => {
                                const { key, id, name, order } = media;
                                return (
                                  <div
                                    key={key}
                                    className="flex items-center max-w-full overflow-hidden break-keep whitespace-nowrap truncate text-ellipsis text-sm"
                                    onClick={() => {
                                      if (id === null) {
                                        $page.$mediaRequest2.input.change(name);
                                        $page.$mediaRequest2.dialog.show();
                                        return;
                                      }
                                      if (type === CollectionTypes.DoubanMovieRank) {
                                        history.push("root.movie_playing", { id });
                                        return;
                                      }
                                      if (type === CollectionTypes.DoubanSeasonRank) {
                                        history.push("root.season_playing", { id });
                                        return;
                                      }
                                      app.tip({
                                        text: ["未知错误"],
                                      });
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        "w-[28px] text-gray-400 text-center italic tracking-tight font-mono",
                                        [1, 2, 3].includes(order) ? "text-orange-500" : ""
                                      )}
                                    >
                                      {order}
                                    </div>
                                    <div
                                      className={cn(
                                        "flex-1 w-0",
                                        [1, 2, 3].includes(order) ? "text-orange-500" : "",
                                        id === null ? "opacity-50" : ""
                                      )}
                                    >
                                      {name}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </ScrollView>
          );
        }
        return (
          <ScrollView
            store={$page.ui.$scroll}
            className="absolute bottom-0 left-0 w-full text-w-fg-1"
            style={{ top: height }}
          >
            <ListView
              store={$page.$list}
              className="relative grid grid-cols-1"
              extraEmpty={
                <div className="mt-2">
                  <Button store={$page.ui.$mediaRequestBtn} variant="subtle">
                    提交想看的影视剧
                  </Button>
                </div>
              }
              extraNoMore={
                <div
                  className="mt-2 text-center"
                  onClick={() => {
                    $page.$mediaRequest.input.change($page.ui.$search.value);
                    $page.$mediaRequest.dialog.show();
                  }}
                >
                  没有找到想看的？点击反馈
                </div>
              }
            >
              {(() => {
                return response.dataSource.map((season) => {
                  const {
                    id,
                    type,
                    name,
                    episode_count_text,
                    vote,
                    genres,
                    air_date,
                    poster_path = "",
                    full,
                    actors,
                  } = season;
                  return (
                    <div
                      key={id}
                      className="flex px-3 mb-4 cursor-pointer"
                      onClick={() => {
                        if (type === MediaTypes.Season) {
                          history.push("root.season_playing", { id });
                          return;
                        }
                        if (type === MediaTypes.Movie) {
                          history.push("root.movie_playing", { id });
                          return;
                        }
                        app.tip({
                          text: ["未知的媒体类型"],
                        });
                      }}
                    >
                      <div className="relative w-[128px] h-[198px] mr-4 rounded-lg overflow-hidden">
                        <LazyImage
                          className="w-full h-full object-cover"
                          store={$page.ui.$poster.bind(poster_path)}
                          alt={name}
                        />
                        <div className="absolute top-2 left-2">
                          <div className="relative z-20 py-[1px] px-[2px] border text-[12px] rounded-md text-w-bg-1 dark:border-w-fg-1 dark:text-w-fg-1"></div>
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
                      <div className="flex-1 max-w-full overflow-hidden">
                        <div className="flex items-center">
                          <h2 className="text-xl text-w-fg-0">{name}</h2>
                        </div>
                        {(() => {
                          if (vote === null) {
                            return null;
                          }
                          return (
                            <div className="mt-2">
                              <div
                                className={cn(
                                  "relative",
                                  vote <= 6 ? "text-gray-500" : vote >= 8 ? "text-orange-500" : "text-w-brand"
                                )}
                                style={{}}
                              >
                                <span className="italic tracking-tight font-mono text-lg">{vote}</span>
                                <span className="relative ml-1 italic" style={{ top: -1, left: -2, fontSize: 10 }}>
                                  分
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="flex items-center mt-1">
                          <div>{air_date}</div>
                          <p className="mx-2 ">·</p>
                          <div className="flex items-center space-x-2">
                            {episode_count_text ? (
                              <div
                                className={cn(
                                  "relative flex items-center bg-gray-100 rounded-md dark:bg-gray-800",
                                  full ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-500" : ""
                                )}
                                style={{
                                  padding: "2px 4px",
                                  fontSize: 12,
                                }}
                              >
                                {episode_count_text}
                              </div>
                            ) : null}
                            <div
                              className="relative flex items-center bg-orange-100 text-orange-600 rounded-md dark:bg-orange-800"
                              style={{
                                padding: "2px 4px",
                                fontSize: 12,
                              }}
                            >
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
                        </div>
                        {actors ? (
                          <div
                            className={cn(
                              "mt-1 text-sm rounded-md bg-blue-100 text-blue-600 overflow-hidden text-ellipsis break-keep whitespace-nowrap",
                              "dark:text-blue-400 dark:bg-gray-900"
                            )}
                            style={{ padding: "2px 4px", fontSize: 12 }}
                          >
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
      <Sheet store={$page.ui.$settings}>
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
              <CheckboxGroup store={$page.ui.$source} />
            </div>
            <div>
              <CheckboxGroup store={$page.ui.$genres} />
            </div>
          </div>
        </div>
      </Sheet>
      <Dialog store={$page.$mediaRequest.dialog}>
        <div className="text-w-fg-1">
          <p>输入想看的电视剧</p>
          <div className="mt-4">
            <Input prefix={<Pen className="w-4 h-4" />} store={$page.$mediaRequest.input} />
          </div>
        </div>
      </Dialog>
      <Dialog store={$page.$mediaRequest2.dialog}>
        <div className="text-w-fg-1">
          <p>暂未收录，点击确定请求收录</p>
          <div className="mt-4">
            <Input prefix={<Pen className="w-4 h-4" />} store={$page.$mediaRequest2.input} />
          </div>
        </div>
      </Dialog>
      {/* <Dialog store={$page.$mediaProfile}></Dialog> */}
    </>
  );
});
