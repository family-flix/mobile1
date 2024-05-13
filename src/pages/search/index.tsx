/**
 * @file 影视剧搜索
 */
import React, { useState } from "react";
import dayjs from "dayjs";
import { Loader, Pen, Search, Star, Trash } from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
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
import { useInitialize, useInstance } from "@/hooks/index";
import {
  ScrollViewCore,
  InputCore,
  DialogCore,
  CheckboxGroupCore,
  ButtonCore,
  ImageInListCore,
  NodeCore,
} from "@/domains/ui";
import { ListCoreV2 } from "@/domains/list/v2";
import { RequestCoreV2 } from "@/domains/request/v2";
import { TVSourceOptions, TVGenresOptions, MediaTypes } from "@/constants/index";

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
  const $list = new ListCoreV2(new RequestCoreV2({ fetch: fetchMediaList, process: fetchMediaListProcess, client }), {
    pageSize: 20,
    beforeSearch() {
      $search.setLoading(true);
    },
    afterSearch() {
      $search.setLoading(false);
    },
  });
  const $search = new InputCore({
    placeholder: "请输入关键字搜索",
    autoFocus: true,
    onEnter(v) {
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

  return {
    $list,
    $mediaRequest,
    ui: {
      $scroll,
      $search,
      $poster,
      $settings,
      $source,
      $genres,
      $mediaRequestBtn,
      $node,
    },
  };
}

export const MediaSearchPage: ViewComponent = React.memo((props) => {
  const { app, history, storage, view } = props;

  const $page = useInstance(() => Page(props));

  const [response, setResponse] = useState($page.$list.response);
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
    $page.ui.$search.onChange((v) => {
      if (!v) {
        setShowPlaceholder(true);
        return;
      }
      $page.$list.searchDebounce({
        name: v,
      });
    });
    $page.ui.$search.onClear(() => {
      setShowPlaceholder(true);
    });
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
                  store={$page.ui.$node}
                  className="relative flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto scroll--hidden"
                >
                  {histories.map((keyword, i) => {
                    const { text } = keyword;
                    return (
                      <div
                        key={i}
                        className="px-4 py-2 rounded-md text-sm bg-w-bg-2"
                        onClick={() => {
                          $page.ui.$search.change(text);
                          $page.ui.$search.enter();
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
          <ScrollView
            store={$page.ui.$scroll}
            className="absolute inset-0 box-border text-w-fg-1"
            style={{ top: height }}
          >
            <ListView
              store={$page.$list}
              className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 pt-4"
              extraEmpty={
                <div className="mt-2">
                  <Button store={$page.ui.$mediaRequestBtn} variant="subtle">
                    提交想看的影视剧
                  </Button>
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
                        <LazyImage
                          className="w-full h-full object-cover"
                          store={$page.ui.$poster.bind(poster_path)}
                          alt={name}
                        />
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
    </>
  );
});
