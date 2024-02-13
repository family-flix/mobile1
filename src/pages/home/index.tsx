/**
 * @file 首页
 */
import React, { useState } from "react";
import { ArrowUp, Bell, Bird, Search, User } from "lucide-react";

import { messageList } from "@/store/index";
import { ViewComponentWithMenu } from "@/store/types";
import { PageKeys } from "@/store/routes";
import {
  fetchCollectionList,
  fetchCollectionListProcess,
  fetchUpdatedMediaToday,
  fetchUpdatedMediaTodayProcess,
} from "@/services";
import { Input, KeepAliveRouteView } from "@/components/ui";
import { StackRouteView } from "@/components/ui/stack-route-view";
import { Affix } from "@/components/ui/affix";
import { MediaRequestCore } from "@/components/media-request";
import { Show } from "@/components/ui/show";
import { TabHeader } from "@/components/ui/tab-header";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { ScrollViewCore, InputCore, ButtonCore, DialogCore } from "@/domains/ui";
import { fetchPlayingHistories } from "@/domains/media/services";
import { AffixCore } from "@/domains/ui/affix";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ListCoreV2 } from "@/domains/list/v2";
import { useInitialize, useInstance } from "@/hooks";
import { cn } from "@/utils";
import { MediaOriginCountry } from "@/constants";

export const HomeIndexPage: ViewComponentWithMenu = React.memo((props) => {
  const { app, history, client, storage, pages, view, menu } = props;

  const collectionList = useInstance(
    () =>
      new ListCoreV2(
        new RequestCoreV2({
          fetch: fetchCollectionList,
          process: fetchCollectionListProcess,
          client,
        }),
        {
          pageSize: 6,
          onLoadingChange(loading) {
            searchInput.setLoading(!collectionList.response.initial && loading);
          },
        }
      )
  );
  const updatedMediaList = useInstance(
    () =>
      new RequestCoreV2({
        fetch: fetchUpdatedMediaToday,
        process: fetchUpdatedMediaTodayProcess,
        client: client,
      })
  );
  const historyList = useInstance(
    () =>
      new ListCoreV2(
        new RequestCoreV2({
          fetch: fetchPlayingHistories,
          client: client,
        }),
        {
          pageSize: 12,
        }
      )
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
      new TabHeaderCore<{
        key: "id";
        options: {
          id: string;
          name: PageKeys;
          text: string;
          query: Record<string, string>;
        }[];
      }>({
        key: "id",
        options: [
          {
            id: "recommended",
            name: "root.home_layout.home_index.home_index_recommended",
            text: "推荐",
            query: {},
          },
          {
            id: "history",
            name: "root.home_layout.home_index.home_index_history",
            text: "观看记录",
            query: {},
          },
          {
            id: "china",
            name: "root.home_layout.home_index.home_index_season",
            text: "电视剧",
            query: {
              language: MediaOriginCountry.CN,
            },
          },
          {
            id: "movie",
            name: "root.home_layout.home_index.home_index_movie",
            text: "电影",
            query: {},
          },
          // {
          //   id: "animate",
          //   text: "动漫",
          // },
          // {
          //   id: "zongyi",
          //   text: "综艺",
          // },
          {
            id: "korean",
            name: "root.home_layout.home_index.home_index_season",
            text: "韩剧",
            query: {
              language: MediaOriginCountry.KR,
            },
          },
          {
            id: "jp",
            name: "root.home_layout.home_index.home_index_season",
            text: "日剧",
            query: {
              language: MediaOriginCountry.JP,
            },
          },
          {
            id: "us",
            name: "root.home_layout.home_index.home_index_season",
            text: "美剧",
            query: {
              language: MediaOriginCountry.US,
            },
          },
        ],
        onChange(value) {
          const { name, query } = value;
          history.push(name, query);
        },
        onMounted() {
          console.log("[PAGE]home/index - tab-header onMounted", history.$router.query);
          const key = history.$router.query.key;
          if (!key) {
            tab.selectById("china", { ignore: true });
            return;
          }
          tab.selectById(key, { ignore: true });
        },
      })
  );
  const searchInput = useInstance(
    () =>
      new InputCore({
        placeholder: "请输入关键字搜索",
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
  const mediaRequest = useInstance(() => new MediaRequestCore({ client }));
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
  // const [updatedMediaListState, setUpdatedMediaListState] = useState(updatedMediaList.response);
  // const [historyState, setHistoryState] = useState(historyList.response);
  const [height, setHeight] = useState(affix.height);
  // const [hasSearch, setHasSearch] = useState(
  //   (() => {
  //     const { language = [] } = storage.get("tv_search");
  //     return language.length !== 0;
  //   })()
  // );

  // const [history_response] = useState(history_helper.response);
  useInitialize(() => {
    view.onShow(() => {
      app.setTitle(view.title);
    });
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    history.onRouteChange(({ href, query }) => {
      const { key } = query;
      if (!tab.mounted) {
        return;
      }
      console.log("[PAGE]home/index - history.onRouteChange", href, query);
      tab.handleChangeById(key);
    });
    affix.onMounted(({ height }) => {
      setHeight(height);
    });
    const search = (() => {
      const { language = [] } = storage.get("tv_search", { language: [] });
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
                  // app.showView(mediaSearchPage);
                  history.push("root.search");
                }}
              ></div>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className="relative"
                onClick={() => {
                  history.push("root.messages");
                  // app.showView(messagesPage);
                  // app.tip({
                  //   text: ["测试消息"],
                  // });
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
                  history.push("root.mine");
                  // app.showView(homeMinePage);
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
              const routeName = subView.name;
              const PageContent = pages[routeName as Exclude<PageKeys, "root">];
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
                      history={history}
                      storage={storage}
                      client={client}
                      pages={pages}
                      view={subView}
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
