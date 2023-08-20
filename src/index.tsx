/**
 * @file 项目根入口
 */
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

// store 必须第一个
import { app, homeIndexPage, homeLayout, pages } from "./store";
import { ThemeProvider } from "./components/Theme";
import { StackRouteView } from "./components/ui/stack-route-view";
import { Toast } from "./components/ui/toast";
import { ToastCore } from "./domains/ui/toast";
import { connect } from "./domains/app/connect.web";
import { useInitialize } from "./hooks";
import { rootView } from "./store/views";
import { ViewComponent } from "./types";
import { cn } from "./utils";

import "./index.css";

const { router } = app;
// @ts-ignore
window.__app__ = app;

// router.onPathnameChange(({ pathname, type }) => {
//   // router.log("[]Application - pathname change", pathname);
//   rootView.checkMatch({ pathname, type });
// });
app.onPopState((options) => {
  const { type, pathname } = options;
  router.handlePopState({ type, pathname });
});

connect(app);

const toast = new ToastCore();

function ApplicationView() {
  // const [showMask, setShowMask] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subViews, setSubViews] = useState(rootView.subViews);
  useInitialize(() => {
    rootView.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    app.onTip((msg) => {
      const { text } = msg;
      toast.show({
        texts: text,
      });
    });
    app.onError((err) => {
      setError(err);
    });
    // console.log("[]Application - before start", window.history);
    const { innerWidth, innerHeight, location } = window;
    app.router.prepare(location);
    (() => {
      const matched = pages.find((v) => {
        return v.checkMatchRegexp(router.pathname);
      });
      if (matched) {
        matched.query = router.query;
        // @todo 这样写只能展示 /home/xxx 路由，应该根据路由，找到多层级视图，即 rootView,homeLayout,homeIndexPage 这样
        rootView.showSubView(homeLayout);
        homeLayout.showSubView(matched);
        return;
      }
      rootView.showSubView(homeLayout);
      homeLayout.showSubView(homeIndexPage);
    })();
    app.start({
      width: innerWidth,
      height: innerHeight,
    });
  });

  // console.log("[ROOT]renderer - render", subViews);

  if (error) {
    return (
      <div
        className={cn("fixed inset-0 z-10")}
        onClick={() => {
          app.router.reload();
        }}
      >
        <div className="w-screen h-screen flex items-center justify-center">
          <div>
            <div className="text-3xl text-center">{error.message}</div>
            <div className="mt-4 text-center">请根据上述提示进行操作，或者点击刷新</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* {showMask && (
        <div
          className={cn(
            "app__mask fixed inset-0 z-10 bg-yellow-300",
            ready ? "opacity-0 scale-150" : "opacity-100 scale-100"
          )}
        >
          <div className="w-screen h-screen flex items-center justify-center">
            <div>
              <div>Test Page</div>
              <div>Welcome using the video site</div>
            </div>
          </div>
        </div>
      )} */}
      <div className={cn("screen w-screen h-screen")}>
        {subViews.map((subView, index) => {
          const PageContent = subView.component as ViewComponent;
          return (
            <StackRouteView
              key={subView.id}
              className={cn(
                "fixed inset-0 bg-white opacity-100 dark:bg-black",
                "animate-in slide-in-from-right",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right"
              )}
              store={subView}
              index={index}
            >
              <PageContent app={app} router={router} view={subView} />
            </StackRouteView>
          );
        })}
      </div>
      <Toast store={toast} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <ApplicationView />
    </ThemeProvider>
  </React.StrictMode>
);
