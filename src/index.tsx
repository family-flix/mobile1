/**
 * @file 项目根入口
 */
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { messageList, history, app } from "./store/index";
import { PageKeys, routesWithPathname } from "./store/routes";
import { pages } from "./store/views";
import { client } from "./store/request";
import { storage } from "./store/storage";
import { useInitialize, useInstance } from "./hooks/index";
import { ThemeProvider } from "./components/theme-switch";
import { StackRouteView } from "./components/ui/stack-route-view";
import { Toast, Dialog } from "./components/ui";
import { ToastCore } from "./domains/ui/toast";
import { connect as connectApplication } from "./domains/app/connect.web";
import { connect as connectHistory } from "./domains/history/connect.web";
import { NavigatorCore } from "./domains/navigator/index";
import { DialogCore } from "./domains/ui/index";
import { MediaOriginCountry } from "./constants/index";
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
history.$router.onPopState((r) => {
  const { type, pathname, href } = r;
  // console.log("[ROOT]index - app.onPopState", type, pathname, href);
  if (type === "back") {
    history.back();
    return;
  }
  if (type === "forward") {
    history.forward();
    return;
  }
});
history.$router.onPushState(({ from, to, path, pathname }) => {
  console.log("[ROOT]index - before history.pushState", from, to, path, pathname);
  window.history.pushState(
    {
      from,
      to,
    },
    "",
    path
  );
});
history.$router.onReplaceState(({ from, path, pathname }) => {
  console.log("[ROOT]index - before history.replaceState", from, path, pathname);
  window.history.replaceState(
    {
      from,
    },
    "",
    path
  );
});
connectApplication(app);
connectHistory(history);

const toast = new ToastCore();
const view = history.$view;

function ApplicationView() {
  const updateDialog = useInstance(
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
    // app.onStateChange((nextState) => {
    //   setState(nextState);
    // });
    view.onSubViewsChange((nextSubViews) => {
      // console.log("[ROOT]rootView.onSubViewsChange", nextSubViews.length);
      setSubViews(nextSubViews);
    });
    history.onRouteChange(({ ignore, reason, view, href }) => {
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
      toast.show({
        texts: text,
      });
    });
    app.onUpdate(() => {
      updateDialog.show();
    });
    app.onReady(() => {
      // setReady(true);
      const { pathname, query } = history.$router;
      const route = routesWithPathname[pathname];
      console.log("[ROOT]onMount", pathname, route, app.$user.isLogin);
      if (!route) {
        history.push("root.notfound");
        return;
      }
      if (!app.$user.isLogin) {
        if (route.options?.require?.includes("login")) {
          history.push("root.login", { redirect: route.pathname });
          return;
        }
      }
      client.appendHeaders({
        Authorization: app.$user.token,
      });
      messageList.init();
      if (!history.isLayout(route.name)) {
        history.push(route.name, query, { ignore: true });
        return;
      }
      history.push(
        "root.home_layout.home_index.home_index_season",
        {
          language: MediaOriginCountry.CN,
        },
        { ignore: true }
      );
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
    history.$router.prepare(location);
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
              className={cn("fixed inset-0 bg-w-bg-3 opacity-100")}
              store={subView}
              index={index}
            >
              <PageContent app={app} history={history} client={client} storage={storage} pages={pages} view={subView} />
            </StackRouteView>
          );
        })}
      </div>
      <Toast store={toast} />
      <Dialog store={updateDialog}>
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
