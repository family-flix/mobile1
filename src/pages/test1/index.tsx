import { useEffect, useState } from "react";

import { useInitialize } from "@/hooks";
import { ViewComponent } from "@/types";

export const Test1Page: ViewComponent = (props) => {
  const { view } = props;

  useInitialize(() => {
    view.onReady(() => {
      console.log("test1 ready");
    });
    view.onMounted(() => {
      console.log("test1 mounted");
    });
    view.onShow(() => {
      console.log("test1 show");
    });
    view.onHidden(() => {
      console.log("test1 hide");
    });
    view.onUnmounted(() => {
      console.log("test1 unmounted");
    });
  });

  return (
    <div>
      <div>
        <div className="h-[400px] bg-gray-100">Test01 Page</div>
        <div className="h-[400px] bg-gray-200"></div>
        <div className="h-[400px] bg-gray-300"></div>
      </div>
    </div>
  );
};
