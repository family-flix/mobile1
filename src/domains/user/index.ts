import { Handler } from "mitt";

import { Result } from "@/types";
import { BaseDomain } from "@/domains/base";
import { sleep } from "@/utils";

import { fetch_user_profile, login, validate_member_token } from "./services";

export enum Events {
  Tip,
  Error,
  Login,
  Logout,
  /** 身份凭证失效 */
  Expired,
  NeedUpdate,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Tip]: string[];
  [Events.Error]: Error;
  [Events.Login]: UserState & { token: string };
  [Events.Logout]: void;
  [Events.Expired]: void;
  [Events.NeedUpdate]: void;
  [Events.StateChange]: UserState;
};
type UserProps = {
  id: string;
  username: string;
  avatar: string;
  token: string;
};
type UserState = UserProps & {
  // id: string;
  // username: string;
  // avatar: string;
  // token: string;
};
export class UserCore extends BaseDomain<TheTypesOfEvents> {
  static Events = Events;

  _name = "UserCore";
  debug = false;

  id: string = "";
  username: string = "Anonymous";
  avatar: string = "";
  token: string = "";
  isLogin: boolean = false;

  get state(): UserState {
    return {
      id: this.id,
      username: this.username,
      avatar: this.avatar,
      token: this.token,
    };
  }
  constructor(options: Partial<{ _name: string }> & UserProps) {
    super(options);

    if (!options) {
      return;
    }
    const { id, username, avatar, token } = options;
    // this.log("constructor", initialUser);
    this.id = id;
    this.username = username;
    this.avatar = avatar;
    this.isLogin = !!token;
    this.token = token;
  }
  logout() {
    this.emit(Events.Logout);
  }
  /**
   * 以成员身份登录
   */
  async validate(values: Record<string, string>) {
    const { token, force, tmp } = values;
    // if (this.isLogin && !force) {
    //   return Result.Ok(this.state);
    // }
    if (!token) {
      const msg = this.tip({ text: ["缺少 token"] });
      return Result.Err(msg);
    }
    const r = await validate_member_token(token);
    if (r.error) {
      if (r.error.code === 800) {
        this.emit(Events.NeedUpdate);
        return Result.Err(r.error);
      }
      this.tip({ text: ["校验 token 失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.id = r.data.id;
    this.token = r.data.token;
    this.isLogin = true;
    if (!tmp) {
      this.emit(Events.Login, {
        ...this.state,
      });
    }
    await sleep(800);
    return Result.Ok({ ...this.state });
  }
  async fetchProfile() {
    if (!this.isLogin) {
      return Result.Err("请先登录");
    }
    const r = await fetch_user_profile();
    if (r.error) {
      return r;
    }
    return Result.Ok(r.data);
  }

  onLogin(handler: Handler<TheTypesOfEvents[Events.Login]>) {
    return this.on(Events.Login, handler);
  }
  onLogout(handler: Handler<TheTypesOfEvents[Events.Logout]>) {
    return this.on(Events.Logout, handler);
  }
  onNeedUpdate(handler: Handler<TheTypesOfEvents[Events.NeedUpdate]>) {
    return this.on(Events.NeedUpdate, handler);
  }
  onExpired(handler: Handler<TheTypesOfEvents[Events.Expired]>) {
    return this.on(Events.Expired, handler);
  }
}
