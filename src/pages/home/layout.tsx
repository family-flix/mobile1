/**
 * @file 首页布局
 * 包含「首页」、「电视剧搜索」、「历史播放」和「我的」
 */
import { useState } from "react";
import { Film, HardDrive, Home, Users } from "lucide-react";

import { Button, Sheet, KeepAliveRouteView } from "@/components/ui";
import { ButtonCore, DialogCore } from "@/domains/ui";
import { NavigatorCore } from "@/domains/navigator";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";
import { homeHistoriesPage, homeIndexPage, homeLayout, homeMinePage, homeMoviePage } from "@/store";

export const HomeLayout: ViewComponent = (props) => {
  const { app, router, view } = props;

  const dialog = useInstance(() => new DialogCore());
  const logoutBtn = useInstance(
    () =>
      new ButtonCore({
        async onClick() {
          const r = await app.user.validate(router.query.token, "1");
          if (r.error) {
            return;
          }
          router.reload();
        },
      })
  );
  const [subViews, setSubViews] = useState(view.subViews);
  const [curView, setCurView] = useState(view.curView);
  const [curPathname, setCurPathname] = useState(router.pathname);
  const [state, setState] = useState(app.state);

  useInitialize(() => {
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    view.onCurViewChange((nextCurView) => {
      setCurView(nextCurView);
    });
    // view.onMatched((subView) => {
    //   console.log("[LAYOUT]home/layout - view.onMatched", view.curView?._name, view.prevView?._name, subView._name);
    //   if (subView === view.curView) {
    //     return;
    //   }
    //   const prevView = view.curView;
    //   view.prevView = prevView;
    //   view.curView = subView;
    //   if (!view.subViews.includes(subView)) {
    //     view.appendSubView(subView);
    //   }
    //   subView.show();
    //   if (view.prevView) {
    //     view.prevView.hide();
    //     // setTimeout(() => {
    //     //   view.removeSubView(prevView);
    //     // }, 120);
    //   }
    // });
    // view.onLayered(() => {
    //   console.log("[LAYOUT]home/layout - view.onLayered");
    // });
    // view.onUncover(() => {
    //   console.log("[LAYOUT]home/layout - view.onUncover");
    // });
    // // 因为 home layout 和 playing page 是共存的，所以切换到 playing page 时，home layout 也会检查是否匹配，结果是不匹配
    // // 所以给 home layout 加了个 index
    // view.onNotFound(() => {
    //   console.log("[LAYOUT]home/layout - view.onNotFound", view.subViews);
    // });
    // router.onPathnameChange(({ pathname, search, type }) => {
    //   setCurPathname(pathname);
    //   console.log("[LAYOUT]home/layout - router.onPathnameChange", view.state.visible, view.state.layered);
    //   if (view.state.layered) {
    //     return;
    //   }
    //   view.checkMatch({ pathname, search, type });
    // });
    // view.checkMatch(router._pending);
  });

  // console.log("[PAGE]home/layout - render", view);
  const highlightColor = "text-green-600 dark:text-green-600";

  return (
    <div className="flex flex-col w-full h-full">
      <div className="relative z-90 flex-1 h-full">
        <div className="relative w-full h-full">
          {subViews.map((subView, i) => {
            const PageContent = subView.component as ViewComponent;
            return (
              <KeepAliveRouteView
                key={subView.id}
                className="absolute left-0 top-0 w-full h-full"
                store={subView}
                index={i}
              >
                <div className="w-full h-full scrollbar-hide overflow-y-auto bg-white opacity-100 dark:bg-black hide-scroll">
                  <PageContent app={app} router={router} view={subView} />
                </div>
              </KeepAliveRouteView>
            );
          })}
        </div>
      </div>
      <div className="relative z-100 h-[68px] box-content safe-bottom">
        <div className="w-full h-[68px] box-content safe-bottom"></div>
        <div className="fixed z-100 left-0 bottom-0 box-content grid grid-cols-4 w-screen h-[68px] bg-white-900 opacity-100 dark:bg-black-900 safe-bottom">
          <div
            className={cn(
              "flex flex-col justify-center items-center dark:text-black-200",
              curView === homeIndexPage ? highlightColor : ""
            )}
            onClick={() => {
              homeLayout.showSubView(homeIndexPage);
            }}
          >
            <div>
              <Home className="w-5 h-5" />
            </div>
            <div className="mt-2 text-sm text-center">首页</div>
          </div>
          <div
            className={cn(
              "flex flex-col justify-center items-center dark:text-black-200",
              curView === homeMoviePage ? highlightColor : ""
            )}
            onClick={() => {
              // router.push("/home/movie");
              homeLayout.showSubView(homeMoviePage);
            }}
          >
            <div>
              <Film className="w-5 h-5" />
            </div>
            <div className="mt-2 text-sm text-center">电影</div>
          </div>
          {/* <div
            className="flex flex-col justify-center items-center dark:text-black-200"
            onClick={() => {
              router.push("/home/search");
            }}
          >
            <div>
              <Search className="w-5 h-5" />
            </div>
            <div className="mt-2 text-sm text-center">搜索</div>
          </div> */}
          <div
            className={cn(
              "flex flex-col justify-center items-center dark:text-black-200",
              curView === homeHistoriesPage ? highlightColor : ""
            )}
            onClick={() => {
              homeLayout.showSubView(homeHistoriesPage);
            }}
          >
            <div>
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="mt-2 text-sm text-center">观看记录</div>
          </div>
          <div
            className={cn(
              "flex flex-col justify-center items-center dark:text-black-200",
              curView === homeMinePage ? highlightColor : ""
            )}
            onClick={() => {
              homeLayout.showSubView(homeMinePage);
            }}
          >
            <div>
              <Users className="w-5 h-5" />
            </div>
            <div className="mt-2 text-sm text-center">我的</div>
          </div>
        </div>
      </div>
      <Sheet store={dialog}>
        <div className="p-4">
          {/* <div>
            {(() => {
              if (state.theme === "light") {
                return (
                  <div className="p-2 cursor-pointer">
                    <Moon className="w-8 h-8" />
                  </div>
                );
              }
              return (
                <div className="p-2 cursor-pointer">
                  <Sun className="w-8 h-8" />
                </div>
              );
            })()}
          </div> */}
          <div className="grid grid-cols-1">
            <Button store={logoutBtn}>重新登录</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
