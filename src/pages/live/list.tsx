/**
 * @file 电视频道列表
 */
import React, { useState } from "react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { fetchTVChannelList } from "@/services/index";
import { useInitialize, useInstance } from "@/hooks/index";
import { LazyImage, ListView, ScrollView } from "@/components/ui";
import { ListCore } from "@/domains/list/index";
import { RequestCore } from "@/domains/request/index";
import { ImageInListCore, ScrollViewCore } from "@/domains/ui/index";

function TVLiveListPageLogic(props: ViewComponentProps) {
  const { app, client } = props;
  const list = new ListCore(
    new RequestCore(fetchTVChannelList, {
      client,
    })
  );
  const scrollView = new ScrollViewCore({
    os: app.env,
    async onReachBottom() {
      await list.loadMore();
      scrollView.finishLoadingMore();
    },
  });
  const poster = new ImageInListCore();
  return {
    list,
    scrollView,
    poster,
    ready() {
      list.init();
    },
  };
}

export const TVLiveListPage: ViewComponent = React.memo((props) => {
  const { app, history, client, storage, view } = props;

  const $logic = useInstance(() => TVLiveListPageLogic(props));

  const [listResponse, setListResponse] = useState($logic.list.response);

  useInitialize(() => {
    $logic.list.onStateChange((v) => setListResponse(v));
    $logic.ready();
  });

  return (
    <ScrollView className="p-4" store={$logic.scrollView}>
      <div className="w-full min-h-screen">
        <ListView store={$logic.list}>
          <div className="grid grid-cols-4 gap-2">
            {listResponse.dataSource.map((channel, i) => {
              const { id, name, logo, group_name, url } = channel;
              return (
                <div
                  key={id}
                  onClick={() => {
                    // tvChannelPlayingPage.query = {
                    //   id,
                    //   name,
                    //   url,
                    // };
                    // app.showView(tvChannelPlayingPage);
                    // history.push("root.live", { id, name, url });
                  }}
                >
                  <div className="p-2 flex flex-col items-center rounded-md bg-w-bg-3">
                    <div>
                      <LazyImage className="w-[48px] min-h-[48px] object-contain" store={$logic.poster.bind(logo)} />
                    </div>
                    <div className="max-w-full overflow-hidden mt-2 text-sm text-center">{name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </ListView>
      </div>
    </ScrollView>
  );
});
