import parse from "url-parse";

import { SubtitleFile, SubtitleFileType, SubtitleParagraph } from "./types";

export function srtTimeToSeconds(durationStr: string) {
  const timeParts = durationStr.split(":");
  const minutes = parseInt(timeParts[0]);
  const seconds = parseFloat(timeParts[1].replace(",", ".")); // 处理逗号分隔的秒和毫秒部分
  return minutes * 60 + seconds;
}

export function parseSubtitleUrl(url: string): SubtitleFileType {
  const { pathname } = parse(url);
  const [, suffix] = pathname.split(".");
  // @ts-ignore
  return suffix || "vtt";
}

const SUBTITLE_PARSER_MAP: Record<SubtitleFileType, (content: string) => SubtitleParagraph[]> = {
  srt: (content: string) => {
    const oriParagraphs = content.split("\r\n\r\n").filter(Boolean);
    return oriParagraphs.map((paragraph) => {
      const [line, startAndEnd, text1, text2] = paragraph.split("\r\n");
      const [start, end] = startAndEnd.split(" --> ");
      const s = start.split(",")[0];
      const e = end.split(",")[0];
      return {
        line,
        start: s,
        end: e,
        startTime: srtTimeToSeconds(s),
        endTime: srtTimeToSeconds(e),
        texts: [text1, text2],
      };
    });
  },
  vtt: (content: string) => {
    const c = content.replace(/WEBVTT/, "");
    const oriParagraphs = c.split("\n\n").filter(Boolean);
    //     console.log("[DOMAIN]subtitle/utils - vtt", oriParagraphs);
    return oriParagraphs.map((paragraph, i) => {
      const [startAndEnd, ...texts] = paragraph.split("\n").filter(Boolean);
      const [start, end] = startAndEnd.split(" --> ");
      const s = start.split(",")[0];
      const e = end.split(",")[0];
      return {
        line: String(i),
        start: s,
        end: e,
        startTime: srtTimeToSeconds(s),
        endTime: srtTimeToSeconds(e),
        texts,
      };
    });
  },
  ass: (content: string) => {
    const lines = content.match(/Dialogue:.*\n?/g);
    if (!lines) {
      return [];
    }
    return lines.map((line, index) => {
      const removeTextModifier = line.replace(/{.*?}/g, "");
      const [, start, end, style, name, ml, mr, mv, effect, ...text] = removeTextModifier.split(",");
      const [text1 = "", text2 = ""] = text.join(",").split("\\N");
      return {
        line: String(index),
        start,
        end,
        startTime: srtTimeToSeconds(start),
        endTime: srtTimeToSeconds(end),
        texts: [text1, text2],
      };
    });
  },
};
/**
 * 解析字幕内容
 */
export function parseSubtitleContent(content: string, format: SubtitleFileType): SubtitleFile["paragraphs"] {
  const parser = SUBTITLE_PARSER_MAP[format];
  if (parser) {
    return parser(content);
  }
  return [
    {
      line: "1",
      start: "",
      startTime: 0,
      end: "",
      endTime: 0,
      texts: [content],
    },
  ];
}
