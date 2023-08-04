/**
 * @file 首页布局
 * 包含「首页」、「电视剧搜索」、「历史播放」和「我的」
 */
import { Film, HardDrive, Home, Search, Users } from "lucide-react";

import { ViewComponent } from "@/types";
import { useState } from "react";
import { useInitialize, useInstance } from "@/hooks";
import { KeepAliveRouteView } from "@/components/ui/keep-alive-route-view";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DialogCore } from "@/domains/ui/dialog";
import { ButtonCore } from "@/domains/ui/button";

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

  useInitialize(() => {
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    view.onMatched((subView) => {
      console.log("[LAYOUT]home/layout - view.onMatched", view.curView?._name, view.prevView?._name, subView._name);
      if (subView === view.curView) {
        return;
      }
      const prevView = view.curView;
      view.prevView = prevView;
      view.curView = subView;
      if (!view.subViews.includes(subView)) {
        view.appendSubView(subView);
      }
      subView.show();
      if (view.prevView) {
        view.prevView.hide();
        // setTimeout(() => {
        //   view.removeSubView(prevView);
        // }, 120);
      }
    });
    view.onLayered(() => {
      console.log("[LAYOUT]home/layout - view.onLayered");
    });
    view.onUncover(() => {
      console.log("[LAYOUT]home/layout - view.onUncover");
    });
    // 因为 home layout 和 playing page 是共存的，所以切换到 playing page 时，home layout 也会检查是否匹配，结果是不匹配
    // 所以给 home layout 加了个 index
    view.onNotFound(() => {
      console.log("[LAYOUT]home/layout - view.onNotFound", view.subViews);
      // view.appendSubView(aView);
      // view.curView = aView;
      // view.curView.show();
    });
    router.onPathnameChange(({ pathname, search, type }) => {
      console.log("[LAYOUT]home/layout - router.onPathnameChange", view.state.visible, view.state.layered);
      if (view.state.layered) {
        return;
      }
      view.checkMatch({ pathname, search, type });
    });
    view.checkMatch(router._pending);
  });

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 h-full">
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
      <div className="h-[68px] box-content safe-bottom">
        <div className="w-full h-[68px] box-content safe-bottom"></div>
        <div className="fixed left-0 bottom-0 box-content grid grid-cols-4 w-screen h-[68px] bg-white-900 opacity-100 dark:bg-black-900 safe-bottom">
          <div
            className="flex flex-col justify-center items-center dark:text-black-200"
            onClick={() => {
              router.push("/home/index");
            }}
          >
            <div>
              <Home className="w-5 h-5" />
            </div>
            <div className="mt-2 text-sm text-center">首页</div>
          </div>
          <div
            className="flex flex-col justify-center items-center dark:text-black-200"
            onClick={() => {
              router.push("/home/movie");
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
            className="flex flex-col justify-center items-center dark:text-black-200"
            onClick={() => {
              router.push("/home/history");
            }}
          >
            <div>
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="mt-2 text-sm text-center">观看记录</div>
          </div>
          <div
            className="flex flex-col justify-center items-center dark:text-black-200"
            onClick={() => {
              // router.push("/home/my");
              dialog.show();
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
          <div className="grid grid-cols-1">
            <Button store={logoutBtn}>重新登录</Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
