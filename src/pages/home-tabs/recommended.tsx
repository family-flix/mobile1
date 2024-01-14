import { useState } from "react";

import { fetchCollectionList } from "@/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";
import { Bird } from "lucide-react";
import { MediaTypes } from "@/constants";
import { moviePlayingPage, moviePlayingPageV2, seasonPlayingPageV2, tvPlayingPage } from "@/store";
import { LazyImage, ListView, Skeleton } from "@/components/ui";
import { ImageInListCore } from "@/domains/ui";

export const HomeRecommendedTabContent: ViewComponent = (props) => {
  const { app } = props;

  const collectionList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchCollectionList), {
        pageSize: 10,
      })
  );
  const poster = useInstance(() => new ImageInListCore());

  const [response, setResponse] = useState(collectionList.response);
  const { dataSource } = response;

  useInitialize(() => {
    collectionList.onStateChange((v) => {
      setResponse(v);
    });
    collectionList.init();
  });

  return (
    <>
      <ListView
        store={collectionList}
        className="relative space-y-3 bg-w-bg-3"
        skeleton={
          <>
            <div className="py-2">
              <div className="px-4">
                <Skeleton className="h-[32px] w-[188px]"></Skeleton>
              </div>
              <div className={cn("flex mt-2 px-4 space-x-3")}>
                <div>
                  <div className="relative rounded-lg overflow-hidden">
                    <Skeleton className="w-[138px] h-[275px] object-cover" />
                  </div>
                </div>
                <div>
                  <div className="relative rounded-lg overflow-hidden">
                    <Skeleton className="w-[138px] h-[275px] object-cover" />
                  </div>
                </div>
              </div>
            </div>
            <div className="py-2">
              <div className="px-4">
                <Skeleton className="h-[32px] w-[188px]"></Skeleton>
              </div>
              <div className={cn("flex mt-2 px-4 space-x-2 scroll--hidden")}>
                <div>
                  <div className="relative w-[240px] h-[216px] rounded-lg overflow-hidden">
                    <Skeleton className="w-full h-full " />
                  </div>
                </div>
              </div>
            </div>
          </>
        }
      >
        {(() => {
          return dataSource.map((collection) => {
            const { id, title, desc, medias } = collection;
            return (
              <div key={id} className="flex pt-4 text-w-fg-0">
                <div>
                  <div className="px-4">
                    <h2 className="text-xl">{title}</h2>
                    {desc && <div className="text-sm text-w-fg-1">{desc}</div>}
                  </div>
                  <div
                    className={cn(
                      "flex mt-2 py-4 w-screen min-h-[248px] overflow-x-auto px-4 space-x-3 scroll scroll--hidden",
                      app.env.android ? "scroll--fix" : ""
                    )}
                  >
                    {(() => {
                      if (medias.length === 0) {
                        return (
                          <div className="flex items-center justify-center w-full h-full mt-[68px]">
                            <div className="flex flex-col items-center justify-center text-w-fg-1">
                              <Bird className="w-16 h-16" />
                              <div className="mt-2">暂无数据</div>
                            </div>
                          </div>
                        );
                      }
                      return medias.map((media) => {
                        const { id, name, type, poster_path, text: episode_count_text, air_date } = media;
                        return (
                          <div
                            key={id}
                            className="w-[128px]"
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
                                text: ["数据异常"],
                              });
                            }}
                          >
                            <div className="relative w-[128px] h-[192px] rounded-lg overflow-hidden">
                              <LazyImage
                                className="w-full h-full object-cover"
                                store={poster.bind(poster_path)}
                                alt={name}
                              />
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
                              <div className="flex items-center overflow-hidden text-ellipsis">
                                <h2 className="break-all truncate">{name}</h2>
                              </div>
                              <div className="flex items-center">
                                <div className="text-sm text-w-fg-1">{air_date}</div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </ListView>
    </>
  );
};
