/**
 * @file 项目根入口
 */
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { ThemeProvider } from "./components/Theme";
import { connect } from "./domains/app/connect.web";
import { StackRouteView } from "./components/ui/stack-route-view";
import { Toast } from "./components/ui/toast";
import { ToastCore } from "./domains/ui/toast";
import { useInitialize } from "./hooks";
import { aView, bView, cView, dView, mainLayout, rootView, testView, tvPlaying } from "./store/views";
import { app } from "./store/app";
import { cn } from "./utils";
import { ViewComponent } from "./types";

import "./index.css";

const { router } = app;

mainLayout.register("/home/index", () => {
  return aView;
});
mainLayout.register("/home/search", () => {
  return bView;
});
mainLayout.register("/home/history", () => {
  return cView;
});
mainLayout.register("/home/my", () => {
  return dView;
});
rootView.register("/play/:id", () => {
  return tvPlaying;
});
rootView.register("/test", () => {
  return testView;
});
rootView.register("/", () => {
  return mainLayout;
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
      console.log(...rootView.log("[]Application - subViews changed", nextSubViews));
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
      // setTimeout(() => {
      //   subView.checkMatch(router._pending);
      // }, 200);
      if (prevView) {
        if (router._pending.type === "back") {
          // const unlisten = prevView.onHidden(() => {
          //   if (prevView === tvPlaying) {
          //     rootView.removeSubView(prevView);
          //     unlisten();
          //   }
          // });
          prevView.hide();
          subView.uncovered();
          setTimeout(() => {
            rootView.removeSubView(prevView);
          }, 800);
          return;
        }
        prevView.layered();
        // prevView.layered();
        // prevView.state.layered = true;
        // setTimeout(() => {
        //   rootView.prevView = null;
        //   rootView.removeSubView(prevView);
        // }, 120);
      }
    });
    rootView.onNotFound(() => {
      console.log("[Application]rootView.onNotFound");
      rootView.curView = mainLayout;
      rootView.appendSubView(mainLayout);
    });
    router.onPathnameChange(({ pathname, type }) => {
      // router.log("[]Application - pathname change", pathname);
      rootView.checkMatch({ pathname, type });
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
    router.prepare(window.location);
    app.start();
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
