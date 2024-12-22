/**
 * @file 消息列表
 */
import React, { useState } from "react";
import { ArrowLeft, Check, CheckCheck, Diamond, MoreVertical, Smile, Trash } from "lucide-react";

import { messageList } from "@/store/index";
import { ViewComponent, ViewComponentProps } from "@/store/types";
import { readAllNotification, readNotification } from "@/services/index";
import { Show } from "@/packages/ui/show";
import { useInitialize, useInstance } from "@/hooks/index";
import { ScrollView, LazyImage, ListView } from "@/components/ui";
import { RequestCore } from "@/domains/request";
import { DynamicContent } from "@/components/dynamic-content";
import { ItemTypeFromListCore } from "@/domains/list/typing";
import { DynamicContentCore } from "@/domains/ui/dynamic-content";
import { ScrollViewCore, ImageInListCore } from "@/domains/ui";
import { MediaTypes } from "@/constants/index";

enum MessageStatus {
  Normal = 1,
  Read = 2,
}

function Page(props: ViewComponentProps) {
  const { app, client, history } = props;

  const $read = new RequestCore(readNotification, {
    client,
  });
  const $readAll = new RequestCore(readAllNotification, {
    client,
  });
  const $step = new DynamicContentCore({
    value: 1,
  });
  const $scroll = new ScrollViewCore({
    os: app.env,
    async onPullToRefresh() {
      await messageList.refresh();
      $scroll.finishPullToRefresh();
    },
    async onReachBottom() {
      await messageList.loadMore();
      $scroll.finishLoadingMore();
    },
  });
  const $poster = new ImageInListCore();
  return {
    $read,
    $readAll,
    ui: {
      $scroll,
      $step,
      $poster,
    },
    readMsg(msg: ItemTypeFromListCore<typeof messageList>) {
      const { id, media } = msg;
      $read.run({
        id,
      });
      messageList.modifyResponse((response) => {
        return {
          ...response,
          dataSource: response.dataSource.map((notification) => {
            if (notification.id === id) {
              return {
                ...notification,
                status: MessageStatus.Read,
              };
            }
            return notification;
          }),
        };
      });
      if (media && media.type === MediaTypes.Season) {
        history.push("root.season_playing", { id: media.id });
        return;
      }
      if (media && media.type === MediaTypes.Movie) {
        history.push("root.movie_playing", { id: media.id });
        return;
      }
      app.tip({
        text: ["未知的 media type"],
      });
    },
    readAllMsg() {
      messageList.modifyResponse((response) => {
        return {
          ...response,
          dataSource: response.dataSource.map((notification) => {
            return {
              ...notification,
              status: 2,
            };
          }),
          total: 0,
        };
      });
      $readAll.run();
      $step.show(0);
    },
  };
}

export const HomeMessagePage: ViewComponent = React.memo((props) => {
  const { app, history, client, view } = props;

  const $page = useInstance(() => Page(props));

  const [response, setResponse] = useState(messageList.response);
  const [height, setHeight] = useState(56);

  useInitialize(() => {
    messageList.onStateChange((v) => setResponse(v));
    if (messageList.response.dataSource.length === 0) {
      $page.ui.$step.show(0);
    }
  });

  return (
    <>
      <div className="z-50 w-full bg-w-bg-0">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => {
              history.back();
            }}
          >
            <div className="inline-block p-4">
              <ArrowLeft className="w-6 h-6" />
            </div>
            {/* <div className="text-md">我的消息</div> */}
          </div>
          <div
            className="flex items-center"
            onClick={() => {
              $page.readAllMsg();
            }}
          >
            <DynamicContent
              store={$page.ui.$step}
              options={[
                {
                  value: 0,
                  content: null,
                },
                {
                  value: 1,
                  content: <Trash className="w-6 h-6" />,
                },
              ]}
            />
          </div>
        </div>
      </div>
      <ScrollView store={$page.ui.$scroll} className="absolute bottom-0 left-0 w-full" style={{ top: height }}>
        <div className="min-h-screen w-full px-4">
          <div className="overflow-hidden rounded-xl">
            <ListView store={messageList} className="divide-y divide-w-bg-0 dark:divide-gray-800">
              {response.dataSource.map((message) => {
                const { id: message_id, msg, status, created, media } = message;
                return (
                  <div
                    key={message_id}
                    className="relative py-6"
                    onClick={() => {
                      $page.readMsg(message);
                    }}
                  >
                    <div className="break-all">{msg}</div>
                    <div className="">
                      {(() => {
                        if (media) {
                          const { name, poster_path } = media;
                          return (
                            <div className="flex mt-2">
                              <div className="relative w-[49px] h-[74px] mr-2">
                                <LazyImage
                                  className="w-full h-full rounded-lg object-cover"
                                  store={$page.ui.$poster.bind(poster_path)}
                                  alt={name}
                                />
                              </div>
                              <div className="flex-1 max-w-full overflow-hidden">
                                <div className="flex items-center">
                                  <h2 className="text-lg">{name}</h2>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="mt-2 text-sm">{created}</div>
                      <div className="flex items-center">
                        <div className="p-2">
                          <Show when={status === MessageStatus.Read} fallback={<Diamond className="w-4 h-4" />}>
                            <Check className="w-4 h-4" />
                          </Show>
                        </div>
                        <div className="text-sm">{status === MessageStatus.Read ? "已读" : "标记已读"}</div>
                      </div>
                    </div>
                    <Show when={status === MessageStatus.Read}>
                      <div className="absolute inset-0 opacity-50 pointer-events-none"></div>
                    </Show>
                  </div>
                );
              })}
            </ListView>
          </div>
        </div>
      </ScrollView>
    </>
  );
});
