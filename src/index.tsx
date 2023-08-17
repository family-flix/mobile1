/**
 * @file 项目根入口
 */
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { ThemeProvider, useTheme } from "./components/Theme";
import { connect } from "./domains/app/connect.web";
import { StackRouteView } from "./components/ui/stack-route-view";
import { Toast } from "./components/ui/toast";
import { ToastCore } from "./domains/ui/toast";
import { useInitialize } from "./hooks";
import {
  homeIndexPage,
  homeTVSearchPage,
  cView,
  homeMinePage,
  homeLayout,
  rootView,
  testView,
  tvPlayingPage,
  outerPlayerPage,
  homeMoviePage,
  moviePlayingPage,
  homeMovieSearchPage,
} from "./store/views";
import { app } from "./store/app";
import { cn } from "./utils";
import { ViewComponent } from "./types";

import "./index.css";

const { router } = app;
// @ts-ignore
window.__app__ = app;

homeLayout.register("/home/index", () => {
  return homeIndexPage;
});
homeLayout.register("/home/movie", () => {
  return homeMoviePage;
});
homeLayout.register("/home/history", () => {
  return cView;
});
homeLayout.register("/home/mine", () => {
  return homeMinePage;
});
rootView.register("/search_tv", () => {
  return homeTVSearchPage;
});
rootView.register("/search_movie", () => {
  return homeMovieSearchPage;
});
rootView.register("/movie/play/:id", () => {
  return moviePlayingPage;
});
rootView.register("/tv/play/:id", () => {
  return tvPlayingPage;
});
rootView.register("/out_players", () => {
  return outerPlayerPage;
});
rootView.register("/test", () => {
  return testView;
});
rootView.register("/", () => {
  return homeLayout;
});
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
      // console.log(...rootView.log("[]Application - subViews changed", nextSubViews));
      setSubViews(nextSubViews);
    });
    rootView.onMatched((subView) => {
      console.log("[Application]rootView.onMatched", rootView.curView?._name, subView._name, router._pending.type);
      if (subView === rootView.curView) {
        return;
      }
      const prevView = rootView.curView;
      rootView.prevView = prevView;
      rootView.curView = subView;
      if (!rootView.subViews.includes(subView)) {
        rootView.appendSubView(subView);
      }
      subView.show();
      if (prevView) {
        if (router._pending.type === "back") {
          prevView.hide();
          subView.uncovered();
          setTimeout(() => {
            rootView.removeSubView(prevView);
          }, 800);
          return;
        }
        prevView.layered();
      }
    });
    rootView.onNotFound(() => {
      console.log("[Application]rootView.onNotFound");
      rootView.curView = homeLayout;
      rootView.appendSubView(homeLayout);
    });
    router.onPathnameChange(({ pathname, search, type }) => {
      // router.log("[]Application - pathname change", pathname);
      rootView.checkMatch({ pathname, search, type });
    });
    // router.onRelaunch(() => {
    //   router.log("[]Application - router.onRelaunch");
    //   rootView.relaunch(mainLayout);
    // });
    app.onTip((msg) => {
      const { text } = msg;
      toast.show({
        texts: text,
      });
    });
    app.onError((err) => {
      setError(err);
    });
    app.onReady(() => {
      router.start();
    });
    console.log("[]Application - before start", window.history);
    const { innerWidth, innerHeight, location } = window;
    app.router.prepare(location);
    app.start({
      width: innerWidth,
      height: innerHeight,
    });
  });

  // console.log("[ROOT]renderer - render");
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
                "absolute inset-0 bg-white opacity-100 dark:bg-black",
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
