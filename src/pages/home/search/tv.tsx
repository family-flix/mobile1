/**
 * @file 电视剧搜索
 */
import { useState } from "react";

import { Button, BackToTop, ListView, ScrollView, Input, LazyImage } from "@/components/ui";
import { ButtonCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { fetch_season_list } from "@/domains/tv/services";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { sleep } from "@/utils";

export const HomeTVSearchPage: ViewComponent = (props) => {
  const { router, view } = props;

  const helper = useInstance(() => {
    return new ListCore(new RequestCore(fetch_season_list), {
      onLoadingChange(loading) {
        searchBtn.setLoading(loading);
      },
    });
  });
  const nameInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索",
      })
  );
  const searchBtn = useInstance(
    () =>
      new ButtonCore({
        onClick() {
          if (!nameInput.value) {
            return;
          }
          helper.search({ name: nameInput.value });
        },
      })
  );
  const scrollView = useInstance(() => new ScrollViewCore());

  // const [response, helper] = useHelper<PartialSearchedTV>(fetch_tv_list);
  const [response, setResponse] = useState(helper.response);

  useInitialize(() => {
    // console.log("home/search initialize");
    nameInput.onMounted(() => {
      setTimeout(() => {
        nameInput.focus();
      }, 800);
    });
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
    <>
      <ScrollView store={scrollView}>
        <div className="">
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
                  const { id, tv_id, name, overview, season_text, poster_path } = t;
                  return (
                    <div
                      key={id}
                      className="flex m-4 cursor-pointer"
                      onClick={() => {
                        router.push(`/tv/play/${tv_id}?season_id=${id}`);
                      }}
                    >
                      <LazyImage className="w-[120px] h-[180px] mr-4 object-cover" src={poster_path} alt={name} />
                      <div className="flex-1 overflow-hidden text-ellipsis">
                        <h2 className="truncate text-xl">{name}</h2>
                        <p className="mt-2 text-sm">{season_text}</p>
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
      <BackToTop store={scrollView} />
    </>
  );
};
