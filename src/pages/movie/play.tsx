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

import { Video, Sheet, ScrollView, Dialog, LazyImage } from "@/components/ui";
import { Presence } from "@/components/ui/presence";
import { ScrollViewCore, DialogCore, PresenceCore } from "@/domains/ui";
import { PlayerCore } from "@/domains/player";
import { MediaResolutionTypes } from "@/domains/movie/constants";
import { MovieCore } from "@/domains/movie";
import { RefCore } from "@/domains/cur";
import { createVVTSubtitle } from "@/domains/subtitle/utils";
import { RequestCore } from "@/domains/request";
import { reportSomething } from "@/services";
import { MovieReportList, ReportTypes, players } from "@/constants";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { rootView } from "@/store";
import { cn } from "@/utils";
import { OrientationTypes } from "@/domains/app";

export const MoviePlayingPage: ViewComponent = (props) => {
  const { app, view } = props;

  const settingsRef = useInstance(() => {
    const r = new RefCore<{
      volume: number;
      rate: number;
      type: MediaResolutionTypes;
    }>({
      value: app.cache.get("player_settings", {
        volume: 0.5,
        rate: 1,
        type: "SD",
      }),
    });
    return r;
  });
  const movie = useInstance(() => {
    const { type: resolution } = settingsRef.value!;
    const movie = new MovieCore({ resolution });
    return movie;
  });
  const player = useInstance(() => {
    const { volume, rate } = settingsRef.value!;
    const player = new PlayerCore({ app, volume, rate });
    return player;
  });
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onPullToBack() {
          app.back();
        },
      })
  );
  const sourceSheet = useInstance(() => new DialogCore());
  const rateSheet = useInstance(() => new DialogCore());
  const resolutionSheet = useInstance(() => new DialogCore());
  const infoSheet = useInstance(() => new DialogCore());
  const curReport = useInstance(
    () =>
      new RefCore<string>({
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
  const fullscreenDialog = useInstance(
    () =>
      new DialogCore({
        title: "进入全屏播放",
        cancel: false,
        onOk() {
          fullscreenDialog.hide();
          player.requestFullScreen();
        },
      })
  );
  const topOperation = useInstance(() => new PresenceCore({ open: true, mounted: true }));
  const bottomOperation = useInstance(() => new PresenceCore({}));

  const [profile, setProfile] = useState(movie.profile);
  const [curSource, setCurSource] = useState(movie.curSource);
  const [subtileState, setCurSubtitleState] = useState(movie.subtitle);
  const [curReportValue, setCurReportValue] = useState(curReport.value);
  const [rate, setRate] = useState(player.state.rate);

  useInitialize(() => {
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
    player.onExitFullscreen(() => {
      player.pause();
      if (movie.curSource) {
        player.setSize({ width: movie.curSource.width, height: movie.curSource.height });
      }
      if (app.orientation === OrientationTypes.Vertical) {
        player.disableFullscreen();
      }
    });
    app.onOrientationChange((orientation) => {
      if (orientation === "horizontal") {
        if (!player.hasPlayed && app.env.ios) {
          fullscreenDialog.show();
          return;
        }
        if (player.isFullscreen) {
          return;
        }
        player.requestFullScreen();
        player.isFullscreen = true;
      }
      if (orientation === "vertical") {
        player.disableFullscreen();
        fullscreenDialog.hide();
        if (curSource) {
          player.setSize({ width: curSource.width, height: curSource.height });
        }
      }
    });
    movie.onProfileLoaded((profile) => {
      app.setTitle(movie.getTitle().join(" - "));
      movie.play();
      player.setCurrentTime(profile.currentTime);
      bottomOperation.show();
    });
    movie.onSubtitleLoaded((subtitle) => {
      player.setSubtitle(createVVTSubtitle(subtitle));
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
      function applySettings() {
        player.setCurrentTime(movie.currentTime);
        if (view.query.rate) {
          player.changeRate(Number(view.query.rate));
          return;
        }
        const { rate } = settingsRef.value!;
        if (rate) {
          player.changeRate(Number(rate));
        }
      }
      (() => {
        if (app.env.android) {
          setTimeout(() => {
            applySettings();
          }, 1000);
          return;
        }
        applySettings();
      })();
      if (!player.hasPlayed) {
        return;
      }
      player.play();
    });
    player.onProgress(({ currentTime, duration }) => {
      // console.log("[PAGE]TVPlaying - onProgress", currentTime);
      if (!player._canPlay) {
        return;
      }
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
    });
    player.onSourceLoaded(() => {
      console.log("[PAGE]play - player.onSourceLoaded", player.currentTime);
      if (!player.hasPlayed) {
        return;
      }
    });
    // console.log("[PAGE]play - before player.onError");
    player.onError((error) => {
      // console.log("[PAGE]play - player.onError");
      (() => {
        if (error.message.includes("格式")) {
          errorTipDialog.show();
          return;
        }
        app.tip({ text: ["视频加载错误", error.message] });
      })();
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
      <ScrollView store={scrollView} className="fixed text-w-fg-1">
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
                        app.back();
                      }}
                    >
                      <ArrowLeft className="w-6 h-6" />
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
                        <div className="p-4 rounded-md bg-w-bg-2">
                          <List className="w-6 h-6 " />
                        </div>
                        <p className="mt-2 text-sm ">切换源</p>
                      </div>
                      <div
                        className="flex flex-col items-center"
                        onClick={() => {
                          rateSheet.show();
                        }}
                      >
                        <div className="p-4 rounded-md bg-w-bg-2">
                          <Gauge className="w-6 h-6 " />
                        </div>
                        <p className="mt-2 text-sm ">{rate}x</p>
                      </div>
                      <div
                        className="flex flex-col items-center"
                        onClick={() => {
                          resolutionSheet.show();
                        }}
                      >
                        <div className="p-4 rounded-md bg-w-bg-2">
                          <Glasses className="w-6 h-6 " />
                        </div>
                        <p className="mt-2 text-sm ">{curSource?.typeText || "分辨率"}</p>
                      </div>
                      <div
                        className="flex flex-col items-center focus:outline-none focus:ring-0"
                        onClick={() => {
                          infoSheet.show();
                        }}
                      >
                        <div className="p-4 rounded-md bg-w-bg-2">
                          <MoreHorizontal className="w-6 h-6 " />
                        </div>
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
                  {/* {subtileState.visible ? (
                    <div key={subtileState.index} className="mt-2 space-y-1">
                      {subtileState.texts.map((text) => {
                        return (
                          <div key={text} className="text-center text-sm">
                            {text}
                          </div>
                        );
                      })}
                    </div>
                  ) : null} */}
                </div>
              );
            })()}
          </div>
        </div>
      </ScrollView>
      <Sheet store={sourceSheet}>
        {(() => {
          if (profile === null) {
            return <div className="text-w-fg-1">Loading</div>;
          }
          const { sources } = profile;
          return (
            <div className="max-h-full overflow-y-auto text-w-fg-1">
              <div className="pt-4 pb-24">
                {sources.map((source) => {
                  const { file_id, file_name, parent_paths } = source;
                  return (
                    <div
                      key={file_id}
                      onClick={() => {
                        movie.changeSource(source);
                      }}
                    >
                      <div className={cn("p-4 cursor-pointer", curSource?.file_id === file_id ? "bg-w-bg-active" : "")}>
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
        <div className="max-h-full overflow-y-auto text-w-fg-1">
          <div className="pt-4 pb-24">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rateOpt, index) => {
              return (
                <div
                  key={index}
                  onClick={() => {
                    player.changeRate(rateOpt);
                    app.cache.merge("player_settings", {
                      rate: rateOpt,
                    });
                  }}
                >
                  <div className={cn("p-4 cursor-pointer", rate === rateOpt ? "bg-w-bg-active" : "")}>
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
            return <div className="text-w-fg-1">Loading</div>;
          }
          const { typeText: curTypeText, resolutions } = curSource;
          return (
            <div className="max-h-full overflow-y-auto text-w-fg-1">
              <div className="pt-4 pb-24">
                {resolutions.map((r, i) => {
                  const { type, typeText } = r;
                  return (
                    <div key={i}>
                      <div
                        className={cn("p-4 cursor-pointer", curTypeText === typeText ? "bg-w-bg-active" : "")}
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
              <div className="text-w-fg-1">
                <Loader className="animate animate-spin w-6 h-6" />
              </div>
            );
          }
          const { name, overview } = profile;
          return (
            <div className="max-h-full overflow-y-auto text-w-fg-1">
              <div className="pb-24">
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
        <div className="max-h-full text-w-fg-1 overflow-y-auto">
          <div className="pt-4 pb-24">
            {MovieReportList.map((question, i) => {
              return (
                <div
                  key={i}
                  onClick={() => {
                    curReport.select(question);
                    reportConfirmDialog.show();
                  }}
                >
                  <div className={cn("py-2 px-4 cursor-pointer")}>{question}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Sheet>
      <Sheet store={subtitleSheet}>
        <div className="max-h-full pb-24 text-w-fg-1 overflow-y-auto">
          {(() => {
            return (
              <div
                className="px-4"
                onClick={() => {
                  player.toggleSubtitleVisible();
                  movie.toggleSubtitleVisible();
                }}
              >
                {subtileState.visible ? "隐藏字幕" : "显示字幕"}
              </div>
            );
          })()}
          <div className="pt-4">
            {subtileState.others.map((subtitle, i) => {
              return (
                <div
                  key={i}
                  onClick={() => {
                    movie.loadSubtitleFile(subtitle, movie.currentTime);
                  }}
                >
                  <div className={cn("py-2 px-4 cursor-pointer", subtitle.selected ? "bg-w-bg-active" : "")}>
                    {subtitle.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Sheet>
      <Dialog store={reportConfirmDialog}>
        <div className="text-w-fg-1">
          <p>提交你发现的该电视剧的问题</p>
          <p className="mt-2">「{curReportValue}」</p>
        </div>
      </Dialog>
      <Dialog store={errorTipDialog}>
        <div className="text-w-fg-1">
          <div>该问题是因为手机无法解析视频</div>
          <div>可以尝试如下解决方案</div>
          <div className="mt-4 text-left space-y-4">
            <div>1、「切换源」或者「分辨率」</div>
            <div>
              <div>2、使用电脑观看</div>
              <div
                className="mt-2 break-all"
                onClick={() => {
                  app.copy(window.location.href.replace(/mobile/, "pc"));
                  app.tip({
                    text: ["已复制到剪贴板"],
                  });
                }}
              >
                {window.location.href.replace(/mobile/, "pc")}
              </div>
            </div>
            <div>
              <div>3、使用手机外部播放器</div>
              <div className="flex items-center mt-2 space-x-2">
                {players.map((player) => {
                  const { icon, name, scheme } = player;
                  const url = (() => {
                    if (!curSource) {
                      return null;
                    }
                    return scheme
                      .replace(/\$durl/, curSource.url)
                      .replace(/\$name/, profile ? profile.name : encodeURIComponent(curSource.url));
                  })();
                  if (!url) {
                    return null;
                  }
                  return (
                    <a key={name} className="flex justify-center relative px-4 h-14" href={url}>
                      <LazyImage className="w-8 h-8 rounded-full" src={icon} />
                      <div className="absolute bottom-0 w-full text-center">{name}</div>
                    </a>
                  );
                })}
              </div>
              <div className="mt-2 font-sm text-w-fg-2">
                <div>需要至少安装了一款上述软件，推荐安装 VLC</div>
                <div>点击仍没有反应请点击右上角，并选择「在浏览器中打开」</div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      <Dialog store={fullscreenDialog}>
        <div className="text-w-fg-1">点击进入全屏播放</div>
      </Dialog>
    </>
  );
};
