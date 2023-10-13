/**
 * @file 首页布局
 * 包含「首页」、「电视剧搜索」、「历史播放」和「我的」
 */
import { useState } from "react";
import { Film, HardDrive, Home, MessageCircle, MessageSquare, Tv2, Users } from "lucide-react";

import { Button, Sheet, KeepAliveRouteView } from "@/components/ui";
import { ButtonCore, DialogCore } from "@/domains/ui";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import {
  homeHistoriesPage,
  homeIndexPage,
  homeLayout,
  homeMessagesPage,
  homeMinePage,
  homeMoviePage,
  homeSeasonPage,
  messageList,
} from "@/store";
import { cn } from "@/utils";
import { Show } from "@/components/ui/show";

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
  const [messageResponse, setMessageResponse] = useState(messageList.response);

  useInitialize(() => {
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    view.onCurViewChange((nextCurView) => {
      setCurView(nextCurView);
    });
    messageList.onStateChange((nextState) => {
      setMessageResponse(nextState);
    });
    messageList.initIfInitial();
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
        <div className="fixed z-100 left-0 bottom-0 box-content grid grid-cols-5 w-screen h-[68px] bg-white-900 opacity-100 dark:bg-black-900 safe-bottom">
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
              <Home className="w-6 h-6" />
            </div>
            <div className="mt-1 text-center text-[12px]">首页</div>
          </div>
          <div
            className={cn(
              "flex flex-col justify-center items-center dark:text-black-200",
              curView === homeSeasonPage ? highlightColor : ""
            )}
            onClick={() => {
              homeLayout.showSubView(homeSeasonPage);
            }}
          >
            <div>
              <Tv2 className="w-6 h-6" />
            </div>
            <div className="mt-1 text-center text-[12px]">电视剧</div>
          </div>
          <div
            className={cn(
              "flex flex-col justify-center items-center dark:text-black-200",
              curView === homeMoviePage ? highlightColor : ""
            )}
            onClick={() => {
              homeLayout.showSubView(homeMoviePage);
            }}
          >
            <div>
              <Film className="w-6 h-6" />
            </div>
            <div className="mt-1 text-center text-[12px]">电影</div>
          </div>
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
              <HardDrive className="w-6 h-6 dark:text-slate-500" />
            </div>
            <div className="mt-1 text-center text-[12px]">观看记录</div>
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
            <div className="relative">
              <Users className="w-6 h-6" />
              <Show when={!!messageResponse.total}>
                <div className="absolute right-[-4px] top-[-2px] w-2 h-2 rounded-full bg-red-500" />
              </Show>
            </div>
            <div className="mt-1 text-center text-[12px]">我的</div>
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
