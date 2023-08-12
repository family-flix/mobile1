import { describe, it, expect, vi } from "vitest";
import { parseSubtitleContent, parseSubtitleUrl, srtTimeToSeconds } from "../utils";
import { SubtitleCore } from "..";

const subtitleContent = `WEBVTT
00:00.917 --> 00:04.462
當初

00:12.053 --> 00:14.305
真不該放招牌

00:15.098 --> 00:17.892
我們到底在想什麼?

00:23.898 --> 00:25.817
是我們引他們來的

00:30.864 --> 00:32.407
我們試著做好事

00:33.450 --> 00:35.910
畢竟我們是人

00:35.994 --> 00:38.079
那現在呢,格瑞斯?

00:53.428 --> 00:57.015
現在

00:57.098 --> 00:59.559
他們似乎很親切
可是我準備走了

01:00.602 --> 01:02.145
我們才剛到這裡

01:02.228 --> 01:04.731
不過,真是的,是該走了

01:05.565 --> 01:07.609
就在我告訴他們華府的事時

01:07.692 --> 01:10.195
當家的混蛋眨眼示意

01:10.278 --> 01:11.321
大夥就掏出槍

01:11.404 --> 01:14.282
立刻引發一場激戰

01:15.241 --> 01:18.912
你們被關進這裡前
有沒有見過泰瑞斯?

01:18.995 --> 01:20.413
-沒有
-很好

01:21.039 --> 01:23.708
漆著白十字架的黑色車

01:23.792 --> 01:25.960
我拼命地追,我盡力了

01:26.461 --> 01:28.755
-她還活著?
-她還活著

01:42.060 --> 01:43.103
在那邊

01:45.730 --> 01:47.107
閉嘴!

01:47.190 --> 01:48.483
好了

01:48.566 --> 01:51.111
有四名混蛋朝我們這邊來了

01:54.030 --> 01:55.490
你們都知道怎麼做
`;
const subtitleLanguage = "chi";
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
      const paragraphs = parseSubtitleContent(subtitleContent, suffix);
      const store = new SubtitleCore({
        language: subtitleLanguage,
        suffix,
        lines: paragraphs,
      });
      const fn = vi.fn();
      store.onStateChange(fn);
      await play({
        duration: 2 * 1000,
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
            start: "00:00.917",
            end: "00:04.462",
            texts: ["當初"],
          },
        },
      ]);
      expect(fn.mock.calls[0]).toStrictEqual([
        {
          curLine: {
            line: "1",
            start: "00:12.053",
            end: "00:14.305",
            texts: ["真不該放招牌"],
          },
        },
      ]);
      expect(fn.mock.calls[0]).toStrictEqual([
        {
          curLine: {
            line: "2",
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

describe("字幕时间转秒数", () => {
  it("小于1秒", () => {
    const t = "00:00.917";
    const r = srtTimeToSeconds(t);
    expect(r).toBe(0.917);
  });
  it("小于1分钟", () => {
    const t = "00:04.462";
    const r = srtTimeToSeconds(t);
    expect(r).toBe(4.462);
  });
});
