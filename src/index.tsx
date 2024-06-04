/**
 * @file 应用入口
 */
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { history, app } from "./store/index";
import { PageKeys, routesWithPathname } from "./store/routes";
import { pages } from "./store/views";
import { client } from "./store/request";
import { useInitialize, useInstance } from "./hooks/index";
import { ThemeProvider } from "./components/theme-switch";
import { StackRouteView } from "./components/ui/stack-route-view";
import { Toast, Dialog } from "./components/ui";
import { ToastCore } from "./domains/ui/toast";
import { connect as connectApplication } from "./domains/app/connect.web";
import { connect as connectHistory } from "./domains/history/connect.web";
import { NavigatorCore } from "./domains/navigator/index";
import { DialogCore } from "./domains/ui/index";
import { cn } from "./utils/index";

import "./index.css";

history.onClickLink(({ href, target }) => {
  const { pathname, query } = NavigatorCore.parse(href);
  const route = routesWithPathname[pathname];
  // console.log("[ROOT]history.onClickLink", pathname, query, route);
  if (!route) {
    app.tip({
      text: ["没有匹配的页面"],
    });
    return;
  }
  if (target === "_blank") {
    const u = history.buildURLWithPrefix(route.name, query);
    window.open(u);
    return;
  }
  history.push(route.name, query);
  return;
});
connectApplication(app);
connectHistory(history);

const view = history.$view;

function ApplicationView() {
  const $toast = useInstance(() => new ToastCore());
  const $upgrade = useInstance(
    () =>
      new DialogCore({
        title: "升级提示",
        cancel: false,
        onOk() {
          window.location.reload();
        },
      })
  );
  // const [showMask, setShowMask] = useState(true);
  // const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [subViews, setSubViews] = useState(view.subViews);

  useInitialize(() => {
    const { innerWidth, innerHeight, location } = window;
    view.onSubViewsChange((v) => {
      // console.log("[ROOT]rootView.onSubViewsChange", nextSubViews.length);
      setSubViews(v);
    });
    history.onRouteChange(({ reason, view, href, ignore }) => {
      // console.log("[ROOT]rootView.onRouteChange", href, history.$router.href);
      const { title } = view;
      app.setTitle(title);
      if (ignore) {
        return;
      }
      if (app.env.ios) {
        return;
      }
      if (reason === "push") {
        history.$router.pushState(href);
      }
      if (reason === "replace") {
        history.$router.replaceState(href);
      }
    });
    app.onTip((msg) => {
      const { text } = msg;
      $toast.show({
        texts: text,
      });
    });
    app.onUpdate(() => {
      $upgrade.show();
    });
    app.onTip((msg) => {
      const { text } = msg;
      $toast.show({
        texts: text,
      });
    });
    app.onError((err) => {
      setError(err);
    });
    history.$router.prepare(location);
    app.start({
      width: app.env.pc ? 375 : innerWidth,
      height: innerHeight,
    });
  });

  // console.log("[ROOT]renderer - render", subViews);

  if (error) {
    return (
      <div
        className={cn("fixed inset-0 z-10")}
        onClick={() => {
          history.reload();
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
          const routeName = subView.name;
          const PageContent = pages[routeName as Exclude<PageKeys, "root">];
          return (
            <StackRouteView
              key={index}
              className={cn(
                "z-10 fixed left-1/2 top-0 h-full mx-auto bg-w-bg-3 shadow-xl opacity-100 -translate-x-1/2",
                app.env.pc ? "w-[375px]" : "w-full"
              )}
              store={subView}
              index={10 + index}
            >
              <PageContent
                app={app}
                history={history}
                client={client}
                storage={app.$storage}
                pages={pages}
                view={subView}
              />
            </StackRouteView>
          );
        })}
        {/* <Show when={app.env.pc}>
          <div className={cn("z-0 fixed left-1/2 top-0 -translate-x-1/2", app.env.pc ? "w-[375px]" : "w-full")}>
            <div className="right-0 p-4" style={{ transform: `translateX(100%)` }}>
              <div className="rounded-md bg-w-bg-3">
                <div className="w-[60px] h-[60px]"></div>
              </div>
            </div>
          </div>
        </Show> */}
      </div>
      <Toast store={$toast} />

      <Dialog store={$upgrade}>
        <div>当前版本过旧，点击确定升级</div>
      </Dialog>
      {/* <HistoryPanel store={history} /> */}
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
