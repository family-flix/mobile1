import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { useInitialize } from "@/hooks";
import { cn } from "@/utils";

export function BackToTop(props: { store: ScrollViewCore }) {
  const { store } = props;

  const ref = useRef(false);
  const [visible, setVisible] = useState(false);

  useInitialize(() => {
    // store.onScroll((instance) => {
    //   let needShow = false;
    //   if (instance.scrollTop >= app.screen.height) {
    //     needShow = true;
    //   }
    //   if (needShow === ref.current) {
    //     return;
    //   }
    //   setVisible(needShow);
    //   ref.current = needShow;
    // });
  });

  return (
    <div className={cn("z-index-200 fixed right-4 bottom-28", visible ? "block" : "hidden")}>
      <div
        className="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-w-bg-0 opacity-100"
        onClick={() => {
          store.scrollTo({ top: 0 });
        }}
      >
        <ArrowUp className="w-6 h-6" />
      </div>
    </div>
  );
}
