/** 后端返回的字幕文件 */
export type SubtitleResp = {
  id: string;
  type: number;
  name: string;
  lang: string;
  url: string;
};

/**
 * 句子
 */
export interface SubtitleParagraph {
  //   id: number;
  line: string;
  start: string;
  startTime: number;
  end: string;
  endTime: number;
  texts: string[];
  //   text1: string;
  //   text2: string;
}

export interface SubtitleFile {
  title: string;
  type: string;
  paragraphs: SubtitleParagraph[];
}

export type SubtitleFileType = "ass" | "srt" | "vtt";
