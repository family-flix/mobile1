import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

import { CheckboxCore } from ".";

enum Events {
  StateChange,
  Change,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: CheckboxGroupState<T>;
  [Events.Change]: T[];
};
type CheckboxGroupOption<T> = {
  value: T;
  label: string;
  checked?: boolean;
  disabled?: boolean;
};
enum SpecialOptionValues {
  All = "__all__",
}
type CheckboxGroupProps<T> = {
  /** 默认选中的 */
  values?: T[];
  /** 可选项 */
  options?: CheckboxGroupOption<T>[];
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange?: (options: T[]) => void;
};
type CheckboxGroupState<T> = Omit<CheckboxGroupProps<T>, "options"> & {
  options: {
    label: string;
    value: T;
    core: CheckboxCore;
  }[];
  values: T[];
  indeterminate: boolean;
};

export class CheckboxGroupCore<T extends any> extends BaseDomain<TheTypesOfEvents<T>> {
  options: {
    label: string;
    value: T;
    core: CheckboxCore;
  }[] = [];
  disabled: CheckboxGroupProps<T>["disabled"];
  values: T[] = [];

  get indeterminate() {
    return this.values.length === this.options.length;
  }
  get state(): CheckboxGroupState<T> {
    return {
      values: this.values,
      options: this.options,
      disabled: this.disabled,
      indeterminate: this.indeterminate,
    };
  }

  prevChecked = false;

  constructor(props: { _name?: string } & CheckboxGroupProps<T> = {}) {
    super(props);

    const { values, options = [], disabled = false, onChange } = props;
    if (values) {
      this.values = values;
    }
    this.disabled = disabled;

    const extraOption = {
      label: "全部",
      // @ts-ignore
      value: SpecialOptionValues.All as T,
      core: new CheckboxCore({
        label: "全部",
        checked: false,
        disabled: false,
        onChange: (checked) => {
          if (checked) {
            this.values = [];
            const checkedOptions = this.options.filter((o) => {
              if (o.value === SpecialOptionValues.All) {
                return false;
              }
              return o.core.state.checked;
            });
            for (let i = 0; i < checkedOptions.length; i += 1) {
              const c = checkedOptions[i];
              c.core.uncheck();
            }
            this.emit(Events.Change, [...this.values]);
            this.emit(Events.StateChange, { ...this.state });
            return;
          }
        },
      }),
    };
    this.options = options.map((opt) => {
      const { label, value, checked, disabled } = opt;
      const store = new CheckboxCore({
        label,
        checked,
        disabled,
        onChange: (checked) => {
          // console.log("[DOMAIN]checkbox/group - onChange", checked, this.values, value);
          const existing = this.values.includes(value);
          if (checked && !existing) {
            if (extraOption.core.checked) {
              extraOption.core.uncheck();
            }
            this.checkOption(value);
            return;
          }
          if (!checked && existing) {
            this.uncheckOption(value);
          }
        },
      });
      return {
        label,
        value,
        core: store,
      };
    });
    this.options = [extraOption].concat(this.options);
    if (onChange) {
      this.onChange(onChange);
    }
  }
  checkOption(value: T) {
    console.log("[DOMAIN]domains/ui/checkbox/group - checkOption", value);
    this.values = this.values.concat(value);
    this.emit(Events.Change, [...this.values]);
    this.emit(Events.StateChange, { ...this.state });
  }
  uncheckOption(value: T) {
    console.log("[DOMAIN]domains/ui/checkbox/group - uncheckOption", value);
    this.values = this.values.filter((v) => {
      return v !== value;
    });
    this.emit(Events.Change, [...this.values]);
    this.emit(Events.StateChange, { ...this.state });
  }
  reset() {
    this.values = [];
    this.emit(Events.Change, [...this.values]);
    this.emit(Events.StateChange, { ...this.state });
  }

  onChange(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
