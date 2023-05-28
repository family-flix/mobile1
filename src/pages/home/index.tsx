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

const dialog = new DialogCore();

export const HomePage: ViewComponent = (props) => {
  const { app, router, view } = props;

  const [subViews, setSubViews] = useState(view.subViews);

  useInitialize(() => {
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
  });

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 h-full">
        <div className="relative w-full h-full">
          {subViews.map((subView, i) => {
            const PageContent = subView.component as ViewComponent;
            return (
              <KeepAliveRouteView key={subView.id} store={subView} index={i}>
                <div className="overflow-y-auto w-full h-full scrollbar-hide">
                  <div className="min-h-full">
                    <PageContent app={app} router={router} view={subView} />
                  </div>
                </div>
              </KeepAliveRouteView>
            );
          })}
        </div>
      </div>
      <div className="h-[80px]">
        <div className="w-full h-[80px]"></div>
        <div className="fixed left-0 bottom-0 grid grid-cols-4 w-screen h-[80px] py-2 bg-slate-300">
          <div
            className="flex flex-col justify-center items-center"
            onClick={() => {
              router.replace("/home/index");
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
              router.replace("/home/search");
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
              router.replace("/home/history");
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
              dialog.show();
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
