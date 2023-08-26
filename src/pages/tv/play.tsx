/**
 * @file 电视剧播放页面
 */
import { useRef, useState } from "react";
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
  Subtitles,
  Wand2,
} from "lucide-react";

import { Dialog, Sheet, ScrollView, ListView, Video } from "@/components/ui";
import { ScrollViewCore, DialogCore, ToggleCore } from "@/domains/ui";
import { TVCore } from "@/domains/tv";
import { EpisodeResolutionTypes } from "@/domains/tv/constants";
import { RequestCore } from "@/domains/request";
import { SelectionCore } from "@/domains/cur";
import { PlayerCore } from "@/domains/player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ElementCore } from "@/domains/ui/element";
import { connect } from "@/domains/player/connect.web";
import { useInitialize, useInstance } from "@/hooks";
import { ViewComponent } from "@/types";
import { reportSomething } from "@/services";
import { ReportTypes, TVReportList } from "@/constants";
import { rootView } from "@/store";
import { cn } from "@/utils";

export const TVPlayingPage: ViewComponent = (props) => {
  const { app, view } = props;

  const videoRef = useRef<HTMLVideoElement>(null);

  const scrollView = useInstance(
    () =>
      new ScrollViewCore({
        onPullToBack() {
          rootView.uncoverPrevView();
        },
      })
  );
  const tv = useInstance(() => {
    const { type: resolution } = app.cache.get<{
      type: EpisodeResolutionTypes;
    }>("player_settings", {
      type: "SD",
    });
    const tv = new TVCore({
      resolution,
    });
    // @ts-ignore
    window.__tv__ = tv;
    return tv;
  });
  const player = useInstance(() => {
    const { volume } = app.cache.get<{
      volume: number;
    }>("player_settings", {
      volume: 0.5,
    });
    const player = new PlayerCore({ app, volume });
    // @ts-ignore
    window.__player__ = player;
    return player;
  });
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
  const video = useInstance(() => new ElementCore({}));
  const episodesSheet = useInstance(() => new DialogCore());
  const sourcesSheet = useInstance(() => new DialogCore());
  const bSheet = useInstance(() => new DialogCore());
  const cSheet = useInstance(() => new DialogCore());
  const dSheet = useInstance(() => new DialogCore());
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
            type: ReportTypes.TV,
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
        async onPullToRefresh() {
          await tv.episodeList.refresh();
          episodeScrollView.stopPullToRefresh();
        },
        onReachBottom() {
          tv.episodeList.loadMore();
        },
      })
  );
  const [profile, setProfile] = useState(tv.profile);
  const [curSource, setCurSource] = useState(tv.curSource);
  const [subtileState, setCurSubtitleState] = useState(tv.subtitle);
  const [curReportValue, setCurReportValue] = useState(curReport.value);

  useInitialize(() => {
    console.log("[PAGE]play - useInitialize");
    app.onHidden(() => {
      player.pause();
      // tv.updatePlayProgress();
    });
    app.onShow(() => {
      console.log("[PAGE]play - app.onShow", player.currentTime);
      // 锁屏后 currentTime 不是锁屏前的
      player.setCurrentTime(player.currentTime);
    });
    view.onHidden(() => {
      player.pause();
      // tv.updatePlayProgress();
    });
    // view.onUnmounted(() => {
    //   player.destroy();
    // });
    video.onMounted(() => {
      connect(videoRef.current!, player);
    });
    tv.onProfileLoaded((profile) => {
      app.setTitle(tv.getTitle().join(" - "));
      const { curEpisode } = profile;
      // console.log("[PAGE]play - tv.onProfileLoaded", curEpisode.name);
      tv.playEpisode(curEpisode, { currentTime: curEpisode.currentTime, thumbnail: curEpisode.thumbnail });
      player.setCurrentTime(curEpisode.currentTime);
    });
    tv.onEpisodeChange((nextEpisode) => {
      app.setTitle(tv.getTitle().join(" - "));
      const { currentTime, thumbnail } = nextEpisode;
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
    tv.onSourceChange((mediaSource) => {
      console.log("[PAGE]play - tv.onSourceChange", mediaSource.currentTime);
      player.pause();
      player.setSize({ width: mediaSource.width, height: mediaSource.height });
      player.loadSource(mediaSource);
      player.setCurrentTime(mediaSource.currentTime);
      setCurSource(mediaSource);
    });
    player.onCanPlay(() => {
      if (!view.state.visible) {
        return;
      }
      // console.log("[PAGE]play - player.onCanPlay");
      cover.hide();
      if (!tv.canAutoPlay) {
        return;
      }
      player.play();
      tv.canAutoPlay = false;
    });
    player.onVolumeChange(({ volume }) => {
      app.cache.merge("player_settings", {
        volume,
      });
    });
    player.onProgress(({ currentTime, duration }) => {
      // console.log("[PAGE]TVPlaying - onProgress", currentTime);
      tv.setCurrentTime(currentTime);
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
    player.onVolumeChange(({ volume }) => {
      console.log("[PAGE]play - player.onVolumeChange", volume);
    });
    player.onSizeChange(({ height }) => {
      console.log("[PAGE]play - player.onSizeChange");
    });
    player.onResolutionChange(({ type }) => {
      console.log("[PAGE]play - player.onResolutionChange", type);
      player.setCurrentTime(tv.currentTime);
    });
    tv.onResolutionChange(({ type }) => {
      console.log("[PAGE]play - player.onResolutionChange", type);
      app.cache.merge("player_settings", {
        type,
      });
    });
    // tv.onBeforeChangeSource(() => {
    //   player.pause();
    // });
    player.onSourceLoaded(() => {
      console.log("[PAGE]play - player.onSourceLoaded", tv.currentTime);
      if (!tv.canAutoPlay) {
        return;
      }
      episodesSheet.hide();
      sourcesSheet.hide();
      cSheet.hide();
    });
    // console.log("[PAGE]play - before player.onError");
    player.onError((error) => {
      console.log("[PAGE]play - player.onError", error);
      // const token = "lg9lT9e03WPcmBn";
      // router.replaceSilently(`/out_players?token=${token}&tv_id=${view.params.id}`);
      // app.tip({ text: ["视频加载错误", error.message] });
      errorTipDialog.show();
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
    // console.log(view.query);
    tv.fetchProfile(view.params.id, {
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
      <ScrollView store={scrollView} className="fixed dark:text-black-200">
        <div className="h-screen">
          <div className="operations">
            {/* <div
                className={cn(
                  show_menus ? "hidden" : "block",
                  "absolute inset-0"
                )}
                onClick={toggleMenuVisible}
              /> */}
            <div
              className={cn(
                // show_menus ? "block" : "hidden",
                "z-10 absolute inset-0"
              )}
              // onClick={toggleMenuVisible}
            >
              <div className="flex items-center justify-between">
                <div
                  className="inline-block p-4"
                  onClick={() => {
                    rootView.uncoverPrevView();
                    // rootView.curView?.hide();
                    // rootView.prevView?.show();
                    // rootView.curView = rootView.prevView;
                    // rootView.prevView = null;
                  }}
                >
                  <ArrowLeft className="w-6 h-6 dark:text-black-200" />
                </div>
              </div>
              <div className="absolute bottom-12 w-full safe-bottom">
                {/* <div className="flex items-center w-36 m-auto">
                      <p className="text-2xl ">
                        {values.target_time}
                      </p>
                      <p className="mx-2 text-2xl ">
                        /
                      </p>
                      <p className="text-2xl ">
                        {values.duration}
                      </p>
                    </div> */}
                {/* <div
                      className="flex items-center mt-4 px-4"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <p className="mr-2 ">
                        {values.current_time}
                      </p>
                      <Slider
                        className=""
                        value={[target_progress]}
                        step={1}
                        max={100}
                        onValueChange={(v) => {
                          set_target_progress(v[0]);
                          player_ref.current.set_target_progress(v[0]);
                        }}
                        onValueCommit={() => {
                          player_ref.current.commit_target_progress();
                          hide_menus();
                        }}
                      />
                      <p className="ml-4 ">
                        {values.duration}
                      </p>
                    </div> */}
                <div className="grid grid-cols-3 gap-4 mt-18">
                  <div
                    className="flex flex-col items-center dark:text-black-200"
                    onClick={async () => {
                      tv.playPrevEpisode();
                    }}
                  >
                    <ArrowBigLeft className="w-8 h-8" />
                    <p className="mt-2 text-sm">上一集</p>
                  </div>
                  <div className="flex flex-col items-center"></div>
                  <div
                    className="flex flex-col items-center dark:text-black-200"
                    onClick={() => {
                      tv.playNextEpisode();
                    }}
                  >
                    <ArrowBigRight className="w-8 h-8 " />
                    <p className="mt-2 text-sm ">下一集</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mt-12 w-full px-2">
                  <div
                    className="flex flex-col items-center dark:text-black-200"
                    onClick={() => {
                      episodesSheet.show();
                    }}
                  >
                    <List className="w-6 h-6 " />
                    <p className="mt-2 text-sm ">选集</p>
                  </div>
                  <div
                    className="flex flex-col items-center dark:text-black-200"
                    onClick={() => {
                      sourcesSheet.show();
                    }}
                  >
                    <Wand2 className="w-6 h-6 " />
                    <p className="mt-2 text-sm ">切换源</p>
                  </div>
                  <div
                    className="flex flex-col items-center dark:text-black-200"
                    onClick={() => {
                      bSheet.show();
                    }}
                  >
                    <Gauge className="w-6 h-6 " />
                    <p className="mt-2 text-sm ">倍速</p>
                  </div>
                  <div
                    className="flex flex-col items-center dark:text-black-200"
                    onClick={() => {
                      cSheet.show();
                    }}
                  >
                    <Glasses className="w-6 h-6 " />
                    <p className="mt-2 text-sm ">分辨率</p>
                  </div>
                  <div
                    className="flex flex-col items-center dark:text-black-200 focus:outline-none focus:ring-0"
                    onClick={() => {
                      dSheet.show();
                    }}
                  >
                    <MoreHorizontal className="w-6 h-6 " />
                    <p className="mt-2 text-sm ">更多</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="video z-20 absolute top-[20%]">
            {(() => {
              if (profile === null || profile.curEpisode === null) {
                return null;
              }
              return (
                <div className="">
                  {/* <ToggleView store={cover}>
                      <Show when={!!profile.curEpisode.thumbnail}>
                        <LazyImage
                          className="absolute left-0 top-0 z-20"
                          src={profile.curEpisode.thumbnail ?? undefined}
                          alt={profile.name}
                        />
                      </Show>
                      <div className="center z-30 top-20">
                        <Loader className="inline-block w-8 h-8 text-white animate-spin" />
                      </div>
                    </ToggleView> */}
                  <Video store={player} />
                  {!subtileState.visible ? (
                    <div key={subtileState.index} className="mt-2 space-y-1">
                      {subtileState.texts.map((text) => {
                        return (
                          <div key={text} className="text-center text-lg">
                            {text}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })()}
            {/* <div className={cn("absolute inset-0")}>
                  <div
                    className={cn(
                      show_menus ? "hidden" : "block",
                      "absolute inset-0"
                    )}
                    onClick={toggle_menu_visible}
                  />
                  <div
                    className={cn(
                      show_menus ? "block" : "hidden",
                      "absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]"
                    )}
                    onClick={toggle_menu_visible}
                  >
                    {values.playing ? (
                      <div className="p4">
                        <Pause
                          className="w-16 h-16 "
                          onClick={async () => {
                            await player_ref.current.pause();
                            set_values(player_ref.current.values);
                            toggle_menu_visible();
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="absolute p-2 z-10 inset-0 rounded-full bg-black opacity-50" />
                        <Play
                          className="relative z-20 left-1 w-16 h-16 "
                          onClick={async () => {
                            await player_ref.current.play();
                            set_values(player_ref.current.values);
                            set_show_menus(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div> */}
          </div>
        </div>
      </ScrollView>
      <Sheet store={episodesSheet} className="">
        {(() => {
          if (profile === null) {
            return <div>Loading</div>;
          }
          const { seasons, curEpisodes } = profile;
          const episodes_elm = (
            <ListView className="pb-24" store={tv.episodeList}>
              {curEpisodes.map((episode) => {
                const { id, name, episode_text, runtime } = episode;
                return (
                  <div
                    key={id}
                    onClick={() => {
                      tv.canAutoPlay = true;
                      tv.playEpisode(episode, { currentTime: 0, thumbnail: null });
                    }}
                  >
                    <div
                      className={cn("p-4 rounded cursor-pointer", profile.curEpisode.id === id ? "bg-slate-500" : "")}
                    >
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
              <ScrollView store={episodeScrollView} className="top-14 fixed dark:text-black-200">
                {episodes_elm}
              </ScrollView>
            );
          }
          return (
            <div className="relative box-border h-full safe-bottom dark:text-black-200">
              <Tabs defaultValue="episode" className="">
                <TabsList className="absolute top-[-50px] left-4 z-10">
                  <TabsTrigger value="episode">集</TabsTrigger>
                  <TabsTrigger value="season">季</TabsTrigger>
                </TabsList>
                <TabsContent className="pt-8 border-0" value="episode">
                  <ScrollView wrapClassName="top-12" store={episodeScrollView}>
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
                            className={cn(
                              "p-4 rounded cursor-pointer",
                              profile.curSeason.id === id ? "bg-slate-500" : ""
                            )}
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
              </Tabs>
            </div>
          );
        })()}
      </Sheet>
      <Sheet store={sourcesSheet}>
        {(() => {
          if (profile === null) {
            return <div>Loading</div>;
          }
          const { curEpisode } = profile;
          return (
            <div className="max-h-full overflow-y-auto">
              <div className="pt-4 pb-24 dark:text-black-200">
                {curEpisode.sources.map((s) => {
                  const { id, file_id, file_name, parent_paths } = s;
                  return (
                    <div
                      key={id}
                      onClick={() => {
                        tv.changeSource(s);
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
      <Sheet store={bSheet}>
        <div className="dark:text-black-200">
          <p className="mt-8 text-center text-sm ">敬请期待</p>
          {/* {players.map((p) => {
          const { name, icon, scheme } = p;
          return (
            <a className="block py-2" href={`vlc://${source?.url}`}>
              {name}
              {`vlc://${source?.url}`}
            </a>
          );
        })} */}
        </div>
      </Sheet>
      <Sheet store={cSheet}>
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
                          tv.changeResolution(type);
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
      <Sheet store={dSheet}>
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
                    let node = null;
                    if (!subtileState.visible) {
                      node = <div>隐藏字幕</div>;
                    }
                    if (subtileState.visible) {
                      node = <div>显示字幕</div>;
                    }
                    if (!subtileState.enabled) {
                      node = null;
                    }
                    if (node === null) {
                      return null;
                    }
                    return (
                      <div
                        className="mt-2 flex items-center"
                        onClick={() => {
                          if (subtileState.visible) {
                            tv.showSubtitle();
                            return;
                          }
                          tv.hideSubtitle();
                        }}
                      >
                        <Subtitles className="mr-2 w-4 h-4" />
                        <div className="text-sm">{node}</div>
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
            {TVReportList.map((question, i) => {
              return (
                <div
                  key={i}
                  onClick={() => {
                    curReport.select(question);
                    reportConfirmDialog.show();
                  }}
                >
                  <div className={cn("py-2 px-4 rounded cursor-pointer")} onClick={() => {}}>
                    {question}
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
