/**
 * @file 首页
 */
import React, { useState } from "react";
import { ArrowUp, Bell, Bird, Search, User } from "lucide-react";

import { fetchCollectionList, fetchUpdatedMediaToday } from "@/services";
import { Input, KeepAliveRouteView } from "@/components/ui";
import { MediaRequestCore } from "@/components/media-request";
import { Show } from "@/components/ui/show";
import { TabHeader } from "@/components/ui/tab-header";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { ScrollViewCore, InputCore, ButtonCore, DialogCore } from "@/domains/ui";
import { fetchPlayingHistories } from "@/domains/media/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import {
  homeHistoryTab,
  homeMinePage,
  homeMovieTab,
  homeRecommendedTab,
  homeSeasonTab,
  mediaSearchPage,
  messageList,
  messagesPage,
} from "@/store";
import { MediaTypes } from "@/constants";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent, ViewComponentWithMenu } from "@/types";
import { cn } from "@/utils";
import { Affix } from "@/components/ui/affix";
import { AffixCore } from "@/domains/ui/affix";
import { AffixPlaceholder } from "@/components/ui/affix-placeholder";

export const HomeIndexPage: ViewComponentWithMenu = React.memo((props) => {
  const { app, router, view, menu } = props;

  const collectionList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchCollectionList), {
        pageSize: 6,
        onLoadingChange(loading) {
          searchInput.setLoading(!collectionList.response.initial && loading);
        },
      })
  );
  const updatedMediaList = useInstance(() => new RequestCore(fetchUpdatedMediaToday));
  const historyList = useInstance(
    () =>
      new ListCore(new RequestCore(fetchPlayingHistories), {
        pageSize: 12,
      })
  );
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        _name: "1",
        onScroll(pos) {
          affix.handleScroll(pos);
          if (!menu) {
            return;
          }
          if (pos.scrollTop > app.screen.height) {
            menu.setCanTop({
              icon: <ArrowUp className="w-6 h-6" />,
              text: "回到顶部",
            });
            return;
          }
          if (pos.scrollTop === 0) {
            menu.setCanRefresh();
            return;
          }
          menu.disable();
        },
        // async onPullToRefresh() {
        //   updatedMediaList.reload();
        //   historyList.refresh();
        //   await collectionList.refresh();
        //   app.tip({
        //     text: ["刷新成功"],
        //   });
        //   scrollView.stopPullToRefresh();
        // },
        onReachBottom() {
          collectionList.loadMore();
        },
      })
  );
  const scrollView2 = useInstance(() => {
    return new ScrollViewCore({
      onReachBottom() {
        // ...
      },
    });
  });
  const tab = useInstance(
    () =>
      new TabHeaderCore({
        options: [
          {
            id: "recommend",
            text: "推荐",
          },
          {
            id: "history",
            text: "观看记录",
          },
          {
            id: "season",
            text: "电视剧",
          },
          {
            id: "movie",
            text: "电影",
          },
          // {
          //   id: "animate",
          //   text: "动漫",
          // },
          // {
          //   id: "zongyi",
          //   text: "综艺",
          // },
          // {
          //   id: "kr-season",
          //   text: "韩剧",
          // },
          // {
          //   id: "jp-season",
          //   text: "日剧",
          // },
          // {
          //   id: "us-season",
          //   text: "美剧",
          // },
        ],
        onChange(value) {
          const { index } = value;
          console.log(index);
          if (index === 0) {
            app.showView(homeRecommendedTab);
            return;
          }
          if (index === 1) {
            app.showView(homeHistoryTab);
            return;
          }
          if (index === 2) {
            app.showView(homeSeasonTab);
            return;
          }
          if (index === 3) {
            app.showView(homeMovieTab);
            return;
          }
        },
        onMounted() {
          tab.select(2);
        },
      })
  );
  const searchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索电视剧",
        onEnter(v) {
          collectionList.search({
            name: v,
          });
        },
        onBlur(v) {
          collectionList.search({
            name: v,
          });
        },
        onClear() {
          // console.log("[PAGE]home/index - onClear", helper, helper.response.search);
          collectionList.search({
            name: "",
          });
        },
      })
  );
  const dialog = useInstance(
    () =>
      new DialogCore({
        onOk() {
          window.location.reload();
        },
      })
  );
  const mediaRequest = useInstance(() => new MediaRequestCore({}));
  const mediaRequestBtn = useInstance(
    () =>
      new ButtonCore({
        onClick() {
          mediaRequest.input.change(searchInput.value);
          mediaRequest.dialog.show();
        },
      })
  );
  const affix = useInstance(
    () =>
      new AffixCore({
        top: 0,
        defaultHeight: 96,
      })
  );

  const [subViews, setSubViews] = useState(view.subViews);
  const [messageResponse, setMessageResponse] = useState(messageList.response);
  const [updatedMediaListState, setUpdatedMediaListState] = useState(updatedMediaList.response);
  const [historyState, setHistoryState] = useState(historyList.response);
  const [height, setHeight] = useState(affix.height);
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
    view.onShow(() => {
      app.setTitle(view.title);
    });
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    view.onCurViewChange((nextCurView) => {
      // updateMenuActive(nextCurView);
    });
    affix.onMounted(({ height }) => {
      setHeight(height);
    });
    const search = (() => {
      const { language = [] } = app.cache.get("tv_search", {
        language: [] as string[],
      });
      if (!language.length) {
        return {};
      }
      return {
        language: language.join("|"),
      };
    })();
    if (menu) {
      menu.onScrollToTop(() => {
        scrollView.scrollTo({ top: 0 });
      });
      menu.onRefresh(async () => {
        scrollView.startPullToRefresh();
        collectionList.init(search);
        historyList.init();
        updatedMediaList.run().then(() => {
          scrollView.stopPullToRefresh();
        });
      });
    }
    messageList.onStateChange((nextState) => {
      setMessageResponse(nextState);
    });
    // collectionList.onStateChange((nextResponse) => {
    //   setResponse(nextResponse);
    // });
    // updatedMediaList.onSuccess((nextState) => {
    //   setUpdatedMediaListState(nextState);
    // });
    // historyList.onStateChange((nextState) => {
    //   setHistoryState(nextState);
    // });
    // mediaRequest.onTip((msg) => {
    //   app.tip(msg);
    // });
    // collectionList.init(search);
    // updatedMediaList.run();
    // historyList.init();
  });

  // const { dataSource } = response;

  // console.log("[PAGE]home - render", dataSource);

  return (
    <>
      <div className="z-10">
        <Affix store={affix} className="z-50 w-full bg-w-bg-0">
          <div className="flex items-center justify-between w-full py-2 px-4 text-w-fg-0 space-x-4">
            <div className="relative flex-1 w-0">
              <Input store={searchInput} prefix={<Search className="w-5 h-5" />} />
              <div
                className="absolute z-10 inset-0"
                onClick={() => {
                  app.showView(mediaSearchPage);
                }}
              ></div>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className="relative"
                onClick={() => {
                  app.showView(messagesPage);
                }}
              >
                <Bell className="w-6 h-6" />
                <Show when={!!messageResponse.total}>
                  <div
                    className="absolute top-[-6px] right-0 px-[8px] h-[16px] rounded-xl break-all whitespace-nowrap text-[12px] border-w-bg-0 dark:border-w-fg-0 bg-w-red text-w-bg-0 dark:text-w-fg-0 translate-x-1/2"
                    style={{
                      lineHeight: "16px",
                    }}
                  >
                    {messageResponse.total}
                  </div>
                </Show>
              </div>
              <div
                className="relative"
                onClick={() => {
                  app.showView(homeMinePage);
                }}
              >
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>
          <TabHeader store={tab} />
        </Affix>
        <div className="absolute inset-0 flex flex-col" style={{ top: height }}>
          <div className="relative flex-1">
            {subViews.map((subView, i) => {
              // const matchedMenu = menus.find((m) => m.view === subView);
              const PageContent = subView.component as ViewComponent;
              return (
                <KeepAliveRouteView key={subView.id} className="absolute inset-0" store={subView} index={i}>
                  <div
                    className={cn(
                      "w-full h-full scrollbar-hide overflow-y-auto opacity-100 scroll scroll--hidden",
                      app.env.android ? "scroll--fix" : ""
                    )}
                  >
                    <PageContent
                      app={app}
                      router={router}
                      view={subView}
                      // menu={matchedMenu}
                      // onScroll={(pos) => {
                      //   homeMenu.setTextAndIcon({
                      //     text: "回到顶部",
                      //     icon: <ArrowUp className="w-6 h-6" />,
                      //   });
                      // }}
                    />
                  </div>
                </KeepAliveRouteView>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
});
