import { InputCore } from "./index";

export function connect(store: InputCore, $input: HTMLInputElement) {
  store.focus = () => {
    $input.focus();
  };
}
