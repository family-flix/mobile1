/**
 * @file 首页
 */
import React, { useEffect, useState } from "react";
import { ArrowUp, SlidersHorizontal } from "lucide-react";

import { fetch_season_list } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { ScrollView } from "@/components/ui/scroll-view";
import { LazyImage } from "@/components/ui/image";
import { ListView } from "@/components/ui/list-view";
import { useInitialize, useInstance } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewComponent } from "@/types";
import { Input } from "@/components/ui/input";
import { InputCore } from "@/domains/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { DialogCore } from "@/domains/ui/dialog";
import { MediaSourceOptions, TVGenresOptions } from "@/constants";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { CheckboxGroupCore } from "@/domains/ui/checkbox/group";
import { BackToTop } from "@/components/back-to-top";

export const HomeIndexPage: ViewComponent = React.memo((props) => {
  const { app, router, view } = props;

  const scrollView = useInstance(() => new ScrollViewCore());
  const settingsSheet = useInstance(() => new DialogCore());
  const fakeSearchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索电视剧",
      })
  );
  const sourceCheckboxGroup = useInstance(() => {
    const { language = [] } = app.cache.get("tv_search", {
      language: [] as string[],
    });
    return new CheckboxGroupCore({
      options: MediaSourceOptions.map((opt) => {
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
  const tvGenresCheckboxGroup = useInstance(() => {
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
        helper.search({
          genres: options.join("|"),
        });
      },
    });
  });
  const helper = useInstance(
    () =>
      new ListCore(new RequestCore(fetch_season_list), {
        pageSize: 6,
        search: (() => {
          const { language = [] } = app.cache.get("tv_search", {
            language: [] as string[],
          });
          if (!language.length) {
            return {};
          }
          return {
            language: language.join("|"),
          };
        })(),
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
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      helper.loadMore();
    });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
    helper.init();
  });

  const { dataSource } = response;

  // console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <ScrollView store={scrollView}>
        <div className="">
          <div className="">
            <div>
              <div className="fixed top-0 flex items-center justify-between w-full p-4 pb-0 space-x-4">
                <div className="relative w-full">
                  <div
                    className="absolute inset-0"
                    onClick={() => {
                      router.push("/search_tv");
                    }}
                  ></div>
                  <Input store={fakeSearchInput} />
                </div>
                <div
                  className="relative p-2"
                  onClick={() => {
                    console.log("click");
                    settingsSheet.show();
                  }}
                >
                  <SlidersHorizontal className="w-5 h-5 dark:text-black-200" />
                  {hasSearch && <div className="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-red-500"></div>}
                </div>
              </div>
              <div className="h-[56px]"></div>
            </div>
            <ListView
              store={helper}
              className="relative grid grid-cols-1 pb-[24px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
              skeleton={
                <div className="w-full mx-auto">
                  <div className="m-4 cursor-pointer">
                    <Skeleton className="w-full h-[512px] dark:bg-gray-800" />
                    <div className="mt-4 max-w-sm overflow-hidden text-ellipsis">
                      <Skeleton className="w-[256px] h-[32px] dark:bg-gray-800"></Skeleton>
                    </div>
                  </div>
                </div>
              }
            >
              {(() => {
                return dataSource.map((season) => {
                  const { id, tv_id, name, season_text, poster_path = "" } = season;
                  return (
                    <div
                      key={id}
                      className="m-4 cursor-pointer"
                      onClick={() => {
                        router.push(`/tv/play/${tv_id}?season_id=${id}`);
                      }}
                    >
                      <LazyImage className="w-full h-[512px] object-cover" src={poster_path} alt={name} />
                      <div className="mt-4 max-w-sm overflow-hidden flex items-center text-ellipsis">
                        <h2 className="truncate text-2xl">{name}</h2>
                        <p className="mx-2 text-gray-500">·</p>
                        <p className="text-2xl text-gray-500 whitespace-nowrap">{season_text}</p>
                      </div>
                    </div>
                  );
                });
              })()}
            </ListView>
          </div>
        </div>
      </ScrollView>
      <BackToTop store={scrollView} />
      <Sheet store={settingsSheet}>
        <div className="h-[320px] py-4 pb-8 px-2 overflow-y-auto">
          <div>
            <CheckboxGroup store={sourceCheckboxGroup} />
          </div>
          <div>
            <CheckboxGroup store={tvGenresCheckboxGroup} />
          </div>
        </div>
      </Sheet>
    </>
  );
});
