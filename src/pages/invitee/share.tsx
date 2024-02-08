import { ArrowLeft, Plus, Search } from "lucide-react";

import { ViewComponent } from "@/store/types";
import { Input, ScrollView } from "@/components/ui";
import { InputCore, ScrollViewCore } from "@/domains/ui";
import { useInstance } from "@/hooks";
import React from "react";

export const MediaSharePage: ViewComponent = React.memo((props) => {
  const { app, history } = props;

  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onPullToBack() {
          history.back();
        },
      })
  );
  const searchInput = useInstance(() => new InputCore());

  return (
    <>
      <ScrollView store={scrollView}>
        <div className="min-h-screen">
          <div className="">
            <div className="flex items-center justify-between py-2 px-4">
              <div className="flex items-center space-x-2">
                <div
                  className="inline-block"
                  onClick={() => {
                    history.back();
                  }}
                >
                  <ArrowLeft className="w-6 h-6" />
                </div>
                <div className="text-2xl">分享</div>
              </div>
              <div>
                <div
                  className="p-2 rounded-md bg-w-bg-2"
                  onClick={() => {
                    //     inviteDialog.show();
                  }}
                >
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between w-full p-4 pt-0 pb-0 space-x-4">
              <div className="relative w-full">
                <Input store={searchInput} prefix={<Search className="w-5 h-5" />} />
              </div>
            </div>
          </div>
        </div>
      </ScrollView>
    </>
  );
});
