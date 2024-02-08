import { ViewComponent } from "@/store/types";
import React from "react";

export const NotFoundPage: ViewComponent = React.memo(() => {
  return (
    <div>
      <div className="text-3xl text-center">404</div>
    </div>
  );
});
