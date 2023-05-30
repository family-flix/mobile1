/**
 * @file 电视剧搜索
 */
import { useState } from "react";

import { fetch_tv_list, TVItem } from "@/domains/tv/services";
import LazyImage from "@/components/LazyImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInitialize, useUnmounted } from "@/hooks";
import { ListCore } from "@/domains/list";
import { ViewComponent } from "@/types";
import { ButtonCore } from "@/domains/ui/button";
import { InputCore } from "@/domains/ui/input";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { sleep } from "@/utils";
import { ScrollView } from "@/components/ui/scroll-view";

// @ts-ignore
const helper = new ListCore<TVItem>(fetch_tv_list);
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
              <Input store={nameInput} className="" />
              <Button store={searchBtn} className="w-[80px]">
                搜索
              </Button>
            </div>
          </div>
          <div>
            <div className="space-y-4">
              {dataSource.map((t) => {
                const { id, name, original_name, overview, poster_path } = t;
                return (
                  <div
                    key={id}
                    className="flex m-4 cursor-pointer"
                    onClick={() => {
                      router.push(`/play/${id}`);
                    }}
                  >
                    <LazyImage className="w-[120px] mr-4 object-cover" src={poster_path} alt={name || original_name} />
                    <div className="flex-1 max-w-sm overflow-hidden text-ellipsis">
                      <h2 className="truncate text-xl">{name}</h2>
                      <div className="mt-2">
                        <p className="text-sm break-all whitespace-pre-wrap truncate line-clamp-6">{overview}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ScrollView>
  );
};
