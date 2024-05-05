import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { RequestCoreV2 } from "@/domains/request/v2";
import { HttpClientCore } from "@/domains/http_client";
import { Result } from "@/types";
import { sleep } from "@/utils";

import { fetchUserProfile, login, loginWithEmailAndPwd, updateUserAccount, validateMemberToken } from "./services";

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
  email: string;
  avatar: string;
  token: string;
  client: HttpClientCore;
};
type UserState = {
  id: string;
  username: string;
  email: string;
  avatar: string;
  token: string;
};
export class UserCore extends BaseDomain<TheTypesOfEvents> {
  static Events = Events;

  _name = "UserCore";
  debug = false;

  $client: HttpClientCore;

  id: string = "";
  username: string = "Anonymous";
  email: string = "";
  avatar: string = "";
  token: string = "";
  isLogin: boolean = false;

  get state(): UserState {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      avatar: this.avatar,
      token: this.token,
    };
  }
  constructor(props: Partial<{ _name: string }> & UserProps) {
    super(props);

    const { id, username, email, avatar, token, client } = props;
    // this.log("constructor", initialUser);
    this.id = id;
    this.username = username;
    this.email = email;
    this.avatar = avatar;
    this.isLogin = !!token;
    this.token = token;
    this.$client = client;
    if (token) {
      this.$client.appendHeaders({
        Authorization: token,
      });
    }
  }
  logout() {
    this.username = "Anonymous";
    this.email = "";
    this.avatar = "";
    this.isLogin = false;
    this.token = "";
    this.emit(Events.Logout);
  }
  /**
   * 使用 token 登录
   */
  async validate(values: Record<string, string>) {
    const { token, force, tmp } = values;
    const request = new RequestCoreV2({
      fetch: validateMemberToken,
      client: this.$client,
    });
    const r = await request.run({ token });
    if (r.error) {
      if (r.error.code === 800) {
        this.emit(Events.NeedUpdate);
        return Result.Err(r.error);
      }
      return Result.Err(r.error.message, 900);
    }
    this.id = r.data.id;
    this.email = r.data.email;
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
  /**
   * 使用用户名和密码登录
   */
  async login(values: { email: string; pwd: string }) {
    const { email, pwd } = values;
    // if (this.isLogin && !force) {
    //   return Result.Ok(this.state);
    // }
    if (!email) {
      return Result.Err("请输入邮箱");
    }
    if (!pwd) {
      return Result.Err("请输入密码");
    }
    const request = new RequestCoreV2({
      fetch: loginWithEmailAndPwd,
      client: this.$client,
    });
    const r = await request.run({ email, pwd });
    if (r.error) {
      return Result.Err(r.error);
    }
    this.id = r.data.id;
    this.token = r.data.token;
    this.isLogin = true;
    this.emit(Events.Login, {
      ...this.state,
    });
    return Result.Ok({
      id: this.id,
      token: this.token,
    });
  }
  async fetchProfile() {
    if (!this.isLogin) {
      return Result.Err("请先登录");
    }
    const request = new RequestCoreV2({
      fetch: fetchUserProfile,
      client: this.$client,
    });
    const r = await request.run();
    if (r.error) {
      return r;
    }
    return Result.Ok(r.data);
  }
  async updateAccount(values: { email: string; pwd: string }) {
    if (!this.isLogin) {
      return Result.Err("请先登录");
    }
    const { email, pwd } = values;
    if (!email) {
      return Result.Err("请输入邮箱");
    }
    if (!pwd) {
      return Result.Err("请输入密码");
    }
    const request = new RequestCoreV2({
      fetch: updateUserAccount,
      client: this.$client,
    });
    const r = await request.run(values);
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
