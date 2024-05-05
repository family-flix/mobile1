import { Button } from "@/components/ui";
import { ButtonCore } from "@/domains/ui";
import { useInstance } from "@/hooks";
import { ViewComponent } from "@/store/types";
import { Bird } from "lucide-react";
import React from "react";

export const NotFoundPage: ViewComponent = React.memo((props) => {
  const { app, history } = props;

  const $btn = useInstance(
    () =>
      new ButtonCore({
        onClick() {
          console.log("back home");
        },
      })
  );

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="">
        <Bird className="w-36 h-36" />
        <div className="mt-4 text-6xl text-center">404</div>
        <div className="mt-4 text-center">路由不存在</div>
        <Button className="mt-2" store={$btn}>返回首页</Button>
      </div>
    </div>
  );
});
