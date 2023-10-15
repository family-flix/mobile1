import { BaseDomain } from "@/domains/base";

enum Events {}
type TheTypesOfEvents = {};

export enum CollectionTypes {
  /** 手动创建 */
  Manually = 1,
  /** 每日更新 */
  DailyUpdate = 2,
  /** 每日更新草稿 */
  DailyUpdateDraft = 3,
}

export class CollectionCore extends BaseDomain<TheTypesOfEvents> {
  itemMap: Map<unknown, unknown> = new Map();

  setWrap(wrap: unknown) {
    // ...
  }
  add(key: unknown, v: unknown) {
    this.itemMap.set(key, v);
  }
  remove(key: unknown) {
    this.itemMap.delete(key);
  }
  getItems() {
    // 找到 wrap 下的所有 item
    const items = Array.from(this.itemMap.values());
    return items;
  }
}
