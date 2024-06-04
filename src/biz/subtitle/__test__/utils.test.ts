import { describe, it, expect, vi } from "vitest";

import { parseSubtitleContent, parseSubtitleUrl, timeStrToSeconds } from "../utils";
import { assSubtitleContent1, srtSubtitleContent1, srtSubtitleContent2 } from "./mock";

describe("字幕时间转秒数", () => {
  it("小于1秒", () => {
    const t = "00:00.917";
    const r = timeStrToSeconds(t);
    expect(r).toBe(0.917);
  });
  it("小于1分钟", () => {
    const t = "00:04.462";
    const r = timeStrToSeconds(t);
    expect(r).toBe(4.462);
  });
});

describe("获取字幕类型", () => {
  it("srt", () => {
    const name = "BITCH.X.RICH.S01E01.1080p.WEB-DL.AAC2.0.H.264-Taengoo.FRIDAY.CHS.SRT";

    const suffix = parseSubtitleUrl(name);

    expect(suffix).toBe("srt");
  });
});

describe("解析字幕内容", () => {
  it("srt 类型1", () => {
    const contents = parseSubtitleContent(srtSubtitleContent1, "srt");
    expect(contents.length).toBe(20);
  });
  it("srt 类型2", () => {
    const contents = parseSubtitleContent(srtSubtitleContent2, "srt");
    expect(contents.length).toBe(20);
  });
  it("ass 类型1", () => {
    const contents = parseSubtitleContent(assSubtitleContent1, "ass");
    expect(contents.length).toBe(20);
  });
});
