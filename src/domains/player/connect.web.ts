import { PlayerCore } from ".";

/** 连接 $video 标签和 player 领域 */
export function connect($video: HTMLVideoElement, player: PlayerCore) {
  $video.onloadstart = () => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.onloadstart");
  };
  $video.onloadedmetadata = (event) => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.onloadedmetadata");
    player.emit(PlayerCore.Events.SourceLoaded);
  };
  $video.onload = () => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.onload");
    player.emit(PlayerCore.Events.Loaded);
  };
  // 这个居然会在调整时间进度后调用？？？
  $video.oncanplay = (event) => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.oncanplay");
    // const { duration } = event.currentTarget as HTMLVideoElement;
    // console.log("[COMPONENT]VideoPlayer/connect - listen $video can play");
    player.emit(PlayerCore.Events.CanPlay);
  };
  $video.onplay = () => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.onplay");
    player.emit(PlayerCore.Events.Play);
  };
  $video.onplaying = () => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.onplaying");
  };
  $video.ontimeupdate = (event) => {
    const { currentTime, duration } = event.currentTarget as HTMLVideoElement;
    //     console.log(
    //       "[COMPONENT]VideoPlayer/connect - $video.ontimeupdate",
    //       currentTime,
    //       duration
    //     );
    player.emitTimeUpdate({ currentTime, duration });
  };
  $video.onpause = (event) => {
    const { currentTime, duration } = event.currentTarget as HTMLVideoElement;
    console.log("[COMPONENT]VideoPlayer/connect - $video.onpause");
    player.emit(PlayerCore.Events.Pause, { currentTime, duration });
  };
  $video.onwaiting = () => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.onwaiting");
    //     player.emitEnded();
  };
  $video.onended = () => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.onended");
    player.end();
  };
  $video.onvolumechange = (event) => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.onvolumechange");
    const { volume } = event.currentTarget as HTMLVideoElement;
    const cur_volume = volume;
    player.emit(PlayerCore.Events.VolumeChange, { volume: cur_volume });
  };
  $video.onerror = () => {
    console.log("[COMPONENT]VideoPlayer/connect - $video.onerror");
  };

  player.bindAbstractNode({
    async play() {
      try {
        await $video.play();
      } catch (err) {
        // ...
      }
    },
    pause() {
      $video.pause();
    },
    changeCurrentTime(currentTime: number) {
      $video.currentTime = currentTime;
    },
    changeVolume(volume: number) {
      $video.volume = volume;
    },
  });
}
