import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import { cn, sleep } from "@/utils";
import { Router } from "@/domains/router";
import { app } from "@/store/app";
import { useInitialize } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/Page";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/Theme";
import { HomePage } from "@/pages/home";
import { TVPlayingPage } from "@/pages/play";
import { TVSearchResultPage } from "@/pages/search";
import { PlayHistoryPage } from "@/pages/history";
import { Test1Page } from "./pages/test1";
import { Test2Page } from "./pages/test2";
import { Test3Page } from "./pages/test3";

import "./index.css";

app.router.route("/", () => {
  return {
    title: "影视剧列表",
    component: HomePage,
  };
});
// router.route("/", () => {
//   return {
//     title: "测试页1",
//     component: Test1Page,
//   };
// });
app.router.route("/test2", () => {
  return {
    title: "测试页2",
    component: Test2Page,
  };
});
app.router.route("/test3", () => {
  return {
    title: "测试页3",
    component: Test3Page,
  };
});
app.router.route("/play/:id", () => {
  return {
    title: "加载中...",
    component: TVPlayingPage,
  };
});
app.router.route("/search", () => {
  return {
    title: "搜索",
    component: TVSearchResultPage,
  };
});
app.router.route("/history", () => {
  return {
    title: "我的播放历史",
    component: PlayHistoryPage,
  };
});

function ApplicationView() {
  const [showMask, setShowMask] = useState(true);
  const [ready, setReady] = useState(false);
  const [stacks, setStacks] = useState<Router["stacks"]>([]);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useInitialize(() => {
    app.onReady(async () => {
      // await sleep(1000);
      // setReady(true);
      // await sleep(200);
      // setShowMask(false);
    });
    app.onError((error) => {
      console.log("app happen error");
      setError(error);
    });
    app.onWarning((error) => {
      toast({
        title: "Warning",
        description: error.message,
      });
    });
    app.router.onStacksChange = (nextPages) => {
      setStacks(nextPages);
    };
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
            <div className="mt-4 text-center">
              请根据上述提示进行操作，或者点击刷新
            </div>
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
      <div className="pages relative z-0">
        {stacks.map((stack, index) => {
          const { uid, title, component, query, params, page } = stack;
          const style: React.CSSProperties = {
            zIndex: uid,
          };
          return (
            <PageContainer key={uid} style={style} page={page} index={index}>
              {React.createElement(component, {
                title,
                router: {
                  ...app.router,
                  query,
                  params,
                },
                page,
                user: app.user,
              })}
            </PageContainer>
          );
        })}
      </div>
      <Toaster />
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
