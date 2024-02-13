/**
 * @file 消息列表
 */
import React, { useState } from "react";
import { ArrowLeft, Check, CheckCheck, Diamond, MoreVertical, Smile, Trash } from "lucide-react";

// import { moviePlayingPage, moviePlayingPageV2, rootView, seasonPlayingPageV2, tvPlayingPage } from "@/store/views";
import { messageList } from "@/store/index";
import { readAllNotification, readNotification } from "@/services";
import { ScrollView, Skeleton, LazyImage, ListView } from "@/components/ui";
import { Show } from "@/components/ui/show";
import { DynamicContent } from "@/components/dynamic-content";
import { DynamicContentCore } from "@/domains/ui/dynamic-content";
import { StepSwitch } from "@/components/ui/step";
import { StepCore } from "@/domains/step";
import { ScrollViewCore, ButtonCore, ImageInListCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/store/types";
import { MediaTypes } from "@/constants";
import { RequestCoreV2 } from "@/domains/request/v2";

enum MessageStatus {
  Normal = 1,
  Read = 2,
}

export const HomeMessagePage: ViewComponent = React.memo((props) => {
  const { app, history, client, view } = props;

  const step = useInstance(
    () =>
      new DynamicContentCore({
        value: 1,
      })
  );
  const readRequest = useInstance(
    () =>
      new RequestCoreV2({
        fetch: readNotification,
        client,
      })
  );
  const readAllRequest = useInstance(
    () =>
      new RequestCoreV2({
        fetch: readAllNotification,
        client: client,
      })
  );
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        // async onPullToRefresh() {
        //   await messageList.refresh();
        //   scrollView.stopPullToRefresh();
        // },
        onReachBottom() {
          messageList.loadMore();
        },
        // onPullToBack() {
        //   app.back();
        // },
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
  const poster = useInstance(() => new ImageInListCore());

  const [response, setResponse] = useState(messageList.response);

  useInitialize(() => {
    if (messageList.response.dataSource.length === 0) {
      step.show(0);
    }
    messageList.onStateChange((nextResponse) => {
      setResponse(nextResponse);
    });
  });

  const { dataSource } = response;

  return (
    <>
      <ScrollView store={scrollView} className="">
        <div className="min-h-screen w-full">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center cursor-pointer">
              <div
                className="inline-block"
                onClick={() => {
                  history.back();
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </div>
              {/* <div className="text-md">我的消息</div> */}
            </div>
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
                step.show(0);
              }}
            >
              <DynamicContent
                store={step}
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
          <div className="px-2 ">
            <ListView store={messageList} className="divide-y divide-gray-300 dark:divide-gray-800">
              {dataSource.map((message) => {
                const { id: message_id, msg, status, created, media } = message;
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
                      if (media && media.type === MediaTypes.Season) {
                        // seasonPlayingPageV2.query = {
                        //   id: media.id,
                        // };
                        // app.showView(seasonPlayingPageV2);
                        history.push("root.season_playing", { id: media.id });
                        return;
                      }
                      if (media && media.type === MediaTypes.Movie) {
                        // moviePlayingPageV2.query = {
                        //   id: media.id,
                        // };
                        // app.showView(moviePlayingPageV2);
                        history.push("root.movie_playing", { id: media.id });
                      }
                    }}
                  >
                    <div className="break-all text-lg">{msg}</div>
                    <div className="">
                      {(() => {
                        if (media) {
                          const { id, name, poster_path, air_date } = media;
                          return (
                            <div className="flex mt-2">
                              <div className="relative w-[98px] h-[147px] mr-4">
                                <LazyImage
                                  className="w-full h-full rounded-lg object-cover"
                                  store={poster.bind(poster_path)}
                                  alt={name}
                                />
                              </div>
                              <div className="mt-2 flex-1 max-w-full overflow-hidden">
                                <div className="flex items-center">
                                  <h2 className="text-xl">{name}</h2>
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
                      <div className="absolute inset-0 bg-w-bg-0 opacity-50 pointer-events-none"></div>
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
