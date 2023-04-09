/**
 * @file 视频播放页面
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import throttle from "lodash/fp/throttle";
import debounce from "lodash/fp/debounce";
import {
  ArrowBigLeft,
  ArrowBigRight,
  ArrowLeft,
  Gauge,
  Glasses,
  List,
  Loader,
  MoreHorizontal,
  Pause,
  Play,
  RotateCw,
} from "lucide-react";

import { cn, episode_to_chinese_num, season_to_chinese_num } from "@/utils";
import { TV } from "@/domains/tv";
import { Player } from "@/domains/player";
import { Page, Router } from "@/domains/router";
import { useToast } from "@/hooks/use-toast";
import { useInitialize } from "@/hooks";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "@/components/VideoPlayer";

interface IProps {
  router: Router;
  page: Page;
}
export const TVPlayingPage: React.FC<IProps> = (props) => {
  const { router, page } = props;
  const { id: tvId } = router.params as { id: string };

  useInitialize(() => {
    page.onPullToRefresh(() => {
      router.reload();
    });
    page.onHidden(() => {});
  });

  const { toast } = useToast();
  const tvRef = useRef(new TV({ id: tvId }));
  const playerRef = useRef(
    new Player({
      url: "",
      on_change(next_values) {
        // set_values(next_values);
        playerStateRef.current = next_values;
      },
    })
  );
  const [profile, setProfile] = useState<{
    cur_episode: TV["cur_episode"];
    info: TV["info"];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [show_menus, setShowMenus] = useState(true);
  const playerStateRef = useRef(playerRef.current.values);
  const [values, set_values] = useState(playerRef.current.values);
  const [target_progress, set_target_progress] = useState(0);
  const hideMenus = useMemo(() => {
    return debounce(2000, () => {
      if (playerStateRef.current.playing) {
        setShowMenus(false);
      }
    });
  }, []);
  const toggleMenuVisible = useCallback(() => {
    setShowMenus((prev) => {
      const target_visible = !prev;
      if (playerStateRef.current.playing) {
        hideMenus();
      }
      return target_visible;
    });
  }, []);

  console.log("[PAGE]TVPlayingPage - render", tvId);

  useEffect(() => {
    if (!tvId) {
      return;
    }
    (async () => {
      tvRef.current.onErrorNotice = (msg) => {
        toast({
          title: "ERROR",
          description: msg,
        });
      };
      tvRef.current.onNotice = (msg) => {
        // toast({
        //   title: "Info",
        //   description: msg,
        // });
      };
      const res = await tvRef.current.init(tvId);
      if (res.error) {
        setError(res.error.message);
        return;
      }
      const { cur_episode, info } = tvRef.current;
      setProfile({
        cur_episode,
        info,
      });
      if (cur_episode === null || info === null) {
        return;
      }
      page.setTitle(
        `${episode_to_chinese_num(
          cur_episode.episode
        )} - ${season_to_chinese_num(cur_episode.season)} - ${info.name}`
      );
    })();
  }, []);

  const whenVideoPlaying = useMemo(() => {
    return throttle(10 * 1000, ({ current_time, duration }) => {
      tvRef.current.update_play_progress({
        current_time,
        duration,
      });
    });
  }, []);

  if (error) {
    return (
      <div className="w-full h-[100vh]">
        <div className="center text-center">{error}</div>
      </div>
    );
  }
  // console.log(
  //   "[]VideoPlayingPage - render",
  //   profile?.cur_episode,
  //   target_progress
  // );

  return (
    <div className="tv__video">
      {(() => {
        return (
          <>
            <div className="operations overflow-hidden relative ws-screen h-screen">
              <div
                className={cn(
                  show_menus ? "hidden" : "block",
                  "absolute inset-0"
                )}
                onClick={toggleMenuVisible}
              />
              <div
                className={cn(
                  show_menus ? "block" : "hidden",
                  "absolute inset-0"
                )}
                onClick={toggleMenuVisible}
              >
                <div
                  className="p-4"
                  onClick={() => {
                    router.back();
                  }}
                >
                  <ArrowLeft className="w-8 h-8" />
                </div>
                <div className="absolute bottom-12 w-full">
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
                      className="flex flex-col items-center"
                      onClick={async () => {
                        await tvRef.current.play_prev_episode();
                        setProfile({
                          cur_episode: tvRef.current.cur_episode,
                          info: tvRef.current.info,
                        });
                      }}
                    >
                      <ArrowBigLeft className="w-8 h-8" />
                      <p className="mt-2 text-sm">上一集</p>
                    </div>
                    <div className="flex flex-col items-center"></div>
                    <div
                      className="flex flex-col items-center"
                      onClick={async () => {
                        await tvRef.current.play_next_episode();
                        setProfile({
                          cur_episode: tvRef.current.cur_episode,
                          info: tvRef.current.info,
                        });
                      }}
                    >
                      <ArrowBigRight className="w-8 h-8 " />
                      <p className="mt-2 text-sm ">下一集</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-12 w-full px-2">
                    <Sheet>
                      <SheetTrigger>
                        <div className="flex flex-col items-center">
                          <List className="w-6 h-6 " />
                          <p className="mt-2 text-sm ">选集</p>
                        </div>
                      </SheetTrigger>
                      <SheetContent position="bottom" size="lg">
                        {(() => {
                          if (profile === null || profile.info === null) {
                            return <div>Loading</div>;
                          }
                          const { seasons, folders = [] } = profile.info;
                          const episodes_elm = (
                            <div className="">
                              {folders.map((folder) => {
                                const { parent_paths, resolution, episodes } =
                                  folder;
                                return (
                                  <div key={parent_paths}>
                                    <p className="p-4 ">{resolution}</p>
                                    <div className="p-4">
                                      {episodes.map((episode) => {
                                        const {
                                          id,
                                          file_id,
                                          file_name,
                                          episode: e,
                                        } = episode;
                                        return (
                                          <div
                                            key={id}
                                            className={cn(
                                              "p-4 rounded cursor-pointer",
                                              profile?.cur_episode?.file_id ===
                                                file_id
                                                ? "bg-slate-500"
                                                : ""
                                            )}
                                            title={file_name}
                                            onClick={async () => {
                                              await tvRef.current.play_episode(
                                                id
                                              );
                                              setProfile((prev) => {
                                                if (prev === null) {
                                                  return prev;
                                                }
                                                return {
                                                  ...prev,
                                                  cur_episode:
                                                    tvRef.current.cur_episode,
                                                };
                                              });
                                            }}
                                          >
                                            {e}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                          if (seasons.length === 1) {
                            return (
                              <div className="overflow-y-auto mt-8 pb-12 h-full">
                                {episodes_elm}
                              </div>
                            );
                          }
                          return (
                            <Tabs
                              defaultValue="episode"
                              className="w-[400px] overflow-y-auto pb-12 h-full"
                            >
                              <TabsList>
                                <TabsTrigger value="episode">集数</TabsTrigger>
                                <TabsTrigger value="season">季</TabsTrigger>
                              </TabsList>
                              <TabsContent value="episode">
                                {episodes_elm}
                              </TabsContent>
                              <TabsContent value="season">
                                <div className="">
                                  {seasons.map((season) => {
                                    return (
                                      <div
                                        key={season}
                                        className={cn(
                                          "p-4 rounded cursor-pointer",
                                          season === profile.cur_episode?.season
                                            ? "bg-slate-500"
                                            : ""
                                        )}
                                        onClick={async () => {
                                          await tvRef.current.load_episodes_of_special_season(
                                            season
                                          );
                                          setProfile({
                                            cur_episode:
                                              tvRef.current.cur_episode,
                                            info: tvRef.current.info,
                                          });
                                        }}
                                      >
                                        {season}
                                      </div>
                                    );
                                  })}
                                </div>
                              </TabsContent>
                            </Tabs>
                          );
                        })()}
                      </SheetContent>
                    </Sheet>
                    <Sheet>
                      <SheetTrigger>
                        <div className="flex flex-col items-center">
                          <Gauge className="w-6 h-6 " />
                          <p className="mt-2 text-sm ">倍速</p>
                        </div>
                      </SheetTrigger>
                      <SheetContent position="bottom">
                        <p className="mt-8 text-center text-sm ">敬请期待</p>
                      </SheetContent>
                    </Sheet>
                    <Sheet>
                      <SheetTrigger>
                        <div className="flex flex-col items-center">
                          <Glasses className="w-6 h-6 " />
                          <p className="mt-2 text-sm ">分辨率</p>
                        </div>
                      </SheetTrigger>
                      <SheetContent position="bottom">
                        <p className="mt-8 text-center text-sm ">敬请期待</p>
                      </SheetContent>
                    </Sheet>
                    <Sheet>
                      <SheetTrigger>
                        <div className="flex flex-col items-center focus:outline-none focus:ring-0">
                          <MoreHorizontal className="w-6 h-6 " />
                          <p className="mt-2 text-sm ">更多</p>
                        </div>
                      </SheetTrigger>
                      <SheetContent position="bottom">
                        <p className="mt-8 text-center text-sm ">敬请期待</p>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
            </div>
            <div className="video absolute z-20 w-full top-32">
              {(() => {
                if (profile === null || profile.cur_episode === null) {
                  return null;
                }
                const { url, width, height, current_time, thumbnail } =
                  profile.cur_episode;
                return (
                  <VideoPlayer
                    className=""
                    url={url}
                    core={playerRef.current}
                    width={width}
                    height={height}
                    current_time={current_time}
                    poster={thumbnail}
                    on_progress={whenVideoPlaying}
                    on_end={async () => {
                      await tvRef.current.play_next_episode();
                      setProfile({
                        cur_episode: tvRef.current.cur_episode,
                        info: tvRef.current.info,
                      });
                    }}
                  />
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
          </>
        );
      })()}
    </div>
  );
};
