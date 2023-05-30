import { useEffect, useState } from "react";

import { useInitialize } from "@/hooks";
import { ViewComponent } from "@/types";

export const HomeMyPage: ViewComponent = (props) => {
  const { view, router } = props;
  // const [scrollTop, setScrollTop] = useState(page.client.scrollTop);
  // const [top, setTop] = useState(0);

  useInitialize(() => {
    view.onReady(() => {
      console.log("home/my ready");
    });
    view.onMounted(() => {
      console.log("home/my mounted");
    });
    view.onShow(() => {
      console.log("home/my show");
    });
    view.onHidden(() => {
      console.log("home/my hide");
    });
    view.onUnmounted(() => {
      console.log("home/my unmounted");
    });
  });

  return (
    <div>
      <div>
        <div
          onClick={() => {
            router.push("/test");
          }}
        >
          goto
        </div>
        <div className="h-[400px] bg-gray-100">我的个人中心</div>
        <div className="h-[400px] bg-gray-200"></div>
        <div className="h-[400px] bg-gray-300"></div>
      </div>
    </div>
  );
};
