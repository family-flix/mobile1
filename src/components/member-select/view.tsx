/**
 * @file 成员选择
 */
import { useState } from "react";

import { ButtonCore, ScrollViewCore } from "@/domains/ui";
import { Button, Input, ListView, ScrollView, Skeleton } from "@/components/ui";
import { cn } from "@/utils";

import { InviteeSelectCore } from "./store";
import { useInitialize, useInstance } from "@/hooks";

export const InviteeSelect = (props: { store: InviteeSelectCore }) => {
  const { store } = props;

  const [listResponse, setListResponse] = useState(store.response);
  const [cur, setCur] = useState(store.value);

  const scrollView = useInstance(() => {
    return new ScrollViewCore({
      onReachBottom() {
        store.$list.loadMore();
      },
    });
  });
  // const submitBtn = useInstance(
  //   () =>
  //     new ButtonCore({
  //       onClick() {
  //         store.okBtn.click();
  //       },
  //     })
  // );
  useInitialize(() => {
    store.onResponseChange((nextState) => {
      setListResponse(nextState);
    });
    store.onCurSeasonChange((nextState) => {
      //     console.log("[COMPONENT]TVSeasonSelect - store.onCurSeasonChange", nextState);
      setCur(nextState);
    });

    store.$list.init();
  });

  return (
    <div>
      {/* <div className="flex items-center space-x-2 mt-4">
        <Input store={store.nameInput} />
        <Button store={store.searchBtn} variant="subtle">
          搜索
        </Button>
      </div> */}
      <ScrollView className="mt-2" store={scrollView}>
        <div className="flex flex-col max-h-full pt-[36px]">
          <ListView
            wrapClassName="flex-1 overflow-y-auto"
            className="max-h-full flex flex-col h-full"
            store={store.$list}
            // skeleton={
            //   <div>
            //     <div className="rounded-md border border-slate-300 bg-white shadow-sm">
            //       <div className="flex">
            //         <div className="overflow-hidden mr-2 rounded-sm">
            //           <Skeleton className="w-[120px] h-[180px]" />
            //         </div>
            //         <div className="flex-1 p-4">
            //           <Skeleton className="h-[36px] w-[180px]"></Skeleton>
            //           <div className="mt-2 space-y-1">
            //             <Skeleton className="h-[24px] w-[120px]"></Skeleton>
            //             <Skeleton className="h-[24px] w-[240px]"></Skeleton>
            //           </div>
            //         </div>
            //       </div>
            //     </div>
            //   </div>
            // }
          >
            <div className="space-y-4 flex-1 overflow-y-auto">
              {listResponse.dataSource.map((season) => {
                const { id, remark } = season;
                return (
                  <div
                    key={id}
                    className={cn("p-4", cur?.id === id ? "bg-w-bg-active" : "")}
                    onClick={() => {
                      store.select(season);
                    }}
                  >
                    <div className="flex">
                      <div className="overflow-hidden mr-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-300 rounded-full">
                          <div className="text-xl text-slate-500">{remark.slice(0, 1).toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="flex-1 w-0">
                        <div className="flex items-center">
                          <h2 className="">{remark}</h2>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ListView>
          <div className="h-[56px]">
            <div className="p-2 bg-w-bg-0">
              <Button store={store.submitBtn}>确定</Button>
            </div>
          </div>
        </div>
      </ScrollView>
    </div>
  );
};
