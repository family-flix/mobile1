/**
 * @file 项目根入口
 */
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

// store 必须第一个
import { app, rootView, homeIndexPage, pages, messageList } from "./store";
import { ToastCore } from "./domains/ui/toast";
import { connect } from "./domains/app/connect.web";
import { NavigatorCore } from "./domains/navigator";
import { ThemeProvider } from "./components/Theme";
import { StackRouteView } from "./components/ui/stack-route-view";
import { Toast } from "./components/ui/toast";
import { useInitialize } from "./hooks";
import { ViewComponent } from "./types";
import { cn } from "./utils";

import "./index.css";

const { router } = app;
// @ts-ignore
window.__app__ = app;

app.onClickLink(({ href }) => {
  const { pathname, query } = NavigatorCore.parse(href);
  const matched = pages.find((v) => {
    return v.key === pathname;
  });
  if (matched) {
    matched.query = query as Record<string, string>;
    app.showView(matched);
    return;
  }
  app.tip({
    text: ["没有匹配的页面"],
  });
});
app.onPopState((options) => {
  const { pathname } = NavigatorCore.parse(options.pathname);
  const matched = pages.find((v) => {
    // console.log(v.key, pathname);
    // return [NavigatorCore.prefix, v.key].join("/") === pathname;
    return v.key === pathname;
  });
  if (matched) {
    matched.isShowForBack = true;
    matched.query = router.query;
    app.showView(matched, { back: true });
    return;
  }
  homeIndexPage.isShowForBack = true;
  app.showView(homeIndexPage, { back: true });
});
connect(app);

const toast = new ToastCore();

function ApplicationView() {
  // const [showMask, setShowMask] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [subViews, setSubViews] = useState(rootView.subViews);

  useInitialize(() => {
    const { innerWidth, innerHeight, location } = window;
    rootView.onViewShow((views) => {
      const curView = views.pop();
      if (!curView) {
        return;
      }
      if (curView.isShowForBack) {
        curView.isShowForBack = false;
        return;
      }
      // console.log("cur view title", curView.title);
      if (app.env.android) {
        const r = curView.buildUrl();
        router.pushState(r);
      }
    });
    rootView.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
    app.onReady(() => {
      setReady(true);
      messageList.init();
      (() => {
        const { pathname } = NavigatorCore.parse(router.pathname);
        const matched = pages.find((v) => {
          return v.key === pathname;
        });
        console.log("[ROOT]after app.router.prepare", matched);
        if (matched) {
          if (matched === rootView) {
            homeIndexPage.query = router.query;
            app.showView(homeIndexPage);
            return;
          }
          matched.query = router.query;
          app.showView(matched);
          return;
        }
        app.showView(homeIndexPage);
      })();
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
    app.router.prepare(location);
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
                "fixed inset-0 bg-w-bg-0 opacity-100",
                "animate-in",
                index !== 0 ? " slide-in-from-right" : "",
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
