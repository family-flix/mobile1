import React, { useState } from "react";
import { Bird, Star } from "lucide-react";

// import { client } from "@/store/request";
// import { moviePlayingPage, moviePlayingPageV2, seasonPlayingPageV2, tvPlayingPage } from "@/store/views";
import { ViewComponent } from "@/store/types";
import { fetchCollectionList } from "@/services";
import { fetchMediaList, fetchMediaListProcess } from "@/services/media";
import { Button, LazyImage, ListView, ScrollView, Skeleton } from "@/components/ui";
import { MediaRequestCore } from "@/components/media-request";
import { ButtonCore, ImageInListCore, ScrollViewCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { ListCoreV2 } from "@/domains/list/v2";
import { RequestCoreV2 } from "@/domains/request/v2";
import { useInitialize, useInstance } from "@/hooks";
import { MediaTypes } from "@/constants";
import { cn } from "@/utils";

export const HomeMovieTabContent: ViewComponent = React.memo((props) => {
  const { app, history, client, storage, view } = props;

  const list = useInstance(
    () =>
      new ListCoreV2(new RequestCoreV2({ fetch: fetchMediaList, process: fetchMediaListProcess, client }), {
        pageSize: 20,
        search: {
          type: MediaTypes.Movie,
        },
      })
  );
  const scroll = new ScrollViewCore({
    onReachBottom() {
      list.loadMore();
    },
  });
  const mediaRequest = useInstance(() => new MediaRequestCore({ client }));
  const mediaRequestBtn = useInstance(
    () =>
      new ButtonCore({
        onClick() {
          mediaRequest.dialog.show();
        },
      })
  );
  const poster = useInstance(() => new ImageInListCore());

  const [response, setResponse] = useState(list.response);
  const { dataSource } = response;

  useInitialize(() => {
    list.onStateChange((v) => {
      setResponse(v);
    });
    list.init();
  });

  return (
    <>
      <ScrollView className="h-full bg-w-bg-3" store={scroll}>
        <ListView
          store={list}
          className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 pt-4"
          skeleton={
            <>
              <div className="flex px-3 pb-3 cursor-pointer">
                <div className="relative w-[128px] h-[198px] mr-4">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="mt-2 flex-1 max-w-full overflow-hidden text-ellipsis">
                  <Skeleton className="w-full h-[32px]"></Skeleton>
                  <Skeleton className="mt-1 w-24 h-[24px]"></Skeleton>
                  <Skeleton className="mt-2 w-32 h-[22px]"></Skeleton>
                </div>
              </div>
              <div className="flex px-3 pb-3 cursor-pointer">
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
                提交想看的电视剧
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
                  className="flex px-3 pb-3 cursor-pointer"
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
      </ScrollView>
    </>
  );
});
