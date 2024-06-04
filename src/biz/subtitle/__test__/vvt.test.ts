import { describe, it, expect, vi } from "vitest";

import { SubtitleCore } from "..";
import { parseSubtitleContent, parseSubtitleUrl, timeStrToSeconds } from "../utils";

import { vvtSubtitleContent } from "./mock";
import { MediaOriginCountry } from "@/constants";

const subtitleLanguage = [MediaOriginCountry.CN];
const subtitleUrl =
  "https://ccp-bj29-video-preview.oss-enet.aliyuncs.com/lt/C8EEB2891EFF9D4011661F823C7ED63C8CA1BF09_2760902328__sha1_bj29/subtitle/chi_0.vtt?di=bj29";

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
      const paragraphs = parseSubtitleContent(vvtSubtitleContent, suffix);
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
        duration: 16 * 1000,
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
            startTime: 0.917,
            endTime: 4.462,
            start: "00:00.917",
            end: "00:04.462",
            texts: ["當初"],
          },
        },
      ]);
      expect(fn.mock.calls[1]).toStrictEqual([
        {
          curLine: {
            line: "1",
            startTime: 12.053,
            endTime: 14.305,
            start: "00:12.053",
            end: "00:14.305",
            texts: ["真不該放招牌"],
          },
        },
      ]);
      expect(fn.mock.calls[2]).toStrictEqual([
        {
          curLine: {
            line: "2",
            startTime: 15.098,
            endTime: 17.892,
            start: "00:15.098",
            end: "00:17.892",
            texts: ["我們到底在想什麼?"],
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
