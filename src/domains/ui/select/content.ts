import { BaseDomain } from "@/domains/base";

enum Events {}
type TheTypesOfEvents = {};
export class SelectContentCore extends BaseDomain<TheTypesOfEvents> {
  constructor(
    options: Partial<{
      _name: string;
      $node: () => HTMLElement;
      getStyles: () => CSSStyleDeclaration;
      getRect: () => DOMRect;
    }> = {}
  ) {
    super(options);
    const { $node, getStyles, getRect } = options;
    if ($node) {
      this.$node = $node;
    }
    if (getRect) {
      this.getRect = getRect;
    }
    if (getStyles) {
      this.getStyles = getStyles;
    }
  }
  $node(): HTMLElement | null {
    return null;
  }
  getRect() {
    return {} as DOMRect;
  }
  getStyles() {
    return {} as CSSStyleDeclaration;
  }
  get clientHeight() {
    return this.$node()?.clientHeight ?? 0;
  }
}
