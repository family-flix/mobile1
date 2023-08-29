/**
 * @file 视频播放页面
 */
import { useState } from "react";
import {
  ArrowLeft,
  Gauge,
  Glasses,
  List,
  Loader,
  MoreHorizontal,
  Pause,
  Play,
  RotateCw,
  Send,
  Subtitles,
} from "lucide-react";

import { Video, Sheet, ScrollView, Dialog } from "@/components/ui";
import { Presence } from "@/components/ui/presence";
import { ScrollViewCore, DialogCore, PresenceCore } from "@/domains/ui";
import { PlayerCore } from "@/domains/player";
import { MovieCore } from "@/domains/movie";
import { SelectionCore } from "@/domains/cur";
import { RequestCore } from "@/domains/request";
import { reportSomething } from "@/services";
import { MovieReportList, ReportTypes } from "@/constants";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { rootView } from "@/store";
import { cn } from "@/utils";

export const MoviePlayingPage: ViewComponent = (props) => {
  const { app, view } = props;

  const movie = useInstance(() => new MovieCore());
  const player = useInstance(() => new PlayerCore({ app }));
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onPullToBack() {
          rootView.uncoverPrevView();
        },
      })
  );
  const sourceSheet = useInstance(() => new DialogCore());
  const rateSheet = useInstance(() => new DialogCore());
  const resolutionSheet = useInstance(() => new DialogCore());
  const infoSheet = useInstance(() => new DialogCore());
  const curReport = useInstance(
    () =>
      new SelectionCore<string>({
        onChange(v) {
          setCurReportValue(v);
        },
      })
  );
  const reportRequest = useInstance(
    () =>
      new RequestCore(reportSomething, {
        onLoading(loading) {
          reportConfirmDialog.okBtn.setLoading(loading);
        },
        onSuccess() {
          app.tip({
            text: ["提交成功"],
          });
          reportConfirmDialog.hide();
          reportSheet.hide();
        },
        onFailed(error) {
          app.tip({
            text: ["提交失败", error.message],
          });
        },
      })
  );
  const reportSheet = useInstance(() => new DialogCore());
  const errorTipDialog = useInstance(() => {
    const dialog = new DialogCore({
      title: "视频加载错误",
      cancel: false,
      onOk() {
        dialog.hide();
      },
    });
    dialog.okBtn.setText("我知道了");
    return dialog;
  });
  const reportConfirmDialog = useInstance(
    () =>
      new DialogCore({
        title: "发现问题",
        onOk() {
          if (!curReport.value) {
            app.tip({
              text: ["请先选择问题"],
            });
            return;
          }
          reportRequest.run({
            type: ReportTypes.Movie,
            data: JSON.stringify({
              content: curReport.value,
              movie_id: movie.profile?.id,
            }),
          });
        },
      })
  );
  const subtitleSheet = useInstance(() => new DialogCore({}));
  const topOperation = useInstance(() => new PresenceCore({ open: true, mounted: true }));
  const bottomOperation = useInstance(() => new PresenceCore({}));

  const [profile, setProfile] = useState(movie.profile);
  const [curSource, setCurSource] = useState(movie.curSource);
  const [subtileState, setCurSubtitleState] = useState(movie.subtitle);
  const [curReportValue, setCurReportValue] = useState(curReport.value);
  const [rate, setRate] = useState(player.state.rate);

  useInitialize(() => {
    // console.log("[PAGE]play - useInitialize");

    app.onHidden(() => {
      player.pause();
    });
    app.onShow(() => {
      console.log("[PAGE]play - app.onShow", player.currentTime);
      // 锁屏后 currentTime 不是锁屏前的
      player.setCurrentTime(player.currentTime);
    });
    view.onHidden(() => {
      player.pause();
    });
    movie.onProfileLoaded((profile) => {
      app.setTitle(movie.getTitle().join(" - "));
      movie.play();
      player.setCurrentTime(profile.currentTime);
      bottomOperation.show();
    });
    movie.onStateChange((nextProfile) => {
      setProfile(nextProfile);
    });
    movie.onTip((msg) => {
      app.tip(msg);
    });
    movie.onSubtitleChange((l) => {
      setCurSubtitleState(l);
    });
    movie.onSourceChange((mediaSource) => {
      const { width, height } = mediaSource;
      player.pause();
      player.loadSource(mediaSource);
      player.setSize({
        width,
        height,
      });
      player.setCurrentTime(mediaSource.currentTime);
      setCurSource(mediaSource);
    });
    player.onCanPlay(() => {
      if (!view.state.visible) {
        return;
      }
      if (!movie.canAutoPlay) {
        return;
      }
      player.play();
    });
    player.onProgress(({ currentTime, duration }) => {
      // console.log("[PAGE]TVPlaying - onProgress", currentTime);
      movie.setCurrentTime(currentTime);
      movie.handleCurTimeChange({
        currentTime,
        duration,
      });
    });
    player.onPause(({ currentTime, duration }) => {
      // console.log("[PAGE]play - player.onPause", currentTime, duration);
      movie.updatePlayProgressForce({
        currentTime,
        duration,
      });
    });
    player.onVolumeChange(({ volume }) => {
      app.cache.merge("player_settings", {
        volume,
      });
    });
    player.onRateChange(({ rate }) => {
      setRate(rate);
    });
    player.onResolutionChange(({ type }) => {
      console.log("[PAGE]play - player.onResolutionChange", type);
      player.setCurrentTime(movie.currentTime);
    });
    player.onSourceLoaded(() => {
      console.log("[PAGE]play - player.onSourceLoaded", player.currentTime);
      player.setCurrentTime(player.currentTime);
    });
    // console.log("[PAGE]play - before player.onError");
    player.onError((error) => {
      console.log("[PAGE]play - player.onError");
      // app.tip({ text: ["视频加载错误", error.message] });
      errorTipDialog.show();
      player.pause();
    });
    player.onUrlChange(async ({ url, thumbnail }) => {
      const $video = player.node()!;
      console.log("[PAGE]play - player.onUrlChange", player.currentTime);
      //   player.setCurrentTime(player.currentTime);
      if (player.canPlayType("application/vnd.apple.mpegurl")) {
        player.load(url);
        return;
      }
      const mod = await import("hls.js");
      const Hls2 = mod.default;
      if (Hls2.isSupported() && url.includes("m3u8")) {
        // console.log("[PAGE]TVPlaying - need using hls.js");
        const Hls = new Hls2({ fragLoadingTimeOut: 2000 });
        Hls.attachMedia($video);
        Hls.on(Hls2.Events.MEDIA_ATTACHED, () => {
          Hls.loadSource(url);
        });
        return;
      }
      player.load(url);
    });
    // console.log("[PAGE]tv/play - before fetch tv profile", view.params.id);
    movie.fetchProfile(view.params.id);
  });

  // console.log("[PAGE]TVPlayingPage - render", tvId);
  // if (error) {
  //   return (
  //     <div className="w-full h-[100vh]">
  //       <div className="center text-center">{error}</div>
  //     </div>
  //   );
  // }

  return (
    <>
      <ScrollView store={scrollView} className="fixed dark:text-black-200">
        <div className="h-screen">
          <div className="operations">
            <div
              className={cn("z-10 absolute inset-0")}
              onClick={() => {
                topOperation.toggle();
                bottomOperation.toggle();
              }}
            >
              <div className="flex items-center justify-between">
                <Presence
                  store={topOperation}
                  className={cn(
                    "animate-in fade-in slide-in-from-top",
                    "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=closed]:fade-out"
                  )}
                >
                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div
                      className="inline-block p-4"
                      onClick={() => {
                        rootView.uncoverPrevView();
                      }}
                    >
                      <ArrowLeft className="w-6 h-6 dark:text-black-200" />
                    </div>
                  </div>
                </Presence>
              </div>
              <div className="absolute bottom-12 w-full safe-bottom">
                <Presence
                  store={bottomOperation}
                  className={cn(
                    "animate-in fade-in slide-in-from-bottom",
                    "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:fade-out"
                  )}
                >
                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div className="grid grid-cols-3 gap-4 mt-18"></div>
                    <div className="grid grid-cols-4 gap-2 mt-12 w-full px-2">
                      <div
                        className="flex flex-col items-center"
                        onClick={() => {
                          sourceSheet.show();
                        }}
                      >
                        <List className="w-6 h-6 " />
                        <p className="mt-2 text-sm ">切换源</p>
                      </div>
                      <div
                        className="flex flex-col items-center dark:text-black-200"
                        onClick={() => {
                          rateSheet.show();
                        }}
                      >
                        <Gauge className="w-6 h-6 " />
                        <p className="mt-2 text-sm ">{rate}x</p>
                      </div>
                      <div
                        className="flex flex-col items-center dark:text-black-200"
                        onClick={() => {
                          resolutionSheet.show();
                        }}
                      >
                        <Glasses className="w-6 h-6 " />
                        <p className="mt-2 text-sm ">{curSource?.typeText || "分辨率"}</p>
                      </div>
                      <div
                        className="flex flex-col items-center focus:outline-none focus:ring-0"
                        onClick={() => {
                          infoSheet.show();
                        }}
                      >
                        <MoreHorizontal className="w-6 h-6 " />
                        <p className="mt-2 text-sm ">更多</p>
                      </div>
                    </div>
                  </div>
                </Presence>
              </div>
            </div>
          </div>
          <div className="video z-20 absolute top-[20%]">
            {(() => {
              if (profile === null) {
                return null;
              }
              return (
                <div className="">
                  <Video store={player} />
                  {subtileState.visible ? (
                    <div key={subtileState.index} className="mt-2 space-y-1">
                      {subtileState.texts.map((text) => {
                        return (
                          <div key={text} className="text-center text-sm">
                            {text}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </div>
        </div>
      </ScrollView>
      <Sheet store={sourceSheet}>
        {(() => {
          if (profile === null) {
            return <div>Loading</div>;
          }
          const { sources } = profile;
          return (
            <div className="max-h-full overflow-y-auto">
              <div className="pt-4 pb-24 dark:text-black-200">
                {sources.map((source) => {
                  const { file_id, file_name, parent_paths } = source;
                  return (
                    <div
                      key={file_id}
                      onClick={() => {
                        movie.changeSource(source);
                      }}
                    >
                      <div
                        className={cn(
                          "p-4 rounded cursor-pointer",
                          curSource?.file_id === file_id ? "bg-slate-500" : ""
                        )}
                      >
                        <div className="break-all">
                          {parent_paths}/{file_name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Sheet>
      <Sheet store={rateSheet}>
        <div className="max-h-full overflow-y-auto">
          <div className="pt-4 pb-24 dark:text-black-200">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rateOpt, index) => {
              return (
                <div
                  key={index}
                  onClick={() => {
                    player.changeRate(rateOpt);
                  }}
                >
                  <div className={cn("p-4 rounded cursor-pointer", rate === rateOpt ? "bg-slate-500" : "")}>
                    <div className="break-all">{rateOpt}x</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Sheet>
      <Sheet store={resolutionSheet}>
        {(() => {
          if (profile === null || curSource === null) {
            return <div>Loading</div>;
          }
          const { typeText: curTypeText, resolutions } = curSource;
          return (
            <div className="max-h-full overflow-y-auto">
              <div className="pt-4 pb-24 dark:text-black-200">
                {resolutions.map((r, i) => {
                  const { type, typeText } = r;
                  return (
                    <div key={i}>
                      <div
                        className={cn("p-4 rounded cursor-pointer", curTypeText === typeText ? "bg-slate-500" : "")}
                        onClick={() => {
                          movie.changeResolution(type);
                        }}
                      >
                        {typeText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Sheet>
      <Sheet store={infoSheet}>
        {(() => {
          if (profile === null) {
            return (
              <div>
                <Loader className="animate animate-spin w-6 h-6" />
              </div>
            );
          }
          const { name, overview } = profile;
          return (
            <div className="max-h-full overflow-y-auto">
              <div className="pb-24 dark:text-black-200">
                <div className="px-4">
                  <div className="text-xl">{name}</div>
                  <div className="text-sm">{overview}</div>
                  <div className="mt-4 text-lg underline-offset-1">其他</div>
                  <div className=""></div>
                  {(() => {
                    if (!subtileState.enabled) {
                      return null;
                    }
                    return (
                      <div
                        className="mt-2 flex items-center"
                        onClick={() => {
                          subtitleSheet.show();
                        }}
                      >
                        <Subtitles className="mr-2 w-4 h-4" />
                        <div className="text-sm">字幕</div>
                      </div>
                    );
                  })()}
                  <div>
                    <div
                      className="mt-2 flex items-center"
                      onClick={() => {
                        reportSheet.show();
                      }}
                    >
                      <Send className="mr-2 w-4 h-4" />
                      <div className="text-sm">提交问题</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Sheet>
      <Sheet store={reportSheet}>
        <div className="max-h-full overflow-y-auto">
          <div className="pt-4 pb-24 dark:text-black-200">
            {MovieReportList.map((question, i) => {
              return (
                <div
                  key={i}
                  onClick={() => {
                    curReport.select(question);
                    reportConfirmDialog.show();
                  }}
                >
                  <div className={cn("py-2 px-4 rounded cursor-pointer")}>{question}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Sheet>
      <Sheet store={subtitleSheet}>
        <div className="max-h-full overflow-y-auto">
          {(() => {
            return (
              <div
                className="px-4"
                onClick={() => {
                  movie.toggleSubtitleVisible();
                }}
              >
                {subtileState.visible ? "隐藏字幕" : "显示字幕"}
              </div>
            );
          })()}
          <div className="pt-4 pb-24 dark:text-black-200">
            {subtileState.others.map((subtitle, i) => {
              return (
                <div
                  key={i}
                  onClick={() => {
                    movie.loadSubtitleFile(subtitle, movie.currentTime);
                  }}
                >
                  <div className={cn("py-2 px-4 rounded cursor-pointer", subtitle.selected ? "bg-slate-500" : "")}>
                    {subtitle.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Sheet>
      <Dialog store={reportConfirmDialog}>
        <p>提交你发现的该电视剧的问题</p>
        <p className="mt-2">「{curReportValue}」</p>
      </Dialog>
      <Dialog store={errorTipDialog}>
        <div>该问题是因为手机无法解析视频</div>
        <div>可以尝试如下解决方案</div>
        <div className="mt-4 text-left">
          <div>1、「切换源」或者「分辨率」</div>
          <div>2、使用电脑观看</div>
          <div>3、使用手机外部播放器(开发中)</div>
        </div>
      </Dialog>
    </>
  );
};
