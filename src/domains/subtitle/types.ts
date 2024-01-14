import { MediaOriginCountry } from "@/constants";

export enum SubtitleFileTypes {
  /** 上传到服务器本地的 */
  LocalFile = 1,
  /** 在阿里云盘的 */
  AliyundriveFile = 2,
  /** 内挂字幕 */
  MediaInnerFile = 3,
}

/** 后端返回的字幕文件 */
export type SubtitleFileResp = {
  id: string;
  type: SubtitleFileTypes;
  name: string;
  language: MediaOriginCountry[];
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

export type SubtitleFileSuffix = "ass" | "srt" | "vtt";
