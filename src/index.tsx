import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { cn, sleep } from "@/utils";
import { app } from "@/store/app";
import { useInitialize } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/Theme";
import { View } from "./components/ui/view";
// import { KeepAliveView } from "./components/ui/keep-alive-route-view";
import { HomePage as HomeLayout } from "@/pages/home";
import { TVPlayingPage } from "@/pages/play";
// import { PlayHistoryPage } from "@/pages/history";
import { Test1Page } from "./pages/test1";
import { RouteViewCore } from "./domains/route_view";
import { bind } from "./domains/app/bind.web";
import { HomePage } from "./pages/home/a";
import { PlayHistoryPage } from "./pages/home/history";
import { TVSearchPage } from "./pages/home/search";
import { ViewComponent } from "./types";
import { RouteView } from "./components/ui/route-view";
import { KeepAliveRouteView } from "./components/ui/keep-alive-route-view";

import "./index.css";

const { router } = app;

const rootView = new RouteViewCore({
  title: "ROOT",
  component: "div",
  // keepAlive: true,
});
const mainLayout = new RouteViewCore({
  title: "首页",
  component: HomeLayout,
});
const aView = new RouteViewCore({
  title: "首页",
  component: HomePage,
});
const bView = new RouteViewCore({
  title: "搜索",
  component: TVSearchPage,
});
const cView = new RouteViewCore({
  title: "播放历史",
  component: PlayHistoryPage,
});
const authLayoutView = new RouteViewCore({
  title: "EmptyLayout",
  component: Test1Page,
});
// const loginView = new ViewCore({
//   title: "登录",
//   component: ,
// });
mainLayout.register("/home/index", () => {
  return aView;
});
mainLayout.register("/home/search", () => {
  return bView;
});
mainLayout.register("/home/history", () => {
  return cView;
});
const tvPlaying = new RouteViewCore({
  title: "加载中...",
  component: TVPlayingPage,
});
rootView.register("/play/:id", () => {
  return tvPlaying;
});
rootView.register("/", () => {
  return mainLayout;
});
router.onPathnameChange(({ pathname, type }) => {
  // router.log("[]Application - pathname change", pathname);
  rootView.checkMatch({ pathname, type });
});
app.onPopState((options) => {
  const { type, pathname } = options;
  router.handlePopState({ type, pathname });
});

bind(app);

function ApplicationView() {
  // const [showMask, setShowMask] = useState(true);
  // const [ready, setReady] = useState(false);
  // const [stacks, setStacks] = useState<Router["stacks"]>([]);
  // const [error, setError] = useState<Error | null>(null);
  const [subViews, setSubViews] = useState(rootView.subViews);

  useInitialize(() => {
    rootView.onSubViewsChange((nextSubViews) => {
      console.log(...rootView.log("[]Application - subViews changed", nextSubViews));
      setSubViews(nextSubViews);
    });
    app.onTip(async (msg) => {
      const { text } = msg;
      // toast.show({
      //   texts: text,
      // });
    });
    // app.onError((msg) => {
    //   alert(msg.message);
    // });
    // console.log("[]Application - before start", window.history);
    router.start(window.location);
    app.start();
  });

  // console.log("[ROOT]renderer - render");
  // if (error) {
  //   return (
  //     <div
  //       className={cn("fixed inset-0 z-10")}
  //       onClick={() => {
  //         app.router.reload();
  //       }}
  //     >
  //       <div className="w-screen h-screen flex items-center justify-center">
  //         <div>
  //           <div className="text-3xl text-center">{error.message}</div>
  //           <div className="mt-4 text-center">
  //             请根据上述提示进行操作，或者点击刷新
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

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
      <div className="screen w-screen h-screen">
        {subViews.map((subView, index) => {
          const RenderedComponent = subView.component as ViewComponent;
          return (
            <KeepAliveRouteView key={subView.id} store={subView} index={index}>
              <RenderedComponent app={app} router={router} view={subView} />
            </KeepAliveRouteView>
          );
        })}
      </div>
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
