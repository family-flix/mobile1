/**
 * @file 电视剧播放页面
 */
import React, { useState } from "react";
import {
  ArrowBigLeft,
  ArrowBigRight,
  ArrowLeft,
  Gauge,
  Glasses,
  List,
  Loader,
  MoreHorizontal,
  Send,
  Share2,
  Subtitles,
  Wand2,
} from "lucide-react";

import { ViewComponent } from "@/store/types";
import { reportSomething, shareMediaToInvitee } from "@/services/index";
import { useInitialize, useInstance } from "@/hooks/index";
import { Dialog, Sheet, ScrollView, ListView, Video, LazyImage } from "@/components/ui";
import { ToggleOverlay, ToggleOverrideCore } from "@/components/loader";
import { Presence } from "@/components/ui/presence";
import { InviteeSelectCore } from "@/components/member-select/store";
import { RequestCoreV2 } from "@/domains/request/v2";
import { ScrollViewCore, DialogCore, ToggleCore, PresenceCore } from "@/domains/ui";
import { TVCore } from "@/domains/tv/index";
import { RefCore } from "@/domains/cur/index";
import { PlayerCore } from "@/domains/player/index";
import { createVVTSubtitle } from "@/domains/subtitle/utils";
import { MediaResolutionTypes } from "@/domains/source/constants";
import { OrientationTypes } from "@/domains/app/index";
import { ReportTypes, SeasonReportList, players } from "@/constants/index";
import { cn } from "@/utils/index";

export const TVPlayingPage: ViewComponent = React.memo((props) => {
  const { app, history, client, storage, view } = props;

  const shareMediaRequest = useInstance(
    () =>
      new RequestCoreV2({
        client,
        fetch: shareMediaToInvitee,
        onLoading(loading) {
          inviteeSelect.submitBtn.setLoading(loading);
        },
        onSuccess(v) {
          const { url, name } = v;
          const message = `➤➤➤ ${name}
${url}`;
          setShareLink(message);
          shareLinkDialog.show();
          // inviteeSelect.dialog.hide();
        },
        onFailed(error) {
          const { data } = error;
          if (error.code === 50000) {
            // @ts-ignore
            const { name, url } = data;
            const message = `➤➤➤ ${name}
${url}`;
            setShareLink(message);
            shareLinkDialog.show();
            // inviteeSelect.dialog.hide();
            return;
          }
          app.tip({
            text: ["分享失败", error.message],
          });
        },
      })
  );
  const settingsRef = useInstance(() => {
    const r = new RefCore<{
      volume: number;
      rate: number;
      type: MediaResolutionTypes;
    }>({
      value: storage.get("player_settings"),
    });
    return r;
  });
  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        os: app.env,
      })
  );
  const tv = useInstance(() => {
    const { type: resolution } = settingsRef.value!;
    const tv = new TVCore({
      resolution,
      client,
    });
    // @ts-ignore
    window.__tv__ = tv;
    return tv;
  });
  const player = useInstance(() => {
    const { volume, rate } = settingsRef.value!;
    const player = new PlayerCore({ app, volume, rate });
    // @ts-ignore
    window.__player__ = player;
    return player;
  });
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
      new RequestCoreV2({
        client: client,
        fetch: reportSomething,
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
  const episodesSheet = useInstance(() => new DialogCore());
  const sourcesSheet = useInstance(() => new DialogCore());
  const rateSheet = useInstance(() => new DialogCore());
  const resolutionSheet = useInstance(() => new DialogCore());
  const loadingPresence = useInstance(() => new PresenceCore());
  const dSheet = useInstance(() => new DialogCore());
  const shareLinkDialog = useInstance(
    () =>
      new DialogCore({
        footer: false,
      })
  );
  const inviteeSelect = useInstance(
    () =>
      new InviteeSelectCore({
        client,
        onOk(invitee) {
          if (!invitee) {
            app.tip({
              text: ["请选择分享好友"],
            });
            return;
          }
          shareMediaRequest.run({
            season_id: view.query.season_id,
            target_member_id: invitee.id,
          });
        },
      })
  );
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
            type: ReportTypes.Season,
            data: JSON.stringify({
              content: curReport.value,
              tv_id: tv.profile?.id,
              season_id: tv.curSeason?.id,
              episode_id: tv.curEpisode?.id,
            }),
          });
        },
      })
  );
  const reportSheet = useInstance(() => new DialogCore());
  const cover = useInstance(() => new ToggleCore({ boolean: true }));
  const episodeScrollView = useInstance(
    () =>
      new ScrollViewCore({
        os: app.env,
        // async onPullToRefresh() {
        //   await tv.episodeList.refresh();
        //   episodeScrollView.stopPullToRefresh();
        // },
        async onReachBottom() {
          await tv.$episodeList.loadMore();
          episodeScrollView.finishLoadingMore();
        },
      })
  );
  const subtitleSheet = useInstance(() => new DialogCore({}));
  const nextEpisodeLoader = useInstance(() => new ToggleOverrideCore({}));
  const topOperation = useInstance(() => new PresenceCore({ mounted: true, visible: true }));
  const bottomOperation = useInstance(() => new PresenceCore({}));
  const scrollView2 = useInstance(
    () =>
      new ScrollViewCore({
        os: app.env,
      })
  );

  const [profile, setProfile] = useState(tv.profile);
  const [curSource, setCurSource] = useState(tv.curSource);
  const [subtileState, setCurSubtitleState] = useState(tv.subtitle);
  const [shareLink, setShareLink] = useState("");
  const [curReportValue, setCurReportValue] = useState(curReport.value);
  const [rate, setRate] = useState(1);

  useInitialize(() => {
    console.log("[PAGE]play - useInitialize");
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
        console.log("[PAGE]tv/play - app.onOrientationChange", tv.curSource?.width, tv.curSource?.height);
        if (tv.curSource) {
          player.setSize({ width: tv.curSource.width, height: tv.curSource.height });
        }
      }
    });
    view.onHidden(() => {
      player.pause();
    });
    // if (!view.query.hide_menu) {
    //   scrollView.onPullToBack(() => {
    //     history.back();
    //   });
    // }
    player.onExitFullscreen(() => {
      player.pause();
      if (tv.curSource) {
        player.setSize({ width: tv.curSource.width, height: tv.curSource.height });
      }
      if (app.orientation === OrientationTypes.Vertical) {
        player.disableFullscreen();
      }
    });
    tv.onProfileLoaded((profile) => {
      app.setTitle(tv.getTitle().join(" - "));
      const { curEpisode } = profile;
      // console.log("[PAGE]play - tv.onProfileLoaded", curEpisode.name);
      tv.playEpisode(curEpisode, { currentTime: curEpisode.currentTime, thumbnail: curEpisode.thumbnail });
      player.setCurrentTime(curEpisode.currentTime);
      bottomOperation.show();
    });
    tv.onSubtitleLoaded((subtitle) => {
      player.showSubtitle(createVVTSubtitle(subtitle));
    });
    tv.onEpisodeChange((nextEpisode) => {
      app.setTitle(tv.getTitle().join(" - "));
      const { currentTime, thumbnail } = nextEpisode;
      nextEpisodeLoader.hide();
      player.setCurrentTime(currentTime);
      player.setPoster(thumbnail);
      player.pause();
    });
    tv.onStateChange((nextProfile) => {
      setProfile(nextProfile);
    });
    tv.onSubtitleChange((l) => {
      setCurSubtitleState(l);
    });
    tv.onTip((msg) => {
      app.tip(msg);
    });
    tv.onBeforeNextEpisode(() => {
      player.pause();
    });
    tv.onResolutionChange(({ type }) => {
      console.log("[PAGE]play - player.onResolutionChange", type);
      // storage.merge("player_settings", {
      //   type,
      // });
    });
    tv.onSourceChange((mediaSource) => {
      console.log("[PAGE]play - tv.onSourceChange", mediaSource.currentTime);
      player.pause();
      player.setSize({ width: mediaSource.width, height: mediaSource.height });
      // loadSource 后开始 video loadstart 事件
      player.loadSource(mediaSource);
      setCurSource(mediaSource);
    });
    player.onReady(() => {
      player.disableFullscreen();
    });
    player.onCanPlay(() => {
      const { currentTime } = tv;
      console.log("[PAGE]play - player.onCanPlay", player.hasPlayed, view.state.visible, currentTime);
      if (!view.state.visible) {
        return;
      }
      function applySettings() {
        player.setCurrentTime(currentTime);
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
    player.onVolumeChange(({ volume }) => {
      storage.merge("player_settings", {
        volume,
      });
    });
    player.onRateChange(({ rate }) => {
      console.log("[PAGE]TVPlaying - onRateChange", rate);
      setRate(rate);
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
    player.onEnd(() => {
      console.log("[PAGE]play - player.onEnd");
      tv.playNextEpisode();
    });
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
      episodesSheet.hide();
      sourcesSheet.hide();
      resolutionSheet.hide();
    });
    // console.log("[PAGE]play - before player.onError");
    player.onError((error) => {
      console.log("[PAGE]play - player.onError", error);
      // router.replaceSilently(`/out_players?token=${token}&tv_id=${view.params.id}`);
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
    if (view.query.hide_menu) {
      setTimeout(() => {
        topOperation.hide();
        bottomOperation.hide();
      }, 1000);
    }
    tv.fetchProfile(view.query.id || view.query.tv_id, {
      season_id: view.query.season_id,
    });
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
      <ScrollView store={scrollView} className="fixed">
        <div className="h-screen">
          <div className="operations text-w-fg-1">
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
                  {!view.query.hide_menu && (
                    <div
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <div
                        className="inline-block p-4"
                        onClick={() => {
                          history.back();
                        }}
                      >
                        <ArrowLeft className="w-6 h-6" />
                      </div>
                    </div>
                  )}
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
                    className=""
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <div className="flex justify-between px-8 mt-18">
                      <div
                        className="flex flex-col items-center"
                        onClick={async () => {
                          tv.playPrevEpisode();
                        }}
                      >
                        <ArrowBigLeft className="w-8 h-8" />
                        <p className="mt-2 text-sm">上一集</p>
                      </div>
                      <ToggleOverlay className="w-12 h-16" store={nextEpisodeLoader}>
                        <div
                          className="flex flex-col items-center"
                          onClick={async () => {
                            nextEpisodeLoader.show();
                            await tv.playNextEpisode();
                            nextEpisodeLoader.hide();
                          }}
                        >
                          <ArrowBigRight className="w-8 h-8 " />
                          <p className="mt-2 text-sm ">下一集</p>
                        </div>
                      </ToggleOverlay>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-12 w-full px-2">
                      <div
                        className="flex flex-col items-center"
                        onClick={() => {
                          episodesSheet.show();
                        }}
                      >
                        <div className="p-4 rounded-md bg-w-bg-2">
                          <List className="w-6 h-6 " />
                        </div>
                        <p className="mt-2 text-sm ">选集</p>
                      </div>
                      <div
                        className="flex flex-col items-center"
                        onClick={() => {
                          sourcesSheet.show();
                        }}
                      >
                        <div className="p-4 rounded-md bg-w-bg-2">
                          <Wand2 className="w-6 h-6" />
                        </div>
                        <p className="mt-2 text-sm">切换源</p>
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
                          dSheet.show();
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
          <div className="video z-20 absolute top-[12%]">
            {(() => {
              if (profile === null || profile.curEpisode === null) {
                return null;
              }
              return (
                <div className="">
                  <Video store={player} />
                  {/* <div className="flex justify-between">
                    <span></span>
                    <span
                      className="inline p-4"
                      onClick={() => {
                        player.requestFullScreen();
                      }}
                    >
                      <Maximize className="w-4 h-4" />
                    </span>
                  </div> */}
                  {/* {subtileState.visible ? (
                    <div key={subtileState.index} className="mt-2 space-y-1">
                      {subtileState.texts.map((text) => {
                        return (
                          <div key={text} className="text-center text-lg">
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
      <Sheet store={episodesSheet} className="" size="lg">
        {(() => {
          if (profile === null) {
            return <div>Loading</div>;
          }
          const { seasons, curEpisodes } = profile;
          const episodes_elm = (
            <ListView className="" store={tv.$episodeList}>
              {curEpisodes.map((episode) => {
                const { id, name, episode_text, runtime } = episode;
                return (
                  <div
                    key={id}
                    onClick={async () => {
                      loadingPresence.show();
                      await tv.switchEpisode(episode);
                      loadingPresence.hide();
                    }}
                  >
                    <div className={cn("p-4 cursor-pointer", profile.curEpisode.id === id ? "bg-w-bg-active" : "")}>
                      <div>
                        {episode_text}
                        {runtime ? <span className="text-sm">({runtime})</span> : null}
                      </div>
                      {/* <div className="text-sm">{overview}</div> */}
                    </div>
                  </div>
                );
              })}
            </ListView>
          );
          if (seasons.length === 1) {
            return (
              <ScrollView store={episodeScrollView} className="top-14 fixed">
                {episodes_elm}
              </ScrollView>
            );
          }
          return (
            <div className="relative box-border h-full safe-bottom">
              {/* <Tabs defaultValue="episode" className="h-full">
                <TabsList className="absolute top-[-50px] left-4 z-10">
                  <TabsTrigger value="episode">集</TabsTrigger>
                  <TabsTrigger value="season">季</TabsTrigger>
                </TabsList>
                <TabsContent className="border-0 h-full" value="episode">
                  <ScrollView contentClassName="pb-24" wrapClassName="top-12" store={episodeScrollView}>
                    {episodes_elm}
                  </ScrollView>
                </TabsContent>
                <TabsContent className="border-0 h-full" value="season">
                  <div className="max-h-full overflow-y-auto pb-16">
                    <div className="pt-4 pb-24">
                      {seasons.map((season) => {
                        const { id, name } = season;
                        return (
                          <div
                            key={id}
                            className={cn("p-4 cursor-pointer", profile.curSeason.id === id ? "bg-w-bg-active" : "")}
                            onClick={() => {
                              tv.fetchEpisodesOfSeason(season);
                            }}
                          >
                            <div>{name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
              </Tabs> */}
            </div>
          );
        })()}
        <Presence store={loadingPresence}>
          <div className="absolute inset-0 flex items-center justify-center bg-w-bg-0 opacity-60">
            <Loader className="w-10 h-10 animate animate-spin" />
          </div>
        </Presence>
      </Sheet>
      <Sheet store={sourcesSheet}>
        {(() => {
          if (profile === null) {
            return <div>Loading</div>;
          }
          const { curEpisode } = profile;
          return (
            <div className="max-h-full overflow-y-auto text-w-fg-1">
              <div className="pt-4 pb-24">
                {curEpisode.sources.map((s) => {
                  const { id, file_id, file_name, parent_paths } = s;
                  return (
                    <div
                      key={id}
                      onClick={async () => {
                        loadingPresence.show();
                        await tv.changeSource(s);
                        loadingPresence.hide();
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
        <Presence store={loadingPresence}>
          <div className="absolute inset-0 flex items-center justify-center bg-w-bg-0 opacity-60">
            <Loader className="w-10 h-10 animate animate-spin" />
          </div>
        </Presence>
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
                    storage.merge("player_settings", {
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
            return <div>Loading</div>;
          }
          const { typeText: curTypeText, resolutions } = curSource;
          return (
            <div className="max-h-full text-w-fg-1 overflow-y-auto">
              <div className="pt-4 pb-24">
                {resolutions.map((r, i) => {
                  const { type, typeText } = r;
                  return (
                    <div key={i}>
                      <div
                        className={cn("p-4 cursor-pointer", curTypeText === typeText ? "bg-w-bg-active" : "")}
                        onClick={() => {
                          tv.changeResolution(type);
                          // storage.merge("player_settings", {
                          //   type,
                          // });
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
      <Sheet store={dSheet} size="xl">
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
            <ScrollView store={scrollView2} className="top-14 fixed">
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
                    </div>
                  </div>
                </div>
              </div>
            </ScrollView>
          );
        })()}
      </Sheet>
      <Sheet store={reportSheet}>
        <div className="max-h-full text-w-fg-1 overflow-y-auto">
          <div className="pt-4 pb-24">
            {SeasonReportList.map((question, i) => {
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
      <Dialog store={reportConfirmDialog}>
        <div className="text-w-fg-1">
          <p>提交你发现的该电视剧的问题</p>
          <p className="mt-2">「{curReportValue}」</p>
        </div>
      </Dialog>
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
      </Dialog> */}
      <Dialog store={fullscreenDialog}>
        <div className="text-w-fg-1">点击进入全屏播放</div>
      </Dialog>
      <Dialog store={shareLinkDialog}>
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
      </Dialog>
    </>
  );
});
