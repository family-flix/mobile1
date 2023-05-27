import { Car, File, Film, Home, PersonStanding, Users } from "lucide-react";

import { ViewComponent } from "@/types";
import { useState } from "react";
import { useInitialize } from "@/hooks";
import { View } from "@/components/ui/view";

export const HomePage: ViewComponent = (props) => {
  const { app, router, view } = props;

  const [subViews, setSubViews] = useState(view.subViews);

  useInitialize(() => {
    view.onSubViewsChange((nextSubViews) => {
      setSubViews(nextSubViews);
    });
  });

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 h-full">
        <div className="relative w-full h-full">
          {subViews.map((subView) => {
            const PageContent = subView.component as ViewComponent;
            return (
              <View key={subView.id} store={subView}>
                <div className="overflow-y-auto w-full h-full">
                  <div className="min-h-full">
                    <PageContent app={app} router={router} view={subView} />
                  </div>
                </div>
              </View>
            );
          })}
        </div>
      </div>
      <div className="h-[80px]">
        <div className="w-full h-[80px]"></div>
        <div className="fixed left-0 bottom-0 grid grid-cols-4 w-screen h-[80px] py-2">
          <div
            className="flex flex-col justify-center items-center"
            onClick={() => {
              router.replace("/home/a");
            }}
          >
            <div>
              <Home width={24} height={24} />
            </div>
            <div className="mt-2 text-center">首页</div>
          </div>
          <div
            className="flex flex-col justify-center items-center"
            onClick={() => {
              router.replace("/home/b");
            }}
          >
            <div>
              <Film width={24} height={24} />
            </div>
            <div className="mt-2 text-center">影片</div>
          </div>
          <div
            className="flex flex-col justify-center items-center"
            onClick={() => {
              router.replace("/home/c");
            }}
          >
            <div>
              <Car width={24} height={24} />
            </div>
            <div className="mt-2 text-center">购物车</div>
          </div>
          <div
            className="flex flex-col justify-center items-center"
            onClick={() => {
              // router.replace("/test1");
              router.push("/test1");
            }}
          >
            <div>
              <Users width={24} height={24} />
            </div>
            <div className="mt-2 text-center">我的</div>
          </div>
        </div>
      </div>
    </div>
  );
};
