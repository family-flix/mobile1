import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  Change,
  StateChange,
  Mounted,
  Focus,
  Blur,
  Enter,
  Clear,
}
type TheTypesOfEvents = {
  [Events.Change]: string;
  [Events.StateChange]: InputState;
  [Events.Mounted]: void;
  [Events.Focus]: void;
  [Events.Blur]: string;
  [Events.Enter]: string;
  [Events.Clear]: void;
};

type InputProps = {
  /** 字段键 */
  name: string;
  disabled: boolean;
  defaultValue: string;
  placeholder: string;
  type: string;
  onChange: (v: string) => void;
  onEnter: (v: string) => void;
  onBlur: (v: string) => void;
  onClear: () => void;
  onMounted?: () => void;
};
type InputState = {
  value: string;
  placeholder: string;
  disabled: boolean;
  loading: boolean;
  type: string;
  allowClear: boolean;
};

export class InputCore extends BaseDomain<TheTypesOfEvents> {
  _defaultValue: string = "";
  value = "";
  placeholder: string;
  disabled: boolean;
  allowClear: boolean = true;
  type: string;
  loading = false;
  valueUsed = "";

  get state(): InputState {
    return {
      value: this.value,
      placeholder: this.placeholder,
      disabled: this.disabled,
      loading: this.loading,
      type: this.type,
      allowClear: this.allowClear,
    };
  }

  constructor(options: Partial<{ _name: string } & InputProps> = {}) {
    super(options);

    const {
      _name: name,
      defaultValue,
      placeholder = "请输入",
      type = "string",
      disabled = false,
      onChange,
      onBlur,
      onEnter,
      onClear,
      onMounted,
    } = options;
    if (name) {
      this._name = name;
    }
    this.placeholder = placeholder;
    this.type = type;
    this.disabled = disabled;
    if (defaultValue) {
      this._defaultValue = defaultValue;
    }
    if (defaultValue) {
      this.value = defaultValue;
    }
    if (onChange) {
      this.onChange(onChange);
    }
    if (onEnter) {
      this.onEnter(() => {
        onEnter(this.value);
      });
    }
    if (onBlur) {
      this.onBlur(onBlur);
    }
    if (onClear) {
      this.onClear(onClear);
    }
    if (onMounted) {
      this.onMounted(onMounted);
    }
  }
  setMounted() {
    this.emit(Events.Mounted);
  }
  handleEnter() {
    // if (this.value === this.valueUsed) {
    //   return;
    // }
    this.valueUsed = this.value;
    this.emit(Events.Enter, this.value);
  }
  handleBlur() {
    if (this.value === this.valueUsed) {
      return;
    }
    this.valueUsed = this.value;
    this.emit(Events.Blur, this.value);
  }
  setLoading(loading: boolean) {
    this.loading = loading;
    this.emit(Events.StateChange, { ...this.state });
  }
  focus() {
    console.log("请在 connect 中实现该方法");
  }
  change(value: string) {
    this.value = value;
    this.emit(Events.Change, value);
    this.emit(Events.StateChange, { ...this.state });
  }
  enable() {
    this.disabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  disable() {
    this.disabled = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  clear() {
    console.log("[COMPONENT]ui/input/index - clear", this._defaultValue);
    this.value = this._defaultValue;
    // this.emit(Events.Change, this.value);
    this.emit(Events.Clear);
    this.emit(Events.StateChange, { ...this.state });
  }
  reset() {
    this.value = this._defaultValue;
    this.emit(Events.StateChange, { ...this.state });
  }
  enter() {
    this.emit(Events.Enter);
  }

  onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
  onFocus(handler: Handler<TheTypesOfEvents[Events.Focus]>) {
    return this.on(Events.Focus, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents[Events.Blur]>) {
    return this.on(Events.Blur, handler);
  }
  onEnter(handler: Handler<TheTypesOfEvents[Events.Enter]>) {
    return this.on(Events.Enter, handler);
  }
  onClear(handler: Handler<TheTypesOfEvents[Events.Clear]>) {
    return this.on(Events.Clear, handler);
  }
}
