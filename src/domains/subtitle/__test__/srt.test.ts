import { describe, it, expect, vi } from "vitest";

import { SubtitleCore } from "..";
import { parseSubtitleContent, parseSubtitleUrl } from "../utils";
import { srtSubtitleContent1 } from "./mock";
import { MediaOriginCountry } from "@/constants";

const subtitleLanguage = [MediaOriginCountry.CN];
const subtitleUrl = "BITCH.X.RICH.S01E01.1080p.WEB-DL.AAC2.0.H.264-Taengoo.FRIDAY.CHS.SRT";

/**
 * 模拟视频播放
 */
function play(props: { duration: number; onCurrentTime: (time: number) => void; onFinish: () => void }) {
  const { duration, onCurrentTime, onFinish } = props;
  let currentTime = 0;
  const start = new Date();
  let timer: null | NodeJS.Timeout = null;
  return new Promise((resolve) => {
    function run() {
      timer = setTimeout(() => {
        const cur = new Date().valueOf();
        currentTime = cur - start.valueOf();
        if (currentTime >= duration) {
          onFinish();
          if (timer) {
            clearTimeout(timer);
          }
          resolve(currentTime);
          return;
        }
        onCurrentTime(currentTime);
        run();
      }, 100);
    }
    onCurrentTime(currentTime);
    run();
  });
}

describe("播放视频时正确展示字幕", () => {
  it(
    "初始状态从 0 开始播放",
    async () => {
      const suffix = parseSubtitleUrl(subtitleUrl);
      const paragraphs = parseSubtitleContent(srtSubtitleContent1, suffix);
      const store = new SubtitleCore({
        filename: subtitleLanguage.join("&"),
        language: subtitleLanguage,
        suffix,
        lines: paragraphs,
      });
      const fn = vi.fn();
      store.onStateChange((state) => {
        if (state.curLine) {
          fn(state);
        }
      });
      await play({
        duration: 15 * 1000,
        onCurrentTime(time) {
          store.handleTimeChange(time / 1000);
        },
        onFinish() {},
      });
      expect(fn).toBeCalledTimes(3);
      expect(fn.mock.calls[0]).toStrictEqual([
        {
          curLine: {
            line: "0",
            start: "00:00:02.300",
            end: "00:00:05.167",
            startTime: 2.3,
            endTime: 5.167,
            texts: ["李恩泉 饰金惠仁"],
          },
        },
      ]);
      expect(fn.mock.calls[1]).toStrictEqual([
        {
          curLine: {
            line: "1",
            start: "00:00:06.433",
            end: "00:00:08.967",
            startTime: 6.433,
            endTime: 8.967,
            texts: ["金艺琳 饰白济娜 李锺赫 饰徐道言"],
          },
        },
      ]);
      expect(fn.mock.calls[2]).toStrictEqual([
        {
          curLine: {
            line: "2",
            start: "00:00:10.567",
            end: "00:00:13.333",
            startTime: 10.567,
            endTime: 13.333,
            texts: ["柳政厚 饰李愿望 韩多瑟 饰吴时恩"],
          },
        },
      ]);
    },
    30 * 1000
  );

  //   it("从 01:20 开始播放", () => {
  //     const suffix = parseSubtitleUrl(subtitleUrl);
  //     const paragraphs = parseSubtitleContent(subtitleContent, suffix);
  //     const store = new SubtitleCore({
  //       language: subtitleLanguage,
  //       suffix,
  //       lines: paragraphs,
  //     });
  //   });

  //   it("播放中途快进到另一个时间", () => {
  //     const suffix = parseSubtitleUrl(subtitleUrl);
  //     const paragraphs = parseSubtitleContent(subtitleContent, suffix);
  //     const store = new SubtitleCore({
  //       language: subtitleLanguage,
  //       suffix,
  //       lines: paragraphs,
  //     });
  //   });
});
