import React, { useState } from "react";
import { Star } from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { fetchMediaList, fetchMediaListProcess } from "@/services/media";
import { Button, LazyImage, ListView, ScrollView, Skeleton } from "@/components/ui";
import { MediaRequestCore } from "@/biz/media_request";
import { ButtonCore, ImageInListCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { useInitialize, useInstance } from "@/hooks/index";
import { MediaTypes } from "@/constants/index";
import { cn } from "@/utils/index";
import { ItemTypeFromListCore } from "@/domains/list/typing";

function Page(props: ViewComponentProps) {
  const { app, client, history, view } = props;

  const $list = new ListCore(
    new RequestCore(fetchMediaList, {
      process: fetchMediaListProcess,
      client,
    }),
    {
      pageSize: 20,
      search: {
        type: MediaTypes.Season,
      },
    }
  );
  const $scroll = new ScrollViewCore({
    os: app.env,
    async onPullToRefresh() {
      await $list.refresh();
      $scroll.finishPullToRefresh();
    },
    async onReachBottom() {
      await $list.loadMore();
      $scroll.finishLoadingMore();
    },
  });
  const $image = new ImageInListCore();
  const $mediaRequest = new MediaRequestCore({ client });
  const $mediaRequestBtn = new ButtonCore({
    onClick() {
      $mediaRequest.dialog.show();
    },
  });

  return {
    $list,
    ui: {
      $scroll,
      $image,
      $mediaRequestBtn,
    },
    ready() {
      $list.init({ language: view.query.language });
    },
    handleClickSeason(season: ItemTypeFromListCore<typeof $list>) {
      const { id, type } = season;
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
    },
  };
}

export const HomeSeasonTabContent: ViewComponent = React.memo((props) => {
  const { app, client, history, view, storage } = props;

  const $page = useInstance(() => Page(props));

  const [response, setResponse] = useState($page.$list.response);

  useInitialize(() => {
    $page.$list.onStateChange((v) => setResponse(v));
    $page.ready();
  });

  return (
    <>
      <ScrollView className="h-full bg-w-bg-3" store={$page.ui.$scroll}>
        <ListView
          store={$page.$list}
          className="relative grid grid-cols-1 pt-4"
          skeleton={
            <>
              <div className="flex px-3 pb-3 cursor-pointer">
                <div className="relative w-[128px] h-[198px] mr-4">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="flex-1 max-w-full overflow-hidden text-ellipsis">
                  <Skeleton className="w-full h-[32px]"></Skeleton>
                  <Skeleton className="mt-1 w-24 h-[24px]"></Skeleton>
                  <Skeleton className="mt-2 w-32 h-[22px]"></Skeleton>
                </div>
              </div>
              <div className="flex px-3 pb-3 cursor-pointer">
                <div className="relative w-[128px] h-[198px] mr-4">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="flex-1 max-w-full overflow-hidden text-ellipsis">
                  <Skeleton className="w-full h-[32px]"></Skeleton>
                  <Skeleton className="mt-1 w-24 h-[24px]"></Skeleton>
                  <Skeleton className="mt-2 w-32 h-[22px]"></Skeleton>
                </div>
              </div>
            </>
          }
          extraEmpty={
            <div className="mt-2">
              <Button store={$page.ui.$mediaRequestBtn} variant="subtle">
                提交想看的电视剧
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
                full,
                vote,
                genres,
                air_date,
                poster_path = "",
                actors,
              } = season;
              return (
                <div
                  key={id}
                  className="flex px-3 pb-3 cursor-pointer"
                  onClick={() => {
                    $page.handleClickSeason(season);
                  }}
                >
                  <div className="relative w-[128px] h-[198px] mr-4 rounded-lg overflow-hidden">
                    <LazyImage
                      className="w-full h-full object-cover"
                      store={$page.ui.$image.bind(poster_path)}
                      alt={name}
                    />
                  </div>
                  <div className="flex-1 max-w-full overflow-hidden">
                    <div className="flex items-center">
                      <h2 className="text-xl text-w-fg-0">{name}</h2>
                    </div>
                    <div className="flex items-center mt-1">
                      <div>{air_date}</div>
                      <p className="mx-2 ">·</p>
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
      </ScrollView>
    </>
  );
});
