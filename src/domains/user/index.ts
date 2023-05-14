import { Handler } from "mitt";

import { Result } from "@/types";
import { BaseDomain } from "@/domains/base";

import { fetch_user_profile, login, validate_member_token } from "./services";

export enum Events {
  Tip,
  Error,
  Login,
  Logout,
}
type TheTypesOfEvents = {
  [Events.Tip]: string[];
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
};

export class UserCore extends BaseDomain<TheTypesOfEvents> {
  _isLogin: boolean = false;
  user: {
    username: string;
    avatar: string;
    token: string;
  } | null = null;
  token: string = "";
  values: Partial<{ email: string; password: string }> = {};
  onErrorNotice?: (msg: string) => void;

  constructor(initialUser: UserCore["user"]) {
    super();

    // this.log("constructor", initialUser);
    this._isLogin = !!initialUser;
    this.user = initialUser;
    this.token = initialUser ? initialUser.token : "";
  }
  get isLogin() {
    return this._isLogin;
  }
  inputEmail(value: string) {
    this.values.email = value;
  }
  inputPassword(value: string) {
    this.values.password = value;
  }
  async login() {
    const { email, password } = this.values;
    if (!email) {
      return Result.Err("Missing email");
    }
    if (!password) {
      return Result.Err("Missing password");
    }
    const r = await login({ email, password });
    if (r.error) {
      this.noticeError(r);
      return r;
    }
    this.values = {};
    this._isLogin = true;
    this.user = r.data;
    this.token = r.data.token;
    localStorage.setItem("user", JSON.stringify(r.data));
    return Result.Ok(r.data);
  }
  /**
   * 以成员身份登录
   */
  async loginInMember(token: string) {
    if (this._isLogin) {
      return Result.Ok(this.user);
    }
    if (!token) {
      this.noticeError("请先登录");
      return Result.Err("请先登录");
    }
    const r = await validate_member_token(token);
    if (r.error) {
      this.noticeError(r);
      return r;
    }
    const t = r.data.token;
    this.user = {
      username: "",
      avatar: "",
      token: t,
    };
    this._isLogin = true;
    localStorage.setItem("user", JSON.stringify(r.data));
    this.token = t;
    return Result.Ok({ ...this.user });
  }
  logout() {}
  async register() {
    const { email, password } = this.values;
    if (!email) {
      return Result.Err("Missing email");
    }
    if (!password) {
      return Result.Err("Missing password");
    }
    // const r = await login({ email, password });
    // this.values = {};
    // if (r.error) {
    //   this.notice_error(r);
    //   return r;
    // }
    // this.user = r.data;
    // this.token = r.data.token;
    // localStorage.setItem("user", JSON.stringify(r.data));
    return Result.Ok(null);
  }
  async fetchProfile() {
    if (!this._isLogin) {
      return Result.Err("请先登录");
    }
    const r = await fetch_user_profile();
    if (r.error) {
      return r;
    }
    return Result.Ok(r.data);
  }
  noticeError(result: Result<null> | string) {
    if (!this.onErrorNotice) {
      return;
    }
    if (typeof result === "string") {
      this.onErrorNotice(result);
      return;
    }
    this.onErrorNotice(result.error.message);
  }

  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    this.on(Events.Error, handler);
  }
  emitError(result: Result<null> | string) {
    const error = (() => {
      if (typeof result === "string") {
        return new Error(result);
      }
      return result.error;
    })();
    this.emit(Events.Error, error);
  }
  onLogin(handler: Handler<TheTypesOfEvents[Events.Login]>) {
    this.on(Events.Login, handler);
  }
  emitLogin() {
    this.emit(Events.Login, { ...this.user });
  }
}
