/**
 * @file 电影列表页
 */
import React, { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { ScrollView } from "@/components/ui/scroll-view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { LazyImage } from "@/components/ui/image";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { fetch_movie_list } from "@/domains/movie/services";
import { ListView } from "@/components/ui/list-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { InputCore } from "@/domains/ui/input";
import { DialogCore } from "@/domains/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { CheckboxGroupCore } from "@/domains/ui/checkbox/group";
import { MediaSourceOptions, MovieGenresOptions } from "@/constants";

export const HomeMoviePage: ViewComponent = React.memo((props) => {
  const { app, router, view } = props;

  const scrollView = useInstance(() => new ScrollViewCore());
  const helper = useInstance(
    () =>
      new ListCore(new RequestCore(fetch_movie_list), {
        pageSize: 6,
        search: (() => {
          const { language = [] } = app.cache.get("movie_search", {
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
  const settingsSheet = useInstance(() => new DialogCore());
  const fakeSearchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索电影",
      })
  );
  const [hasSearch, setHasSearch] = useState(
    (() => {
      const { language = [] } = app.cache.get("movie_search", {
        language: [] as string[],
      });
      return language.length !== 0;
    })()
  );
  const sourceCheckboxGroup = useInstance(() => {
    const { language = [] } = app.cache.get("movie_search", {
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
        app.cache.merge("movie_search", {
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
      options: MovieGenresOptions,
      onChange(options) {
        // app.cache.merge("tv_search", {
        //   genres: options,
        // });
        helper.search({
          genres: options.join("|"),
        });
      },
    });
  });

  const [response, setResponse] = useState(helper.response);
  // const [history_response] = useState(history_helper.response);
  useInitialize(() => {
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
    scrollView.onPullToRefresh(async () => {
      await helper.refresh();
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      console.log("load  more");
      helper.loadMore();
    });
    // page.onReady(() => {
    //   history_helper.init();
    //   helper.init();
    // });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
  });
  useEffect(() => {
    helper.init();
  }, []);

  const { dataSource, error } = response;

  console.log("[PAGE]home - render", dataSource);

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
                      router.push("/search");
                    }}
                  ></div>
                  <Input store={fakeSearchInput} />
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
              <div className="h-[56px]"></div>
            </div>
            <ListView
              store={helper}
              className="grid grid-cols-1 pb-[24px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
              skeleton={
                <div className="w-full mx-auto">
                  <div className="m-4 cursor-pointer">
                    <Skeleton className="w-full h-[524px] dark:bg-gray-800" />
                    <div className="mt-4 max-w-sm overflow-hidden text-ellipsis">
                      <Skeleton className="w-[256px] h-[32px] dark:bg-gray-800"></Skeleton>
                    </div>
                  </div>
                </div>
              }
            >
              {(() => {
                return dataSource.map((tv) => {
                  const { id, name, overview, poster_path = "" } = tv;
                  return (
                    <div
                      key={id}
                      className="m-4 cursor-pointer"
                      onClick={() => {
                        router.push(`/movie/play/${id}`);
                      }}
                    >
                      <LazyImage className="w-full h-[512px] object-cover" src={poster_path} alt={name} />
                      <div className="mt-4 max-w-sm overflow-hidden text-ellipsis">
                        <h2 className="truncate text-2xl">{name}</h2>
                      </div>
                    </div>
                  );
                });
              })()}
            </ListView>
          </div>
        </div>
      </ScrollView>
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
