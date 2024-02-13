/**
 * @file 电影播放页面
 */
import React, { useState } from "react";
import {
  Airplay,
  AlertTriangle,
  ArrowLeft,
  FastForward,
  Loader2,
  Maximize,
  Pause,
  Play,
  Rewind,
  Settings,
} from "lucide-react";

// import { client } from "@/store/request";
import { GlobalStorageValues, ViewComponent } from "@/store/types";
import { reportSomething, shareMediaToInvitee } from "@/services";
import { Show } from "@/packages/ui/show";
import { Dialog, Sheet, ScrollView, ListView, Video } from "@/components/ui";
import { MovieMediaSettings } from "@/components/movie-media-settings";
import { PlayingIcon } from "@/components/playing";
import { ToggleOverlay, ToggleOverrideCore } from "@/components/loader";
import { Presence } from "@/components/ui/presence";
import { PlayerProgressBar } from "@/components/ui/video-progress-bar";
import { ScrollViewCore, DialogCore, ToggleCore, PresenceCore } from "@/domains/ui";
import { RouteViewCore } from "@/domains/route_view";
import { MovieMediaCore } from "@/domains/media/movie";
import { MediaResolutionTypes } from "@/domains/source/constants";
import { RefCore } from "@/domains/cur";
import { PlayerCore } from "@/domains/player";
import { createVVTSubtitle } from "@/domains/subtitle/utils";
import { RequestCoreV2 } from "@/domains/request/v2";
import { Application, OrientationTypes } from "@/domains/app";
import { HttpClientCore } from "@/domains/http_client";
import { StorageCore } from "@/domains/storage";
import { useInitialize, useInstance } from "@/hooks";
import { cn, seconds_to_hour } from "@/utils";

class MoviePlayingPageLogic<
  P extends { app: Application; client: HttpClientCore; storage: StorageCore<GlobalStorageValues> }
> {
  $app: P["app"];
  $client: P["client"];
  $storage: P["storage"];
  $tv: MovieMediaCore;
  $player: PlayerCore;
  $settings: RefCore<{
    volume: number;
    rate: number;
    type: MediaResolutionTypes;
  }>;
  $report: RefCore<string>;
  $createReport: RequestCoreV2<{ fetch: typeof reportSomething; client: HttpClientCore }>;

  constructor(props: P) {
    const { app, client, storage } = props;
    this.$app = app;
    this.$client = client;
    this.$storage = storage;

    this.$createReport = new RequestCoreV2({
      fetch: reportSomething,
      client,
    });
    const settings = storage.get("player_settings");
    this.$settings = new RefCore<{
      volume: number;
      rate: number;
      type: MediaResolutionTypes;
    }>({
      value: settings,
    });
    const { type: resolution, volume, rate } = settings;
    const tv = new MovieMediaCore({
      resolution,
      client,
    });
    this.$tv = tv;
    const player = new PlayerCore({ app, volume, rate });
    this.$report = new RefCore<string>();
    //     const reportSheet = new DialogCore();
    this.$player = player;

    app.onHidden(() => {
      player.pause();
    });
    app.onShow(() => {
      console.log("[PAGE]play - app.onShow", player.currentTime);
      // 锁屏后 currentTime 不是锁屏前的
      player.setCurrentTime(player.currentTime);
    });
    app.onOrientationChange((orientation) => {
      console.log("[PAGE]tv/play - app.onOrientationChange", orientation, app.screen.width);
      if (orientation === "horizontal") {
        if (!player.hasPlayed && app.env.ios) {
          //   $$fullscreenDialog.show();
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
        // $$fullscreenDialog.hide();
      }
    });
    player.onExitFullscreen(() => {
      player.pause();
      if (app.orientation === OrientationTypes.Vertical) {
        player.disableFullscreen();
      }
    });
    tv.onProfileLoaded((profile) => {
      app.setTitle(tv.getTitle().join(" - "));
      const { curSource } = profile;
      // console.log("[PAGE]play - tv.onProfileLoaded", curEpisode.name);
      tv.playSource(curSource, { currentTime: curSource.currentTime ?? 0 });
      player.setCurrentTime(curSource.currentTime);
      //       bottomOperation.show();
    });
    tv.$source.onSubtitleLoaded((subtitle) => {
      player.showSubtitle(createVVTSubtitle(subtitle));
    });
    tv.onTip((msg) => {
      app.tip(msg);
    });
    tv.onSourceFileChange((mediaSource) => {
      // console.log("[PAGE]play - tv.onSourceChange", mediaSource.currentTime);
      player.pause();
      player.setSize({ width: mediaSource.width, height: mediaSource.height });
      storage.merge("player_settings", {
        type: mediaSource.type,
      });
      // loadSource 后开始 video loadstart 事件
      player.loadSource(mediaSource);
    });
    player.onReady(() => {
      player.disableFullscreen();
    });
    player.onCanPlay(() => {
      const { currentTime } = tv;
      console.log("[PAGE]play - player.onCanPlay", player.hasPlayed, currentTime);
      const _self = this;
      function applySettings() {
        player.setCurrentTime(currentTime);
        const { rate } = _self.$settings.value!;
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
    player.onVolumeChange(({ volume }) => {
      storage.merge("player_settings", {
        volume,
      });
    });
    player.onProgress(({ currentTime, duration }) => {
      // console.log("[PAGE]TVPlaying - onProgress", currentTime);
      if (!player._canPlay) {
        return;
      }
      tv.handleCurTimeChange({
        currentTime,
        duration,
      });
    });
    player.onPause(({ currentTime, duration }) => {
      console.log("[PAGE]play - player.onPause", currentTime, duration);
      tv.updatePlayProgressForce({
        currentTime,
        duration,
      });
    });
    // player.onEnd(() => {
    //   console.log("[PAGE]play - player.onEnd");
    //   tv.playNextEpisode();
    // });
    player.onResolutionChange(({ type }) => {
      console.log("[PAGE]play - player.onResolutionChange", type, tv.currentTime);
      // player.setCurrentTime(tv.currentTime);
    });
    player.onSourceLoaded(() => {
      console.log("[PAGE]play - player.onSourceLoaded", tv.currentTime);
      player.setCurrentTime(tv.currentTime);
      if (!player.hasPlayed) {
        return;
      }
      //       episodesSheet.hide();
      //       sourcesSheet.hide();
      //       resolutionSheet.hide();
    });
    // console.log("[PAGE]play - before player.onError");
    player.onError(async (error) => {
      console.log("[PAGE]play - player.onError", tv.curSource?.name, tv.curSource?.curFileId);
      // router.replaceSilently(`/out_players?token=${token}&tv_id=${view.params.id}`);
      await (async () => {
        if (!tv.curSource) {
          return;
        }
        const files = tv.curSource.files;
        const curFileId = tv.curSource.curFileId;
        const curFileIndex = files.findIndex((f) => f.id === curFileId);
        const nextIndex = curFileIndex + 1;
        const nextFile = files[nextIndex];
        if (!nextFile) {
          app.tip({ text: ["视频加载错误", error.message] });
          player.setInvalid(error.message);
          return;
        }
        await tv.changeSourceFile(nextFile);
      })();
      player.pause();
    });
    player.onUrlChange(async ({ url }) => {
      const $video = player.node()!;
      console.log("[]player.onUrlChange", url, player.canPlayType("application/vnd.apple.mpegurl"), $video);
      if (player.canPlayType("application/vnd.apple.mpegurl")) {
        player.load(url);
        return;
      }
      const mod = await import("hls.js");
      const Hls2 = mod.default;
      if (Hls2.isSupported() && url.includes("m3u8")) {
        const Hls = new Hls2({ fragLoadingTimeOut: 2000 });
        Hls.attachMedia($video);
        Hls.on(Hls2.Events.MEDIA_ATTACHED, () => {
          Hls.loadSource(url);
        });
        return;
      }
      player.load(url);
    });
  }
}

class MoviePlayingPageView {
  $view: RouteViewCore;
  $scroll = new ScrollViewCore({});

  $mask = new PresenceCore({ mounted: true, open: true });
  $top = new PresenceCore({ mounted: true, open: true });
  $bottom = new PresenceCore({ mounted: true, open: true });
  $control = new PresenceCore({ mounted: true, open: true });
  $time = new PresenceCore({});
  $subtitle = new PresenceCore({});
  $settings = new DialogCore();
  $episodes = new DialogCore();

  visible = true;
  timer: null | NodeJS.Timeout = null;

  constructor(props: { view: RouteViewCore }) {
    const { view } = props;
    this.$view = view;
  }

  show() {
    this.$top.show();
    this.$bottom.show();
    this.$control.show();
    this.$mask.show();
    this.visible = true;
  }
  hide() {
    this.$top.hide();
    this.$bottom.hide();
    this.$control.hide();
    this.$mask.hide();
    this.visible = false;
  }
  toggle() {
    this.$top.toggle();
    this.$bottom.toggle();
    this.$control.toggle();
    this.$mask.toggle();
    this.visible = !this.visible;
  }
  attemptToShow() {
    if (this.timer !== null) {
      this.hide();
      clearTimeout(this.timer);
      this.timer = null;
      return false;
    }
    this.show();
    return true;
  }
  prepareHide() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = setTimeout(() => {
      this.hide();
      this.timer = null;
    }, 5000);
  }
  prepareToggle() {
    if (this.timer === null) {
      this.toggle();
      return;
    }
    clearTimeout(this.timer);
    this.toggle();
  }
  stopHide() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const MoviePlayingPageV2: ViewComponent = React.memo((props) => {
  const { app, history, client, storage, view } = props;

  //   const shareMediaRequest = useInstance(
  //     () =>
  //       new RequestCore(shareMediaToInvitee, {
  //         onLoading(loading) {
  //           inviteeSelect.submitBtn.setLoading(loading);
  //         },
  //         onSuccess(v) {
  //           const { url, name } = v;
  //           const message = `➤➤➤ ${name}
  // ${url}`;
  //           setShareLink(message);
  //           shareLinkDialog.show();
  //           inviteeSelect.dialog.hide();
  //         },
  //         onFailed(error) {
  //           const { data } = error;
  //           if (error.code === 50000) {
  //             // @ts-ignore
  //             const { name, url } = data;
  //             const message = `➤➤➤ ${name}
  // ${url}`;
  //             setShareLink(message);
  //             shareLinkDialog.show();
  //             inviteeSelect.dialog.hide();
  //             return;
  //           }
  //           app.tip({
  //             text: ["分享失败", error.message],
  //           });
  //         },
  //       })
  //   );

  //   const shareLinkDialog = useInstance(
  //     () =>
  //       new DialogCore({
  //         footer: false,
  //       })
  //   );
  //   const inviteeSelect = useInstance(
  //     () =>
  //       new InviteeSelectCore({
  //         onOk(invitee) {
  //           if (!invitee) {
  //             app.tip({
  //               text: ["请选择分享好友"],
  //             });
  //             return;
  //           }
  //           shareMediaRequest.run({
  //             season_id: view.query.season_id,
  //             target_member_id: invitee.id,
  //           });
  //         },
  //       })
  //   );
  const $logic = useInstance(() => new MoviePlayingPageLogic({ app, client, storage }));
  const $page = useInstance(() => new MoviePlayingPageView({ view }));

  const [state, setProfile] = useState($logic.$tv.state);
  const [curSource, setCurSource] = useState($logic.$tv.$source.profile);
  const [subtileState, setCurSubtitleState] = useState($logic.$tv.$source.subtitle);
  const [targetTime, setTargetTime] = useState<null | string>(null);
  const [playerState, setPlayerState] = useState($logic.$player.state);
  const [shareLink, setShareLink] = useState("");
  const [curReportValue, setCurReportValue] = useState($logic.$report.value);

  useInitialize(() => {
    if (view.query.rate) {
      $logic.$player.changeRate(Number(view.query.rate));
      return;
    }
    view.onHidden(() => {
      $logic.$player.pause();
    });
    // if (!view.query.hide_menu) {
    //   $page.$scrollView.onPullToBack(() => {
    //     app.back();
    //   });
    // }
    if (view.query.hide_menu) {
      setTimeout(() => {
        // topOperation.hide();
        // bottomOperation.hide();
      }, 1000);
    }
    $logic.$tv.onStateChange((nextProfile) => {
      setProfile(nextProfile);
    });
    // $logic.$tv.$source.onSubtitleLoaded(() => {
    //   $page.$subtitle.show();
    // });
    // $logic.$tv.$source.onSubtitleChange((v) => {
    //   setCurSubtitleState(v);
    // });
    $logic.$player.onStateChange((v) => {
      setPlayerState(v);
    });
    $logic.$player.onTargetTimeChange((v) => {
      setTargetTime(seconds_to_hour(v));
    });
    $logic.$player.beforeAdjustCurrentTime(() => {
      $page.$time.show();
      $page.stopHide();
    });
    $logic.$player.afterAdjustCurrentTime(() => {
      $page.prepareHide();
      $page.$time.hide();
    });
    // $logic._createReport.onSuccess(() => {
    //   app.tip({
    //     text: ["提交成功"],
    //   });
    // });
    // $logic._createReport.onLoadingChange((loading) => {
    //       reportConfirmDialog.okBtn.setLoading(loading);
    // });
    // $logic._createReport.onFailed((error) => {
    //   app.tip({
    //     text: ["提交失败", error.message],
    //   });
    // });

    //     setCurReportValue(v);
    $logic.$tv.fetchProfile(view.query.id);
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
      <ScrollView
        store={$page.$scroll}
        className="fixed h-screen bg-w-bg-0"
        onClick={(event) => {
          $page.prepareToggle();
        }}
      >
        <div
          className="absolute z-10 top-[36%] left-[50%] w-full min-h-[120px] -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translate(-50%, -50%)` }}
        >
          <div className="max-w-[750px]">
            <Video store={$logic.$player} />
          </div>
          <div className="absolute z-20 inset-0">
            <Presence
              className={cn("animate-in fade-in", "data-[state=closed]:animate-out data-[state=closed]:fade-out")}
              store={$page.$mask}
            >
              <div className="bg-w-fg-1 dark:bg-w-bg-1 opacity-20"></div>
            </Presence>
          </div>
          <div
            className="absolute z-30 top-[50%] left-[50%] text-w-bg-0 dark:text-w-fg-0"
            style={{ transform: `translate(-50%, -50%)` }}
          >
            <Presence
              className={cn("animate-in fade-in", "data-[state=closed]:animate-out data-[state=closed]:fade-out")}
              store={$page.$control}
            >
              <Show
                when={!playerState.error}
                fallback={
                  <div className="flex flex-col justify-center items-center">
                    <AlertTriangle className="w-16 h-16" />
                    <div className="mt-4 text-center">{playerState.error}</div>
                  </div>
                }
              >
                <Show when={!!playerState.ready} fallback={<Loader2 className="w-16 h-16 animate animate-spin" />}>
                  <div
                    className="flex items-center space-x-8"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <Rewind
                      className="w-8 h-8"
                      onClick={() => {
                        $logic.$player.setCurrentTime($logic.$tv.currentTime - 10);
                        $page.prepareHide();
                      }}
                    />
                    <div className="p-2">
                      <Show
                        when={playerState.playing}
                        fallback={
                          <div
                            onClick={() => {
                              $logic.$player.play();
                              $page.prepareHide();
                            }}
                          >
                            <Play className="relative left-[6px] w-16 h-16" />
                          </div>
                        }
                      >
                        <div
                          onClick={() => {
                            $logic.$player.pause();
                            $page.prepareHide();
                          }}
                        >
                          <Pause className="w-16 h-16" />
                        </div>
                      </Show>
                    </div>
                    <FastForward
                      className="w-8 h-8"
                      onClick={() => {
                        $logic.$player.setCurrentTime($logic.$tv.currentTime + 10);
                      }}
                    />
                  </div>
                </Show>
              </Show>
            </Presence>
          </div>
        </div>
        <div className="absolute z-0 inset-0 text-w-fg-0">
          <div
            className=""
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Presence
              store={$page.$top}
              className={cn(
                "flex items-center justify-between",
                "animate-in fade-in slide-in-from-top",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=closed]:fade-out"
              )}
            >
              <div
                className="inline-block p-4"
                onClick={() => {
                  history.back();
                }}
              >
                <ArrowLeft className="w-6 h-6" />
              </div>
              <div className="flex items-center">
                {/* <div className="inline-block p-4">
                  <PictureInPicture className="w-6 h-6" />
                </div> */}
                <div
                  className="inline-block p-4"
                  onClick={() => {
                    $logic.$player.showAirplay();
                  }}
                >
                  <Airplay className="w-6 h-6" />
                </div>
              </div>
            </Presence>
          </div>
          <div
            className="absolute bottom-12 w-full safe-bottom"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Presence store={$page.$time}>
              <div className="text-center text-xl">{targetTime}</div>
            </Presence>
            {/* <Presence store={$page.$subtitle}>
              {(() => {
                if (subtileState === null) {
                  return;
                }
                return (
                  <div key={subtileState.index} className="mb-16 space-y-1">
                    {subtileState.texts.map((text) => {
                      return (
                        <div key={text} className="text-center text-lg">
                          {text}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Presence> */}
            <Presence
              className={cn(
                "animate-in fade-in slide-in-from-bottom",
                "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:fade-out"
              )}
              store={$page.$bottom}
            >
              <div className="px-4">
                <PlayerProgressBar store={$logic.$player} />
              </div>
              <div
                className="flex items-center flex-reverse space-x-4 mt-6 w-full px-2"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <div
                  className="relative p-2 rounded-md"
                  onClick={() => {
                    $page.$settings.show();
                  }}
                >
                  <Settings className="w-6 h-6" />
                </div>
                <div
                  className="relative p-2 rounded-md"
                  onClick={() => {
                    $logic.$player.requestFullScreen();
                  }}
                >
                  <Maximize className="w-6 h-6" />
                </div>
              </div>
            </Presence>
          </div>
        </div>
      </ScrollView>
      <Sheet store={$page.$settings} hideTitle>
        <MovieMediaSettings
          store={$logic.$tv}
          store2={$logic.$player}
          app={app}
          client={client}
          history={history}
          storage={storage}
        />
      </Sheet>
      {/* <Sheet store={dSheet} size="xl">
        {(() => {
          if (state === null) {
            return (
              <div>
                <Loader className="animate animate-spin w-6 h-6" />
              </div>
            );
          }
          const { name, overview } = state;
          return (
            <ScrollView store={scrollView2} className="top-14 fixed" contentClassName="pb-24">
              <div className="text-w-fg-1">
                <div className="">
                  <div className="px-4">
                    <div className="text-xl">{name}</div>
                    <div className="text-sm">{overview}</div>
                    <div className="mt-4 text-lg underline-offset-1">其他</div>
                    <div className="flex mt-2 space-x-2">
                      <div className="">
                        {(() => {
                          if (!subtileState.enabled) {
                            return null;
                          }
                          return (
                            <div
                              className=""
                              onClick={() => {
                                subtitleSheet.show();
                              }}
                            >
                              <div className="flex items-center justify-center p-2 rounded-md bg-w-bg-0">
                                <Subtitles className="w-4 h-4" />
                              </div>
                              <div className="mt-1 text-sm">字幕</div>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <div
                          className=""
                          onClick={() => {
                            reportSheet.show();
                          }}
                        >
                          <div className="flex items-center justify-center p-2 rounded-md bg-w-bg-0">
                            <Send className="w-4 h-4" />
                          </div>
                          <div className="mt-1 text-sm">提交问题</div>
                        </div>
                      </div>
                      <div>
                        <div
                          className=""
                          onClick={() => {
                            inviteeSelect.dialog.show();
                          }}
                        >
                          <div className="flex items-center justify-center p-2 rounded-md bg-w-bg-0">
                            <Share2 className="w-4 h-4" />
                          </div>
                          <div className="mt-1 text-sm">分享</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollView>
          );
        })()}
      </Sheet> */}
      {/* <Sheet store={reportSheet}>
        <div className="max-h-full text-w-fg-1 overflow-y-auto">
          <div className="pt-4 pb-24">
            {TVReportList.map((question, i) => {
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
        <div className="max-h-full text-w-fg-1 pb-24 overflow-y-auto">
          {(() => {
            return (
              <div
                className="px-4"
                onClick={() => {
                  player.toggleSubtitleVisible();
                  tv.$source.toggleSubtitleVisible();
                }}
              >
                {subtileState?.visible ? "隐藏字幕" : "显示字幕"}
              </div>
            );
          })()}
          <div className="pt-4 text-w-fg-1">
            {tv.$source.subtitles.map((subtitle, i) => {
              return (
                <div
                  key={i}
                  onClick={() => {
                    tv.$source.loadSubtitleFile(subtitle, tv.currentTime);
                  }}
                >
                  <div className={cn("py-2 px-4 cursor-pointer", subtitle.cur ? "bg-w-bg-active" : "")}>
                    {subtitle.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Sheet> */}
      {/* <Sheet store={inviteeSelect.dialog} size="xl">
        <InviteeSelect store={inviteeSelect} />
      </Sheet> */}
      {/* <Dialog store={reportConfirmDialog}>
        <div className="text-w-fg-1">
          <p>提交该电视剧的问题</p>
          <p className="mt-2">「{curReportValue}」</p>
        </div>
      </Dialog> */}
      {/* <Dialog store={errorTipDialog}>
        <div className=" text-w-fg-1">
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
                      .replace(/\$name/, state.profile ? state.profile.name : encodeURIComponent(curSource.url));
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
      </Dialog> */}
      {/* <Dialog store={fullscreenDialog}>
        <div className="text-w-fg-1">点击进入全屏播放</div>
      </Dialog> */}
      {/* <Dialog store={shareLinkDialog}>
        <div
          onClick={() => {
            if (!shareLink) {
              return;
            }
            app.copy(shareLink);
            app.tip({
              text: ["已复制至粘贴板"],
            });
            shareLinkDialog.hide();
          }}
        >
          <div>点击复制该信息至粘贴板</div>
          <div className="mt-4 rounded-md p-4 bg-w-bg-2">
            <pre className="text-left text-w-fg-1">{shareLink}</pre>
          </div>
        </div>
      </Dialog> */}
    </>
  );
});
