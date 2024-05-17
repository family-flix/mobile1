/**
 * @file 邀请码管理
 */
import React, { useState } from "react";
import { ArrowLeft, Copy, Plus } from "lucide-react";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { useInitialize, useInstance } from "@/hooks/index";
import { ListView, ScrollView } from "@/components/ui";
import { fetchInvitationCodeList, createInvitationCode, InvitationCodeItem } from "@/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { ScrollViewCore } from "@/domains/ui";
import { cn } from "@/utils/index";

function Page(props: ViewComponentProps) {
  const { app, history, client } = props;

  const $list = new ListCore(
    new RequestCore(fetchInvitationCodeList, {
      client,
    })
  );
  const $create = new RequestCore(createInvitationCode, {
    client,
  });
  const $scroll = new ScrollViewCore({
    os: app.env,
    async onPullToRefresh() {
      await $list.refresh();
      $scroll.finishPullToRefresh();
    },
    async onReachBottom() {
      await $list.loadMore();
      $scroll.finishLoadingMore();
    },
  });
  const state = {
    response: $list.response,
  };
  return {
    state,
    $list,
    ui: {
      $scroll,
    },
    // onStateChange(handler: (v: typeof state) => void) {},
  };
}

export const InvitationCodeListPage: ViewComponent = React.memo((props) => {
  const { app, history } = props;

  const $logic = useInstance(() => Page(props));

  const [state, setState] = useState($logic.$list.response);

  useInitialize(() => {
    $logic.$list.onStateChange((v) => {
      setState(v);
    });
    $logic.$list.init();
  });

  return (
    <div>
      <div className="flex items-center justify-between py-2 px-4 h-[56px]">
        <div className="flex items-center space-x-2">
          <div
            className="inline-block"
            onClick={() => {
              history.back();
            }}
          >
            <ArrowLeft className="w-6 h-6" />
          </div>
          <div className="text-md"></div>
        </div>
        <div className="flex items-center">
          {/* <div className="p-2 rounded-md bg-w-bg-2 cursor-pointer">
            <Plus className="w-6 h-6" />
          </div> */}
        </div>
      </div>
      <ScrollView store={$logic.ui.$scroll} className="overflow-y-auto fixed top-[56px] bottom-0 bg-w-bg-2">
        <ListView store={$logic.$list}>
          <div className="pt-8 px-4 space-y-2 divider-y-1">
            {state.dataSource.map((item) => {
              const { id, code, invitee } = item;
              return (
                <div className="flex items-center justify-between rounded-md">
                  <div>
                    <div
                      className={cn("text-xl", {
                        underline: invitee,
                        "line-through": invitee,
                      })}
                    >
                      {code}
                    </div>
                    {invitee ? <div className="mt-2">邀请了 {invitee.nickname}</div> : null}
                  </div>
                  <div
                    className="p-2 rounded-md bg-w-bg-2"
                    onClick={() => {
                      if (invitee) {
                        return;
                      }
                      app.copy(code);
                      app.tip({
                        text: ["复制成功"],
                      });
                    }}
                  >
                    <Copy
                      className={cn("w-6 h-6", {
                        "text-w-fg-2": invitee,
                      })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ListView>
      </ScrollView>
    </div>
  );
});
