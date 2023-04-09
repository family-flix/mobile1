/**
 * @file 影视剧搜索
 */
import { useEffect, useState } from "react";

import useHelper from "@/domains/list-helper-hook";
import { Page, Router } from "@/domains/router";
import { CurUser } from "@/domains/user";
import { fetch_tv_list } from "@/services";
import { PartialSearchedTV } from "@/services";
import LazyImage from "@/components/LazyImage";
import ScrollView from "@/components/ScrollView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInitialize, useLatestValue } from "@/hooks";

interface IProps {
  router: Router;
  page: Page;
  user: CurUser;
}
export const TVSearchResultPage: React.FC<IProps> = (props) => {
  const { router, page, user } = props;
  const { name: queryName = "" } = router.query;
  const [response, helper] = useHelper<PartialSearchedTV>(fetch_tv_list);
  const [name, set_name] = useState(queryName);
  const latestNameRef = useLatestValue(name);

  useInitialize(() => {
    page.onPullToRefresh(() => {
      if (!latestNameRef.current) {
        return;
      }
      helper.refresh();
    });
    page.onReachBottom(() => {
      helper.loadMore();
    });
  });

  const { dataSource } = response;

  return (
    <>
      <div className="min-h-screen max-w-screen p-4 pt-8">
        <div className="m-auto space-y-2">
          <div className="">
            <h2 className="h2 mt-4 pb-4 text-center">搜索结果</h2>
            <div className="flex mt-4 space-x-2">
              <Input
                className=""
                placeholder="请输入名称搜索"
                value={name}
                onChange={(event) => {
                  set_name(event.target.value);
                }}
              />
              <Button
                className="w-[80px]"
                onClick={() => {
                  if (!name) {
                    return;
                  }
                  helper.search({ name });
                }}
              >
                搜索
              </Button>
            </div>
          </div>
          <ScrollView {...response}>
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
                    <LazyImage
                      className="w-[120px] mr-4 object-cover"
                      src={poster_path}
                      alt={name || original_name}
                    />
                    <div className="flex-1 max-w-sm overflow-hidden text-ellipsis">
                      <h2 className="truncate text-xl">{name}</h2>
                      <div className="mt-2">
                        <p className="text-sm break-all whitespace-pre-wrap truncate line-clamp-6">
                          {overview}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollView>
        </div>
      </div>
    </>
  );
};
