import { Handler } from "mitt";
import axios from "axios";

import { BaseDomain, uid } from "@/domains/base";

import { parseSubtitleContent, parseSubtitleUrl, srtTimeToSeconds } from "./utils";
import { request } from "@/utils/request";
import { Result } from "@/types";
import { SubtitleParagraph } from "./types";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: SubtitleState;
};
type SubtitleLine = SubtitleParagraph;
type SubtitleProps = {
  language?: string;
  suffix?: string;
  lines: SubtitleLine[];
};
type SubtitleState = {
  curLine: SubtitleLine | null;
};

export class SubtitleCore extends BaseDomain<TheTypesOfEvents> {
  /** 字幕文件列表 */
  files: {
    language: string;
    url: string;
  }[] = [];
  /** 台词列表 */
  lines: SubtitleLine[] = [];
  /** 准备展示的台词 */
  targetLine: SubtitleLine;
  curLine: SubtitleLine | null = null;
  /** 当前展示第几行，如果是 null 表示不展示字幕 */
  curLineIndex: number | null = null;
  /** 视频当前进度 */
  curTime = 0;
  /** 基准时间 */
  baseStep = 0;

  get state(): SubtitleState {
    return {
      curLine: this.curLine,
    };
  }

  static async New(subtitle: { url: string; language: string }, extra: Partial<{ currentTime: number }> = {}) {
    const { url, language } = subtitle;
    const r = await (async () => {
      try {
        const r = await axios.get(url);
        return Result.Ok(r.data);
      } catch (err) {
        const e = err as Error;
        return Result.Err(e.message);
      }
    })();
    if (r.error) {
      return Result.Err(r.error);
    }
    const suffix = parseSubtitleUrl(url);
    const paragraphs = parseSubtitleContent(r.data, suffix);
    //     const f = {
    //       id: uid(),
    //       url,
    //       language,
    //       paragraphs,
    //     };
    const store = new SubtitleCore({
      //       url,
      language,
      suffix,
      lines: paragraphs,
    });
    if (extra.currentTime) {
      store.handleTimeChange(extra.currentTime);
    }
    return Result.Ok(store);
  }

  constructor(props: Partial<{ _name: string }> & SubtitleProps) {
    super(props);

    const { lines } = props;
    this.lines = lines;
    this.targetLine = lines[0];
  }

  changeTargetLine(currentTime: number) {
    let nextTargetLine = this.lines.find((l) => {
      const { start, end } = l;
      const startSecond = srtTimeToSeconds(start);
      const endSecond = srtTimeToSeconds(end);
      if (currentTime > startSecond && currentTime <= endSecond) {
        return true;
      }
      return false;
    });
    if (!nextTargetLine) {
      nextTargetLine = this.lines.find((l) => {
        const { start, end } = l;
        const startSecond = srtTimeToSeconds(start);
        if (currentTime < startSecond) {
          return true;
        }
        return false;
      });
    }
    if (!nextTargetLine) {
      return;
    }
    this.targetLine = nextTargetLine;
  }
  handleTimeChange(currentTime: number) {
    //     if (currentTime < 2) {
    //     }
    // console.log("[DOMAIN]subtitle/index - handleTimeChange", currentTime, this.curTime, this.targetLine);
    if (Math.abs(currentTime - this.curTime) > 1) {
      this.curLine = null;
      this.curLineIndex = null;
      this.emit(Events.StateChange, { ...this.state });
      this.changeTargetLine(currentTime);
    }
    // console.log("[DOMAIN]subtitle/index - handleTimeChange after this.changeTargetLine", this.targetLine);
    this.curTime = currentTime;
    if (!this.targetLine) {
      return;
    }
    const prevLineIndex = this.curLineIndex;
    const { startTime, endTime } = this.targetLine;
    const startSecond = startTime + this.baseStep;
    const endSecond = endTime + this.baseStep;
    (() => {
      if (this.curLine && currentTime > this.curLine.endTime) {
        this.curLineIndex = null;
      }
      console.log("[DOMAIN]subtitle/index - handleTimeChange check show subtitle");
      console.log(currentTime, startSecond, endSecond, this.targetLine.line);
      if (currentTime > startSecond && currentTime <= endSecond) {
        this.curLineIndex = this.lines.findIndex((line) => line === this.targetLine);
        this.targetLine = this.lines[this.curLineIndex + 1] ?? null;
        return;
      }
    })();
    // console.log("prev line with cur line", prevLineIndex, this.curLineIndex);
    console.log(
      "[DOMAIN]subtitle/index - handleTimeChange before prevLineIndex === this.curLineIndex",
      prevLineIndex,
      this.curLineIndex,
      this.targetLine
    );
    if (prevLineIndex === this.curLineIndex) {
      return;
    }
    (() => {
      if (this.curLineIndex === null) {
        this.curLine = null;
        return;
      }
      this.curLine = this.lines[this.curLineIndex];
    })();
    // console.log(this.curLine, currentTime);
    this.emit(Events.StateChange, { ...this.state });
  }

  increase(step: number) {
    this.baseStep += step;
  }
  subtract(step: number) {
    this.baseStep -= step;
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
