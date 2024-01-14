import { describe, it, expect, vi } from "vitest";

import { SubtitleCore } from "..";
import { parseSubtitleContent, parseSubtitleUrl } from "../utils";

import { assSubtitleContent1 } from "./mock";
import { MediaOriginCountry } from "@/constants";

const subtitleLanguage = [MediaOriginCountry.TW];
const subtitleUrl = "Reply.1988.E01.720p.HDTV.x264-AREA11.chs.ass";

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
      const paragraphs = parseSubtitleContent(assSubtitleContent1, suffix);
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
        duration: 28 * 1000,
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
            startTime: 17.6,
            endTime: 19.6,
            start: "0:00:17.60",
            end: "0:00:19.60",
            texts: ["1988年"],
          },
        },
      ]);
      expect(fn.mock.calls[1]).toStrictEqual([
        {
          curLine: {
            line: "1",
            startTime: 24.54,
            endTime: 26.47,
            start: "0:00:24.54",
            end: "0:00:26.47",
            texts: ["虽然有冷战"],
          },
        },
      ]);
      expect(fn.mock.calls[2]).toStrictEqual([
        {
          curLine: {
            line: "2",
            startTime: 26.47,
            endTime: 28.21,
            start: "0:00:26.47",
            end: "0:00:28.21",
            texts: ["但内心火热"],
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
