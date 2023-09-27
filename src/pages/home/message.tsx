/**
 * @file 消息列表
 */
import React, { useState } from "react";
import { Check, CheckCheck, Diamond, MoreVertical, Smile } from "lucide-react";

import { fetchNotifications, readAllNotification, readNotification } from "@/services";
import { ScrollView, Skeleton, LazyImage, ListView, BackToTop, Dialog, Node, Button } from "@/components/ui";
import { ScrollViewCore, DialogCore, NodeInListCore, ButtonCore } from "@/domains/ui";
import { PlayHistoryItem, delete_history, fetchPlayingHistories } from "@/domains/tv/services";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { messageList, moviePlayingPage, rootView, tvPlayingPage } from "@/store";
import { ViewComponent } from "@/types";
import { Show } from "@/components/ui/show";
import { StepSwitch } from "@/components/ui/step";
import { StepCore } from "@/domains/step";

enum MessageStatus {
  Normal = 1,
  Read = 2,
}

export const HomeMessagePage: ViewComponent = (props) => {
  const { app, router, view } = props;

  const step = useInstance(
    () =>
      new StepCore({
        values: [0, 1, 2],
      })
  );
  const readRequest = useInstance(() => new RequestCore(readNotification));
  const readAllRequest = useInstance(() => new RequestCore(readAllNotification));
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        async onPullToRefresh() {
          await messageList.refresh();
          scrollView.stopPullToRefresh();
        },
        onReachBottom() {
          messageList.loadMore();
        },
      })
  );
  const readAllBtn = new ButtonCore({
    onClick() {
      messageList.modifyResponse((response) => {
        return {
          ...response,
          dataSource: response.dataSource.map((notification) => {
            return {
              ...notification,
              status: MessageStatus.Read,
            };
          }),
          total: 0,
        };
      });
      readAllRequest.run();
    },
  });

  const [response, setResponse] = useState(messageList.response);

  useInitialize(() => {
    if (messageList.response.dataSource.length === 0) {
      step.select(0);
    }
    // console.log("[PAGE]history - useInitialize");
    messageList.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
  });

  const { dataSource } = response;

  return (
    <>
      <ScrollView store={scrollView} className="dark:text-black-200">
        <div className="h-full w-full">
          <div className="flex justify-between mt-2 p-2">
            <div></div>
            <div
              className="flex items-center"
              onClick={() => {
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
                readAllRequest.run();
                step.next();
              }}
            >
              <StepSwitch
                store={step}
                options={{
                  0: null,
                  1: <Diamond className="w-4 h-4" />,
                  2: <CheckCheck className="w-4 h-4" />,
                }}
              />
              <StepSwitch
                store={step}
                options={{
                  0: null,
                  1: <div className="ml-2">全部标记已读</div>,
                  2: <div className="ml-2">全部已读</div>,
                }}
              />
            </div>
          </div>
          <div className="px-2 ">
            <ListView store={messageList} className="divide-y divide-gray-300 dark:divide-gray-800">
              {dataSource.map((message) => {
                const { id: message_id, msg, status, created, movie, season } = message;
                return (
                  <div
                    key={message_id}
                    className="relative py-6 px-2"
                    onClick={() => {
                      readRequest.run({
                        id: message_id,
                      });
                      messageList.modifyResponse((response) => {
                        return {
                          ...response,
                          dataSource: response.dataSource.map((notification) => {
                            if (notification.id === message_id) {
                              return {
                                ...notification,
                                status: MessageStatus.Read,
                              };
                            }
                            return notification;
                          }),
                          // total: response.total - 1,
                        };
                      });
                      if (season) {
                        const { id, tv_id } = season;
                        tvPlayingPage.params = {
                          id: tv_id,
                          season_id: id,
                        };
                        rootView.layerSubView(tvPlayingPage);
                      }
                      if (movie) {
                        const { id } = movie;
                        moviePlayingPage.params = {
                          id,
                        };
                        rootView.layerSubView(moviePlayingPage);
                      }
                    }}
                  >
                    <div className="text-lg">{msg}</div>
                    <div className="">
                      {(() => {
                        if (movie) {
                          const { id, name, poster_path } = movie;
                          return (
                            <div className="flex mt-2">
                              <div className="relative w-[98px] mr-4">
                                <LazyImage
                                  className="w-full h-full rounded-lg object-cover"
                                  src={poster_path}
                                  alt={name}
                                />
                              </div>
                              <div className="mt-2 flex-1 max-w-full overflow-hidden">
                                <div className="flex items-center">
                                  <h2 className="text-xl dark:text-white">{name}</h2>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        if (season) {
                          const { id, tv_id, name, poster_path } = season;
                          return (
                            <div className="flex mt-2">
                              <div className="relative w-[98px] mr-4">
                                <LazyImage
                                  className="w-full h-full rounded-lg object-cover"
                                  src={poster_path}
                                  alt={name}
                                />
                              </div>
                              <div className="mt-2 flex-1 max-w-full overflow-hidden">
                                <div className="flex items-center">
                                  <h2 className="text-xl dark:text-white">{name}</h2>
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
                      <div
                        className="flex items-center"
                        onClick={(event) => {
                          event.stopPropagation();
                          readRequest.run({
                            id: message_id,
                          });
                          messageList.modifyResponse((response) => {
                            return {
                              ...response,
                              dataSource: response.dataSource.map((notification) => {
                                if (notification.id === message_id) {
                                  return {
                                    ...notification,
                                    status: MessageStatus.Read,
                                  };
                                }
                                return notification;
                              }),
                              // total: response.total - 1,
                            };
                          });
                        }}
                      >
                        <div className="p-2">
                          <Show when={status === MessageStatus.Read} fallback={<Diamond className="w-4 h-4" />}>
                            <Check className="w-4 h-4" />
                          </Show>
                        </div>
                        <div className="text-sm">{status === MessageStatus.Read ? "已读" : "标记已读"}</div>
                      </div>
                    </div>
                    <Show when={status === MessageStatus.Read}>
                      <div className="absolute inset-0 bg-white opacity-50 pointer-events-none dark:bg-black"></div>
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
};
