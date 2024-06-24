/**
 * @file 首页
 */
import React, { useState } from "react";
import { ArrowRightCircle, ArrowUp, Bell, Search, User } from "lucide-react";

import { messageList } from "@/store/index";
import { ViewComponentProps, ViewComponentWithMenu } from "@/store/types";
import { canShowDialog, dialogHasShow } from "@/store/dialog";
import { PageKeys } from "@/store/routes";
import { fetchUpdatedMediaHasHistory, fetchUpdatedMediaHasHistoryProcess } from "@/services";
import { useInitialize, useInstance } from "@/hooks/index";
import { Show } from "@/packages/ui/show";
import { Input, LazyImage, Sheet } from "@/components/ui";
import { StackRouteView } from "@/components/ui/stack-route-view";
import { TabHeader } from "@/components/ui/tab-header";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { ScrollViewCore, InputCore, DialogCore, ImageInListCore } from "@/domains/ui";
import { AffixCore } from "@/domains/ui/affix";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { MediaOriginCountry } from "@/constants/index";
import { sleep } from "@/utils/index";

function Page(props: ViewComponentProps) {
  const { app, history, client, storage, pages, view } = props;

  const $scroll = new ScrollViewCore({
    os: app.env,
    onScroll(pos) {
      $affix.handleScroll(pos);
    },
  });
  const $affix = new AffixCore({
    top: 0,
    defaultHeight: 96,
  });
  const $tab = new TabHeaderCore<{
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
      const { id, name, query = {} } = value;
      history.push(name, { id, ...query });
    },
  });
  const $search = new InputCore({
    placeholder: "请输入关键字搜索",
  });
  const $image = new ImageInListCore({});
  const $updatedMediaDialog = new DialogCore({ footer: false });
  const $updatedMediaList = new ListCore(
    new RequestCore(fetchUpdatedMediaHasHistory, {
      process: fetchUpdatedMediaHasHistoryProcess,
      client,
    }),
    {
      pageSize: 5,
    }
  );

  return {
    $updatedMediaList,
    ui: {
      $scroll,
      $search,
      $tab,
      $image,
      $affix,
      $updatedMediaDialog,
    },
    ready() {
      view.onShow(() => {
        app.setTitle(view.title);
      });
      history.onRouteChange(async ({ pathname, href, query }) => {
        if (!$tab.mounted) {
          return;
        }
        console.log("[PAGE]home/index - history.onRouteChange", pathname, query);
        if (!query.id) {
          return;
        }
        await sleep(200);
        $tab.selectById(query.id);
      });
      $tab.onMounted(() => {
        const pathname = history.$router.pathname;
        console.log("[PAGE]home/index - tab-header onMounted", pathname, $tab.key);
        $tab.selectById("china");
      });
      $updatedMediaList.onStateChange((v) => {
        if (v.dataSource.length === 0) {
          return;
        }
        if (canShowDialog("updated_history")) {
          $updatedMediaDialog.show();
          dialogHasShow("updated_history");
        }
      });
      $updatedMediaList.init();
    },
  };
}

export const HomeIndexPage: ViewComponentWithMenu = React.memo((props) => {
  const { app, history, client, storage, pages, view, menu } = props;

  const $page = useInstance(() => Page(props));

  const [subViews, setSubViews] = useState(view.subViews);
  const [messageResponse, setMessageResponse] = useState(messageList.response);
  const [updatedMediaResponse, setUpdatedMediaResponse] = useState($page.$updatedMediaList.response);
  const [height, setHeight] = useState($page.ui.$affix.height);

  useInitialize(() => {
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    // $page.ui.$affix.onMounted(({ height }) => {
    //   setHeight(height);
    // });
    $page.$updatedMediaList.onStateChange((v) => {
      setUpdatedMediaResponse(v);
    });
    $page.ui.$scroll.onScroll((pos) => {
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
    });
    if (menu) {
      menu.onScrollToTop(() => {
        $page.ui.$scroll.scrollTo({ top: 0 });
      });
      menu.onRefresh(async () => {
        $page.ui.$scroll.startPullToRefresh();
      });
    }
    messageList.onStateChange((nextState) => {
      setMessageResponse(nextState);
    });
    $page.ready();
  });

  return (
    <>
      <div className="z-10">
        <div className="z-50 w-full bg-w-bg-0">
          <div className="flex items-center justify-between w-full py-2 px-4 text-w-fg-0 space-x-4">
            <div className="relative flex-1 w-0">
              <Input store={$page.ui.$search} prefix={<Search className="w-5 h-5" />} />
              <div
                className="absolute z-10 inset-0"
                onClick={() => {
                  history.push("root.search");
                }}
              ></div>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className="relative"
                onClick={() => {
                  history.push("root.messages");
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
                }}
              >
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>
          <TabHeader store={$page.ui.$tab as any} />
        </div>
        <div className="absolute inset-0 flex flex-col" style={{ top: height }}>
          {subViews.map((subView, i) => {
            const routeName = subView.name;
            const PageContent = pages[routeName as Exclude<PageKeys, "root">];
            return (
              <StackRouteView
                key={subView.id}
                className="absolute inset-0"
                style={{ zIndex: i }}
                store={subView}
                index={i}
              >
                <PageContent
                  app={app}
                  history={history}
                  storage={storage}
                  client={client}
                  pages={pages}
                  view={subView}
                />
              </StackRouteView>
            );
          })}
        </div>
      </div>
      <Sheet title="有更新" store={$page.ui.$updatedMediaDialog} size="content">
        <div className="px-4 pt-4 mb-4 flex w-full h-[280px] overflow-x-auto scroll--hidden safe-bottom">
          {updatedMediaResponse.dataSource.map((media) => {
            const { id, name, poster_path, latest_episode } = media;
            return (
              <div
                key={id}
                className="mr-2"
                onClick={() => {
                  history.push("root.season_playing", { id });
                  $page.ui.$updatedMediaDialog.hide();
                }}
              >
                <div className="w-[120px] h-[180px] rounded-md">
                  <LazyImage
                    className="w-full h-full rounded-md object-cover"
                    store={$page.ui.$image.bind(poster_path)}
                    alt={name}
                  />
                </div>
                <div className="w-[120px] mt-2">
                  <div className="text-lg text-w-fg-1 truncate text-ellipsis">{name}</div>
                  <div className="">
                    <div className="max-w-full text-w-fg-2 text-sm truncate text-ellipsis">
                      <div className="">{latest_episode.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div
            className=""
            onClick={() => {
              history.push("root.history_updated");
              $page.ui.$updatedMediaDialog.hide();
            }}
          >
            <div className="flex items-center justify-center w-[120px] h-[180px] rounded-md bg-w-bg-1">
              <div className="flex flex-col items-center justify-center text-w-fg-2">
                <ArrowRightCircle className="w-12 h-12" />
                <div className="mt-1">查看更多</div>
              </div>
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
});
