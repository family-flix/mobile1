/**
 * @file 首页布局
 * 包含「首页」、「电视剧搜索」、「历史播放」和「我的」
 */
import React, { useState } from "react";
import { ArrowUp, Film, HardDrive, Home, MessageCircle, MessageSquare, Tv2, User, Users } from "lucide-react";
import { debounce } from "lodash/fp";

import { Button, Sheet, KeepAliveRouteView } from "@/components/ui";
import { Show } from "@/components/ui/show";
import { ButtonCore, DialogCore } from "@/domains/ui";
import { BaseDomain, Handler } from "@/domains/base";
import { Application } from "@/domains/app";
import { RouteViewCore } from "@/domains/route_view";
import { BottomMenuCore } from "@/domains/bottom_menu";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent, ViewComponentWithMenu } from "@/types";
import {
  homeHistoriesPage,
  homeIndexPage,
  homeLayout,
  messagesPage,
  homeMinePage,
  homeMoviePage,
  homeSeasonPage,
  messageList,
  app,
} from "@/store";
import { cn } from "@/utils";

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

export const HomeLayout: ViewComponent = (props) => {
  const { app, router, view } = props;

  const homeMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <Home className="w-6 h-6" />,
        view: homeIndexPage,
        text: "首页",
      })
  );
  const seasonMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <Tv2 className="w-6 h-6" />,
        view: homeSeasonPage,
        text: "电视剧",
      })
  );
  const movieMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <Film className="w-6 h-6" />,
        view: homeMoviePage,
        text: "电影",
      })
  );
  const historyMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <HardDrive className="w-6 h-6" />,
        view: homeHistoriesPage,
        text: "观看记录",
      })
  );
  const mineMenu = useInstance(
    () =>
      new BottomMenuCore({
        app,
        icon: <User className="w-6 h-6" />,
        view: homeMinePage,
        text: "我的",
      })
  );
  const [subViews, setSubViews] = useState(view.subViews);
  const menus = [homeMenu, seasonMenu, movieMenu, historyMenu, mineMenu];

  useInitialize(() => {
    function updateMenuActive(curView: RouteViewCore) {
      const matchedMenu = menus.find((menu) => {
        return menu.view === curView;
      });
      if (!matchedMenu) {
        return;
      }
      const otherMenus = menus.filter((m) => {
        return m.view !== curView;
      });
      for (let i = 0; i < otherMenus.length; i += 1) {
        const m = otherMenus[i];
        m.hide();
      }
      matchedMenu.select();
    }
    if (view.curView) {
      updateMenuActive(view.curView);
    }
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    view.onCurViewChange((nextCurView) => {
      updateMenuActive(nextCurView);
    });
    messageList.initAny();
  });

  return (
    <div className="flex flex-col w-full h-full">
      <div className="relative z-90 flex-1 h-full">
        <div className="relative w-full h-full">
          {subViews.map((subView, i) => {
            const matchedMenu = menus.find((m) => m.view === subView);
            const PageContent = subView.component as ViewComponentWithMenu;
            return (
              <KeepAliveRouteView
                key={subView.id}
                className="absolute left-0 top-0 w-full h-full"
                store={subView}
                index={i}
              >
                <div
                  className={cn(
                    "w-full h-full scrollbar-hide overflow-y-auto bg-w-bg-3 opacity-100 scroll scroll--hidden",
                    app.env.android ? "scroll--fix" : ""
                  )}
                >
                  <PageContent
                    app={app}
                    router={router}
                    view={subView}
                    menu={matchedMenu}
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
      {/* <div className="relative z-100 h-[68px] box-content safe-bottom">
        <div className="w-full h-[68px] box-content safe-bottom"></div>
        <div className="fixed z-100 left-0 bottom-0 box-content grid grid-cols-5 w-screen h-[68px] border-t border-t-w-fg-3 dark:border-t-w-bg-3 bg-w-bg-1 text-w-fg-0 backdrop-blur-md backdrop-filter bg-opacity-50 safe-bottom">
          <BottomMenu store={homeMenu} />
          <BottomMenu store={seasonMenu} />
          <BottomMenu store={movieMenu} />
          <BottomMenu store={historyMenu} />
          <BottomMenu store={mineMenu} />
        </div>
      </div> */}
    </div>
  );
};
