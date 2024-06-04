import { fetchInfo } from "@/services/index";
import { BaseDomain, Handler } from "@/domains/base";
import { RequestCore } from "@/domains/request/index";
import { HttpClientCore } from "@/domains/http_client/index";
import { Result } from "@/domains/result/index";
import { sleep } from "@/utils/index";

import {
  fetchUserProfile,
  login,
  loginWithEmailAndPwd,
  registerWithEmailAndPwd,
  updateUserEmail,
  updateUserPwd,
  loginWithTokenId,
  loginWithWeappCode,
} from "./services";

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

  unique_id = "UserCore";
  debug = false;

  id: string = "";
  username: string = "Anonymous";
  email: string = "";
  avatar: string = "";
  token: string = "";
  isLogin: boolean = false;
  permissions: string[] = [];

  $client: HttpClientCore;
  $profile: RequestCore<typeof fetchInfo>;

  get state(): UserState {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      avatar: this.avatar,
      token: this.token,
    };
  }
  constructor(props: Partial<{ _name: string }> & UserProps, client: HttpClientCore) {
    super(props);

    const { id, username, email, avatar, token } = props;
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
    this.$profile = new RequestCore(fetchInfo, {
      client: this.$client,
    });
  }
  /**
   * 使用 token id 登录
   */
  async loginWithTokenId(values: { token: string; tmp: number }) {
    const { token, tmp } = values;
    const request = new RequestCore(loginWithTokenId, {
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
  async loginWithEmailAndPwd(values: { email: string; pwd: string }) {
    const { email, pwd } = values;
    if (!email) {
      return Result.Err("请输入邮箱");
    }
    if (!pwd) {
      return Result.Err("请输入密码");
    }
    const request = new RequestCore(loginWithEmailAndPwd, {
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
  authWithToken(values: { id: string; email: string; token: string }) {
    const { id, email, token } = values;
    if (!token) {
      return Result.Err("缺少 token");
    }
    this.id = id;
    this.email = email;
    this.token = token;
    this.isLogin = true;
    this.emit(Events.Login, { ...this.state });
    return Result.Ok({
      id,
      token,
    });
  }
  async loginWithWeappCode(values: { code: string }) {
    const { code } = values;
    if (!code) {
      return Result.Err("请传入 code");
    }
    const request = new RequestCore(loginWithWeappCode, {
      client: this.$client,
    });
    const r = await request.run({ code });
    if (r.error) {
      return Result.Err(r.error.message, 900);
    }
    this.id = r.data.id;
    this.email = r.data.email;
    this.token = r.data.token;
    this.isLogin = true;
    this.emit(Events.Login, { ...this.state });
    return Result.Ok({ ...this.state });
  }
  /**
   * 使用用户名和密码注册
   */
  async register(values: { email: string; pwd: string; code: string }) {
    const { email, pwd, code } = values;
    if (!email) {
      return Result.Err("请输入邮箱");
    }
    if (!pwd) {
      return Result.Err("请输入密码");
    }
    const request = new RequestCore(registerWithEmailAndPwd, {
      client: this.$client,
    });
    const r = await request.run({ email, pwd, code });
    if (r.error) {
      return Result.Err(r.error);
    }
    this.id = r.data.id;
    this.email = r.data.email;
    this.token = r.data.token;
    this.isLogin = true;
    this.emit(Events.Login, { ...this.state });
    return Result.Ok({
      id: this.id,
      email: this.email,
      token: this.token,
    });
  }
  async fetchProfile() {
    if (!this.isLogin) {
      return Result.Err("请先登录");
    }
    const r = await this.$profile.run();
    if (r.error) {
      return r;
    }
    const { nickname, email, avatar, permissions } = r.data;
    this.username = nickname;
    this.email = email ?? "";
    this.avatar = avatar ?? "";
    this.permissions = permissions;
    return Result.Ok(r.data);
  }
  async updateEmail(values: { email: string }) {
    const { email } = values;
    if (!email) {
      return Result.Err("请输入邮箱");
    }
    const $updateEmailRequest = new RequestCore(updateUserEmail, {
      client: this.$client,
    });
    const r = await $updateEmailRequest.run({ email });
    if (r.error) {
      return Result.Err(r.error.message);
    }
    this.email = email;
    this.emit(Events.StateChange, { ...this.state });
    return Result.Ok({});
  }
  async updatePwd(values: { pwd: string }) {
    const { pwd } = values;
    if (!pwd) {
      return Result.Err("请输入密码");
    }
    const $updatePwdRequest = new RequestCore(updateUserPwd, {
      client: this.$client,
    });
    const r = await $updatePwdRequest.run({ pwd });
    if (r.error) {
      return Result.Err(r.error.message);
    }
    this.emit(Events.Logout);
    return Result.Ok({});
  }
  hasPermission(key: string) {
    return this.permissions.includes(key);
  }
  logout() {
    this.username = "Anonymous";
    this.email = "";
    this.avatar = "";
    this.isLogin = false;
    this.token = "";
    this.emit(Events.Logout);
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
