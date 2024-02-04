import { useState } from "react";

import { request } from "@/store/request";
import { fetchTVChannelList } from "@/services";
import { LazyImage, ListView, ScrollView } from "@/components/ui";
import { ListCoreV2 } from "@/domains/list/v2";
import { RequestCoreV2 } from "@/domains/request_v2";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { ImageInListCore, ScrollViewCore } from "@/domains/ui";
import { useInitialize, useInstance } from "@/hooks";
import { tvChannelPlayingPage } from "@/store/views";
import { ViewComponent } from "@/types";

export const TVLiveListPage: ViewComponent = (props) => {
  const { app, view } = props;

  const list = useInstance(
    () =>
      new ListCoreV2(
        new RequestCoreV2({
          fetch: fetchTVChannelList,
          client: request,
        })
      )
  );
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onReachBottom() {
          list.loadMore();
        },
        onPullToBack() {
          console.log("[PAGE]live/list - onPullToBack", view.state);
          // if (view.state.layered) {
          //   return;
          // }
          app.back();
        },
      })
  );
  const poster = useInstance(() => new ImageInListCore());

  const [listResponse, setListResponse] = useState(list.response);

  useInitialize(() => {
    list.onStateChange((v) => {
      setListResponse(v);
    });
    list.init();
  });

  return (
    <ScrollView className="p-4" store={scrollView}>
      <div className="w-full min-h-screen">
        <ListView store={list}>
          <div className="grid grid-cols-4 gap-2">
            {listResponse.dataSource.map((channel, i) => {
              const { id, name, logo, group_name, url } = channel;
              return (
                <div
                  key={id}
                  onClick={() => {
                    tvChannelPlayingPage.query = {
                      id,
                      name,
                      url,
                    };
                    app.showView(tvChannelPlayingPage);
                  }}
                >
                  <div className="p-2 flex flex-col items-center rounded-md bg-w-bg-3">
                    <div>
                      <LazyImage className="w-[48px] min-h-[48px] object-contain" store={poster.bind(logo)} />
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
};
