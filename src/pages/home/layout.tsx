/**
 * @file 首页布局
 * 包含「首页」、「电视剧搜索」、「历史播放」和「我的」
 */
import React, { useState } from "react";
import { Film, HardDrive, Home, Tv2, User } from "lucide-react";

import { PageKeys } from "@/store/routes";
import { ViewComponent, ViewComponentWithMenu } from "@/store/types";
import { Show } from "@/packages/ui/show";
import { useInitialize, useInstance } from "@/hooks/index";
import { StackRouteView } from "@/components/ui/stack-route-view";
import { BottomMenuCore } from "@/domains/bottom_menu";
import { cn } from "@/utils/index";

const BottomMenu = (props: { store: BottomMenuCore }) => {
  const { store } = props;

  const [state, setState] = useState(store.state);

  useInitialize(() => {
    store.onStateChange((nextState) => {
      setState(nextState);
    });
  });

  const { icon, active, text, badge } = state;
  const i = icon as React.ReactElement;
  const highlightColor = "text-w-brand";

  return (
    <div
      className={cn("flex flex-col justify-center items-center", active ? highlightColor : "")}
      onClick={() => {
        store.handleClick();
      }}
    >
      <div>
        {i}
        <Show when={!!badge}>
          <div className="absolute right-[-4px] top-[-2px] w-2 h-2 rounded-full bg-w-red" />
        </Show>
      </div>
      <div className="mt-1 text-center text-[12px]">{text}</div>
    </div>
  );
};

export const HomeLayout: ViewComponent = React.memo((props) => {
  const { app, history, client, storage, pages, view } = props;

  const homeMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <Home className="w-6 h-6" />,
        // view: homeIndexPage,
        pathname: "root.home_layout.home_index" as PageKeys,
        text: "首页",
      })
  );
  const seasonMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <Tv2 className="w-6 h-6" />,
        // view: homeSeasonPage,
        pathname: "root.home_layout.home_index.home_index_season" as PageKeys,
        text: "电视剧",
      })
  );
  const movieMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <Film className="w-6 h-6" />,
        // view: homeMoviePage,
        pathname: "root.home_layout.home_index.home_index_movie" as PageKeys,
        text: "电影",
      })
  );
  const historyMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <HardDrive className="w-6 h-6" />,
        // view: homeHistoriesPage,
        pathname: "root.home_layout.home_index.home_index_history" as PageKeys,
        text: "观看记录",
      })
  );
  const mineMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <User className="w-6 h-6" />,
        // view: homeMinePage,
        pathname: "root.mine" as PageKeys,
        text: "我的",
      })
  );
  const [subViews, setSubViews] = useState(view.subViews);
  const menus = [homeMenu, seasonMenu, movieMenu, historyMenu, mineMenu];

  useInitialize(() => {
    function updateMenuActive(pathname: PageKeys) {
      const matchedMenu = menus.find((menu) => {
        return menu.pathname === pathname;
      });
      if (!matchedMenu) {
        return;
      }
      const otherMenus = menus.filter((m) => {
        return m.pathname !== pathname;
      });
      for (let i = 0; i < otherMenus.length; i += 1) {
        const m = otherMenus[i];
        m.hide();
      }
      matchedMenu.select();
    }
    updateMenuActive(view.name as PageKeys);
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    // view.onCurViewChange((nextCurView) => {
    //   updateMenuActive(nextCurView);
    // });
    // messageList.initAny();
  });

  return (
    <>
      <div className="relative z-90 w-full h-full">
        {subViews.map((subView, i) => {
          const routeName = subView.name;
          const PageContent = pages[routeName as Exclude<PageKeys, "root">];
          return (
            <StackRouteView key={subView.id} className="absolute left-0 top-0 w-full h-full" store={subView} index={i}>
              <div
                className={cn(
                  "w-full h-full scrollbar-hide overflow-y-auto bg-w-bg-3 opacity-100 scroll scroll--hidden",
                  app.env.android ? "scroll--fix" : ""
                )}
              >
                <PageContent
                  app={app}
                  history={history}
                  client={client}
                  storage={storage}
                  pages={pages}
                  view={subView}
                />
              </div>
            </StackRouteView>
          );
        })}
      </div>
      {/* <div className="relative z-100 h-[68px] box-content safe-bottom">
        <div className="w-full h-[68px] box-content safe-bottom"></div>
        <div className="fixed z-100 left-0 bottom-0 box-content grid grid-cols-5 h-[68px] border-t border-t-w-fg-3 dark:border-t-w-bg-3 bg-w-bg-1 text-w-fg-0 backdrop-blur-md backdrop-filter bg-opacity-50 safe-bottom">
          <BottomMenu store={homeMenu} />
          <BottomMenu store={seasonMenu} />
          <BottomMenu store={movieMenu} />
          <BottomMenu store={historyMenu} />
          <BottomMenu store={mineMenu} />
        </div>
      </div> */}
    </>
  );
});
