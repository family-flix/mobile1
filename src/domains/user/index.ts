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
  name = "UserCore";
  debug = false;

  _isLogin: boolean = false;
  profile: {
    id: string;
    username: string;
    avatar: string;
    token: string;
  } | null = null;
  token: string = "";
  values: Partial<{ email: string; password: string }> = {};

  static Events = Events;

  constructor(initialUser?: UserCore["profile"]) {
    super();

    console.log("constructor", initialUser);
    this._isLogin = !!initialUser;
    this.profile = initialUser ?? null;
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
  /** 用户名密码登录 */
  async login() {
    const { email, password } = this.values;
    if (!email) {
      return Result.Err("请输入邮箱");
    }
    if (!password) {
      return Result.Err("请输入密码");
    }
    const r = await login({ email, password });
    if (r.error) {
      this.tip({ text: ["登录失败", r.error.message] });
      return r;
    }
    this.values = {};
    this._isLogin = true;
    this.profile = r.data;
    this.token = r.data.token;
    this.emit(Events.Login, { ...this.profile });
    return Result.Ok(r.data);
  }
  logout() {}
  /**
   * 以成员身份登录
   */
  async validate(token: string, force: string) {
    if (force !== "1" && this._isLogin) {
      return Result.Ok(this.profile);
    }
    if (!token) {
      const msg = this.tip({ text: ["缺少 token"] });
      return Result.Err(msg);
    }
    const r = await validate_member_token(token);
    if (r.error) {
      this.tip({ text: ["校验 token 失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.profile = {
      id: r.data.id,
      username: "",
      avatar: "",
      token: r.data.token,
    };
    this._isLogin = true;
    this.token = this.profile.token;
    this.emit(Events.Login, {
      ...this.profile,
    });
    return Result.Ok({ ...this.profile });
  }
  async register() {
    const { email, password } = this.values;
    if (!email) {
      return Result.Err("Missing email");
    }
    if (!password) {
      return Result.Err("Missing password");
    }
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
  onLogin(handler: Handler<TheTypesOfEvents[Events.Login]>) {
    this.on(Events.Login, handler);
  }
}
