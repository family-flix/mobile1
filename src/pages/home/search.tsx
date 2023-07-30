/**
 * @file 电视剧、电影搜索
 */
import { useState } from "react";

import { MediaTypes, search_tv_and_movie } from "@/domains/tv/services";
import { LazyImage } from "@/components/ui/image";
import { RequestCore } from "@/domains/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInitialize } from "@/hooks";
import { ListCore } from "@/domains/list";
import { ViewComponent } from "@/types";
import { ButtonCore } from "@/domains/ui/button";
import { InputCore } from "@/domains/ui/input";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { sleep } from "@/utils";
import { ScrollView } from "@/components/ui/scroll-view";
import { ListView } from "@/components/ui/list-view";

const helper = new ListCore(new RequestCore(search_tv_and_movie), {
  onLoadingChange(loading) {
    searchBtn.setLoading(loading);
  },
});
const nameInput = new InputCore({
  placeholder: "请输入关键字搜索",
});
const searchBtn = new ButtonCore({
  onClick() {
    if (!nameInput.value) {
      return;
    }
    helper.search({ name: nameInput.value });
  },
});
const scrollView = new ScrollViewCore();

export const HomeSearchPage: ViewComponent = (props) => {
  const { router, view } = props;
  // const [response, helper] = useHelper<PartialSearchedTV>(fetch_tv_list);
  const [response, setResponse] = useState(helper.response);

  useInitialize(() => {
    console.log("home/search initialize");
    view.onReady(() => {
      console.log("home/search ready");
    });
    view.onMounted(() => {
      console.log("home/search mounted");
    });
    view.onShow(() => {
      console.log("home/search show");
    });
    view.onHidden(() => {
      console.log("home/search hide");
    });
    // view.onUnmounted(() => {
    //   console.log("home/search unmounted");
    // });
    scrollView.onPullToRefresh(async () => {
      await (async () => {
        console.log(nameInput.value);
        if (!nameInput.value) {
          return sleep(1200);
        }
        return helper.refresh();
      })();
      scrollView.stopPullToRefresh();
    });
    scrollView.onReachBottom(() => {
      helper.loadMore();
    });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
  });

  const { dataSource } = response;

  return (
    <ScrollView store={scrollView}>
      <div className="pt-4">
        <h2 className="h2 pb-4 text-center">影片搜索</h2>
        <div className="m-auto space-y-2">
          <div className="">
            <div className="flex mt-4 px-4 space-x-2">
              <Input store={nameInput} className="flex-1" />
              <Button store={searchBtn} className="min-w-[80px]">
                搜索
              </Button>
            </div>
          </div>
          <div>
            <ListView className="space-y-4" store={helper}>
              {dataSource.map((t) => {
                const { id, tv_id, name, overview, poster_path, type } = t;
                return (
                  <div
                    key={id}
                    className="flex m-4 cursor-pointer"
                    onClick={() => {
                      if (type === MediaTypes.TV) {
                        router.push(`/tv/play/${tv_id}?season_id=${id}`);
                        return;
                      }
                      router.push(`/movie/play/${id}`);
                    }}
                  >
                    <LazyImage className="w-[120px] h-[180px] mr-4 object-cover" src={poster_path} alt={name} />
                    <div className="flex-1 overflow-hidden text-ellipsis">
                      <h2 className="truncate text-xl">{name}</h2>
                      <div className="mt-2">
                        <p className="text-sm break-all whitespace-pre-wrap truncate line-clamp-6">{overview}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </ListView>
          </div>
        </div>
      </div>
    </ScrollView>
  );
};
