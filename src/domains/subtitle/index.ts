import { Handler, BaseDomain } from "@/domains/base";
import { HttpClientCore } from "@/domains/http_client";
import { Result } from "@/types";
import { MediaOriginCountry } from "@/constants";

import { parseSubtitleContent, parseSubtitleUrl, timeStrToSeconds } from "./utils";
import { SubtitleFileSuffix, SubtitleFileTypes, SubtitleParagraph } from "./types";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: SubtitleState;
};
type SubtitleLine = SubtitleParagraph;
type SubtitleProps = {
  filename: string;
  language: MediaOriginCountry[];
  suffix?: SubtitleFileSuffix;
  lines: SubtitleLine[];
};
type SubtitleState = {
  curLine: SubtitleLine | null;
};

export class SubtitleCore extends BaseDomain<TheTypesOfEvents> {
  static async New(
    subtitle: { id: string; type: SubtitleFileTypes; url: string; name: string; language: MediaOriginCountry[] },
    extra: { client: HttpClientCore; currentTime?: number }
  ) {
    const { id, name, type, url, language } = subtitle;
    const { client } = extra;
    const content_res = await (async () => {
      if (type === SubtitleFileTypes.MediaInnerFile) {
        const r = await (async () => {
          try {
            const r = await client.fetch<string>({ url, method: "GET" });
            return Result.Ok(r.data);
          } catch (err) {
            const e = err as Error;
            return Result.Err(e.message);
          }
        })();
        if (r.error) {
          return Result.Err(r.error);
        }
        return Result.Ok({
          name,
          content: r.data,
        });
      }
      if (type === SubtitleFileTypes.LocalFile) {
        try {
          const r = await client.fetch<string>({ url, method: "GET" });
          return Result.Ok({
            name,
            content: r.data,
          });
        } catch (err) {
          const e = err as Error;
          return Result.Err(e.message);
        }
      }
      return Result.Err("未知字幕类型");
    })();
    if (content_res.error) {
      return Result.Err(content_res.error);
    }
    const { content, name: subtitle_name } = content_res.data;
    const suffix = parseSubtitleUrl(subtitle_name);
    const paragraphs = parseSubtitleContent(content, suffix);
    // console.log("[DOMAIN]subtitle/index - paragraphs", paragraphs);
    const store = new SubtitleCore({
      filename: subtitle_name,
      language,
      suffix,
      lines: paragraphs,
    });
    if (extra.currentTime) {
      store.handleTimeChange(extra.currentTime);
    }
    return Result.Ok(store);
  }

  filename: string = "";
  lang: MediaOriginCountry[];
  suffix?: string;
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

  constructor(props: Partial<{ _name: string }> & SubtitleProps) {
    super(props);

    const { filename, lines, suffix, language } = props;
    this.filename = filename;
    this.lines = lines;
    this.suffix = suffix;
    this.lang = language;
    this.targetLine = lines[0];
  }

  changeTargetLine(currentTime: number) {
    let nextTargetLine = this.lines.find((l) => {
      const { start, end } = l;
      const startSecond = timeStrToSeconds(start);
      const endSecond = timeStrToSeconds(end);
      if (currentTime > startSecond && currentTime <= endSecond) {
        return true;
      }
      return false;
    });
    if (!nextTargetLine) {
      nextTargetLine = this.lines.find((l) => {
        const { start, end } = l;
        const startSecond = timeStrToSeconds(start);
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
    // console.log("[DOMAIN]subtitle/index - handleTimeChange", currentTime, this.curTime, this.targetLine);
    if (Math.abs(currentTime - this.curTime) >= 1) {
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
      if (currentTime > startSecond && currentTime <= endSecond) {
        this.curLineIndex = this.lines.findIndex((line) => line === this.targetLine);
        this.targetLine = this.lines[this.curLineIndex + 1] ?? null;
        return;
      }
    })();
    // console.log("prev line with cur line", prevLineIndex, this.curLineIndex);
    // console.log(
    //   "[DOMAIN]subtitle/index - handleTimeChange before prevLineIndex === this.curLineIndex",
    //   prevLineIndex,
    //   this.curLineIndex,
    //   this.targetLine
    // );
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
    // console.log("[DOMAIN]subtitle/index - before Event.StateChange", this.curLine, currentTime);
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
