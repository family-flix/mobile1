/**
 * @file 电视剧搜索
 */
import { useState } from "react";

import { fetch_tv_list, TVItem } from "@/domains/tv/services";
import LazyImage from "@/components/LazyImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInitialize } from "@/hooks";
import { ListCore } from "@/domains/list";
import { ViewComponent } from "@/types";
import { ButtonCore } from "@/domains/ui/button";
import { InputCore } from "@/domains/ui/input";

// @ts-ignore
const helper = new ListCore<TVItem>(fetch_tv_list);
const nameInput = new InputCore();
const searchBtn = new ButtonCore({
  onClick() {
    if (!nameInput.value) {
      return;
    }
    helper.search({ name: nameInput.value });
  },
});

export const TVSearchPage: ViewComponent = (props) => {
  const { router, view } = props;
  // const [response, helper] = useHelper<PartialSearchedTV>(fetch_tv_list);
  const [response, setResponse] = useState(helper.response);

  useInitialize(() => {
    // view.onPullToRefresh(() => {
    //   if (!latestNameRef.current) {
    //     return;
    //   }
    //   helper.refresh();
    // });
    // view.onReachBottom(() => {
    //   helper.loadMore();
    // });
    helper.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
  });

  const { dataSource } = response;

  return (
    <>
      <div className="max-w-screen p-4 pt-8">
        <div className="m-auto space-y-2">
          <div className="">
            <h2 className="h2 mt-4 pb-4 text-center">搜索结果</h2>
            <div className="flex mt-4 space-x-2">
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
    </>
  );
};
