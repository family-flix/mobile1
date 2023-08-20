/**
 * @file 列表中单选
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
  Change,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: SelectionState;
  [Events.Change]: T;
};
type SelectionProps<T> = Partial<{
  onChange?: (v: T) => void;
}>;
type SelectionState = {};
export class SelectionCore<T> extends BaseDomain<TheTypesOfEvents<T>> {
  value: T | null = null;

  constructor(props: Partial<{ _name: string }> & SelectionProps<T> = {}) {
    super(props);

    const { onChange } = props;
    if (onChange) {
      this.onChange(onChange);
    }
  }

  /** 暂存一个值 */
  select(value: T) {
    this.value = value;
    this.emit(Events.Change, this.value);
  }
  /** 暂存的值是否为空 */
  isEmpty() {
    return this.value === null;
  }
  /** 返回 select 方法保存的 value 并将 value 重置为 null */
  clear() {
    // const v = this.value;
    this.value = null;
    // return v;
  }

  onChange(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
}
