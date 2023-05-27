import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { cn, sleep } from "@/utils";
import { app } from "@/store/app";
import { useInitialize } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/Page";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/Theme";
import { View } from "./components/ui/view";
import { KeepAliveView } from "./components/ui/keep-alive-route-view";
import { HomePage as HomeLayout } from "@/pages/home";
import { TVPlayingPage } from "@/pages/play";
import { TVSearchResultPage } from "@/pages/search";
import { PlayHistoryPage } from "@/pages/history";
import { Test1Page } from "./pages/test1";
import { Test2Page } from "./pages/test2";
import { Test3Page } from "./pages/test3";
import { ViewCore } from "./domains/route_view";
import { bind } from "./domains/app/bind.web";
import { HomePage } from "./pages/home/a";
import { HomeBPage } from "./pages/home/b";
import { HomeCPage } from "./pages/home/c";
import { ViewComponent } from "./types";

import "./index.css";

// app.router.route("/", () => {
//   return {
//     title: "影视剧列表",
//     component: HomePage,
//   };
// });
// app.router.route("/test2", () => {
//   return {
//     title: "测试页2",
//     component: Test2Page,
//   };
// });
// app.router.route("/test3", () => {
//   return {
//     title: "测试页3",
//     component: Test3Page,
//   };
// });
// app.router.route("/play/:id", () => {
//   return {
//     title: "加载中...",
//     component: TVPlayingPage,
//   };
// });
// app.router.route("/search", () => {
//   return {
//     title: "搜索",
//     component: TVSearchResultPage,
//   };
// });
// app.router.route("/history", () => {
//   return {
//     title: "我的播放历史",
//     component: PlayHistoryPage,
//   };
// });

const { router } = app;

const rootView = new ViewCore({
  title: "ROOT",
  component: "div",
  keepAlive: true,
});
const mainLayout = new ViewCore({
  title: "首页",
  component: HomeLayout,
});
const aView = new ViewCore({
  title: "首页 A",
  component: HomePage,
});
const bView = new ViewCore({
  title: "首页 B",
  component: HomeBPage,
});
const cView = new ViewCore({
  title: "首页 C",
  component: HomeCPage,
});
const authLayoutView = new ViewCore({
  title: "EmptyLayout",
  component: Test1Page,
});
// const loginView = new ViewCore({
//   title: "登录",
//   component: ,
// });
mainLayout.register("/home/a", () => {
  return aView;
});
mainLayout.register("/home/b", () => {
  return bView;
});
mainLayout.register("/home/c", () => {
  return cView;
});
rootView.register("/test1", () => {
  return authLayoutView;
});
// const testView = new ViewCore({
//   title: "测试",
//   component: TestPage,
// });
// rootView.register("/test", () => {
//   return testView;
// });
rootView.register("/", () => {
  return mainLayout;
});
router.onPathnameChanged(({ pathname, isBack, prevPathname }) => {
  rootView.checkMatch({ pathname, type: "push", isBack, prevPathname });
});
app.onPopState((options) => {
  const { type, pathname } = options;
  router.handlePathnameChanged({ type, pathname });
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
      console.log(
        ...rootView.log("[]Application - subViews changed", nextSubViews)
      );
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
      <div className="screen w-screen h-screen bg-slate-200">
        {subViews.map((subView, index) => {
          const RenderedComponent = subView.component as ViewComponent;
          return (
            <KeepAliveView
              key={subView.id}
              parent={rootView}
              store={subView}
              index={index}
            >
              <RenderedComponent app={app} router={router} view={subView} />
            </KeepAliveView>
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
