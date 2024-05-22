import { useRef } from "react";

import { DialogCore } from "@/domains/ui/index";
import { Result } from "@/domains/result/index";

import { storage } from "./storage";
import dayjs from "dayjs";

export const dialogs: Record<
  string,
  Partial<{
    /**
     * 弹窗间隔
     * "always" 忽略间隔，每次都弹
     * "weekly" 自然周，每周只能弹一次
     * "daily"  自然天，每天只能弹一次
     * number   指定间隔小时，如 24，即当天 12 点弹过，只有到了明天 12 点之后，才能再次弹
     */
    interval: "always" | "weekly" | "daily" | "hourly" | number;
    /** 优先级 */
    priority: number;
  }>
> = {
  updated_history: {
    priority: 100,
    interval: "daily",
  },
};

export function canShowDialog(name: keyof typeof dialogs) {
  const now = dayjs().valueOf();
  const option = getDialog(name);
  if (!option) {
    return false;
  }
  const { interval } = option;
  if (interval === "always") {
    return true;
  }
  const prev_showed_time = (() => {
    const v = storage.get("dialog_flags")[name];
    if (v) {
      return v.show_at;
    }
    return null;
  })();
  if (!prev_showed_time) {
    return true;
  }
  if (interval === "daily") {
    const range = [dayjs(now).clone().startOf("day"), dayjs(now).clone().endOf("day")];
    const isToday =
      dayjs(prev_showed_time).clone().isAfter(range[0]) && dayjs(prev_showed_time).clone().isBefore(range[1]);
    return !isToday;
  }
  if (interval === "hourly") {
    const range = [dayjs(now).clone().startOf("hour"), dayjs(now).clone().endOf("hour")];
    const isHour =
      dayjs(prev_showed_time).clone().isAfter(range[0]) && dayjs(prev_showed_time).clone().isBefore(range[1]);
    return !isHour;
  }
  return false;
}
export function dialogHasShow(name: keyof typeof dialogs) {
  const now = dayjs().valueOf();
  storage.merge("dialog_flags", {
    [name]: {
      show_at: now,
    },
  });
}

function getDialog(name: keyof typeof dialogs) {
  const matched = dialogs[name];
  if (!matched) {
    return null;
  }
  return matched;
}
export function useDialog(name: keyof typeof dialogs) {
  //   const matched = getDialog(name);
  //   const ref = useRef<null | DialogCore>(null);
  //   if (!matched) {
  //     ref.current = null;
  //     return ref.current;
  //   }
  //   const { store } = matched;
  //   ref.current = store;
  //   return ref.current;
}
export function showDialogWithName(name: keyof typeof dialogs) {
  //   const dialog = getDialog(name);
  //   if (!dialog) {
  //     return Result.Err("没有匹配的记录");
  //   }
  //   const { store } = dialog;
  //   store.show();
  //   return Result.Ok(null);
}

export function registerDialog(options: {}) {}
