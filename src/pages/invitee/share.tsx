import { ArrowLeft, Plus, Search } from "lucide-react";

import { Input, ScrollView } from "@/components/ui";
import { InputCore, ScrollViewCore } from "@/domains/ui";
import { ViewComponent } from "@/types";
import { useInstance } from "@/hooks";

export const MediaSharePage: ViewComponent = (props) => {
  const { app } = props;

  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onPullToBack() {
          app.back();
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
                    app.back();
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
                <Input store={searchInput} prefix={<Search className="w-4 h-4" />} />
              </div>
            </div>
          </div>
        </div>
      </ScrollView>
    </>
  );
};