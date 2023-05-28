import { useInitialize } from "@/hooks";
import { ViewComponent } from "@/types";
import { useEffect, useState } from "react";

export const Test1Page: ViewComponent = (props) => {
  const { view } = props;
  // const [scrollTop, setScrollTop] = useState(page.client.scrollTop);
  // const [top, setTop] = useState(0);

  useInitialize(() => {
    // page.addListener((nextValues) => {
    //   setScrollTop(nextValues.scrollTop);
    //   setTop(nextValues.yDistance);
    // });
  });
  useEffect(() => {}, []);

  return (
    <div>
      {/* <a className="fixed top-10 left-10 w-30 bg-yellow-300" href="/test2">
        <div>{scrollTop}</div>
        <div>width: {page.client.width}</div>
        <div>height: {page.client.height}</div>
      </a> */}
      <div>
        <div className="h-[400px] bg-gray-100">这是文案 </div>
        <div className="h-[400px] bg-gray-200"></div>
        <div className="h-[400px] bg-gray-300"></div>
      </div>
    </div>
  );
};
