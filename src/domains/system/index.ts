export class CurSystem {
  connection: string = "unknown";
  /** 屏幕尺寸 */
  screen: {
    width: number;
  };
  constructor() {
    this.connection = this.query_network();
    this.screen = {
      width: document.body.clientWidth,
    };
    window.addEventListener("load", async () => {
      this.screen = {
        width: document.body.clientWidth,
      };
    });
  }
  query_network() {
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      return navigator.connection.type;
    }
    const ua = navigator.userAgent;
    const regExp = /NetType\/(\S*)/;
    const matches = ua.match(regExp);
    if (!matches) {
      return "unknown";
    }
    return matches[1];
  }
}

export const system = new CurSystem();
