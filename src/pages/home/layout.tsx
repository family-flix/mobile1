/**
 * @file 首页布局
 * 包含「首页」、「电视剧搜索」、「历史播放」和「我的」
 */
import { Car, Film, Home, Users } from "lucide-react";

import { ViewComponent } from "@/types";
import { useState } from "react";
import { useInitialize } from "@/hooks";
import { KeepAliveRouteView } from "@/components/ui/keep-alive-route-view";
import { Sheet } from "@/components/ui/sheet";
import { DialogCore } from "@/domains/ui/dialog";
import { RouteViewCore } from "@/domains/route_view";
import { aView } from "@/store/views";

const dialog = new DialogCore();

export const HomeLayout: ViewComponent = (props) => {
  const { app, router, view } = props;

  const [subViews, setSubViews] = useState(view.subViews);

  useInitialize(() => {
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    view.onMatched((subView) => {
      console.log("home layout match route", view.curView?._name, view.prevView?._name, subView._name);
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
    view.onNotFound(() => {
      view.curView = aView;
      view.appendSubView(aView);
    });
    router.onPathnameChange(({ pathname, type }) => {
      view.checkMatch({ pathname, type });
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
                <div className="w-full h-full scrollbar-hide overflow-y-auto bg-white opacity-100 dark:bg-slate-900 hide-scroll">
                  <PageContent app={app} router={router} view={subView} />
                </div>
              </KeepAliveRouteView>
            );
          })}
        </div>
      </div>
      <div className="h-[80px]">
        <div className="w-full h-[80px]"></div>
        <div className="fixed left-0 bottom-0 grid grid-cols-4 w-screen h-[80px] bg-white opacity-100 dark:bg-slate-900">
          <div
            className="flex flex-col justify-center items-center"
            onClick={() => {
              router.push("/home/index");
            }}
          >
            <div>
              <Home width={24} height={24} />
            </div>
            <div className="mt-2 text-center">首页</div>
          </div>
          <div
            className="flex flex-col justify-center items-center"
            onClick={() => {
              router.push("/home/search");
            }}
          >
            <div>
              <Film width={24} height={24} />
            </div>
            <div className="mt-2 text-center">影片</div>
          </div>
          <div
            className="flex flex-col justify-center items-center"
            onClick={() => {
              router.push("/home/history");
            }}
          >
            <div>
              <Car width={24} height={24} />
            </div>
            <div className="mt-2 text-center">观看记录</div>
          </div>
          <div
            className="flex flex-col justify-center items-center"
            onClick={() => {
              router.push("/home/my");
              // dialog.show();
            }}
          >
            <div>
              <Users width={24} height={24} />
            </div>
            <div className="mt-2 text-center">我的</div>
          </div>
        </div>
      </div>
      <Sheet store={dialog}>
        <div>敬请期待</div>
      </Sheet>
    </div>
  );
};
