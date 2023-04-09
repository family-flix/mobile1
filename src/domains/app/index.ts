import { CurUser } from "@/domains/user";
import { Router, Page } from "@/domains/router";
import { Listener } from "@/domains/base";
import { Result } from "@/types";

export class Application {
  user: CurUser;
  router: Router;
  lifetimes: Partial<{
    beforeReady: () => Promise<Result<null>>;
    onReady: () => void;
  }> = {};

  state: Partial<{
    ready: boolean;
  }> = {};

  constructor(
    options: { user: CurUser; router: Router } & Application["lifetimes"]
  ) {
    const { user, router, beforeReady, onReady } = options;
    this.lifetimes = {
      beforeReady,
      onReady,
    };
    this.user = user;
    this.router = router;
  }
  onLaunch() {}
  /** 启动应用 */
  async start() {
    const { beforeReady } = this.lifetimes;
    if (beforeReady) {
      const r = await beforeReady();
      if (r.error) {
        return Result.Err(r.error);
      }
    }
    this.emitReady();
    this.router.start();
    return Result.Ok(null);
  }

  /** ready Start */
  readyListeners: Listener<{}>[] = [];
  emitReady = () => {
    for (let i = 0; i < this.readyListeners.length; i += 1) {
      const listener = this.readyListeners[i];
      listener({});
    }
  };
  /** 监听应用加载完成后的回调 */
  onReady(reachBottomListener: Listener<{}>) {
    this.readyListeners.push(reachBottomListener);
  }

  /** ready Start */
  errorListeners: Listener<Error>[] = [];
  /** 向 app 发送错误，该错误会作为全屏错误遮挡所有内容 */
  emitError = (error: Error) => {
    for (let i = 0; i < this.errorListeners.length; i += 1) {
      const listener = this.errorListeners[i];
      listener(error);
    }
  };
  /** 监听应用发生错误时的回调 */
  onError(errorListener: Listener<Error>) {
    this.errorListeners.push(errorListener);
  }

  warningListeners: Listener<Error>[] = [];
  emitWarning = (warning: Error) => {
    for (let i = 0; i < this.errorListeners.length; i += 1) {
      const listener = this.warningListeners[i];
      listener(warning);
    }
  };
  /** 监听应用发生错误时的回调 */
  onWarning(waringListener: Listener<Error>) {
    this.warningListeners.push(waringListener);
  }
}
