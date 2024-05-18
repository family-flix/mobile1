import { request } from "@/domains/request/utils";

/**
 * 用户登录
 * @param body
 * @returns
 */
export function login(body: { email: string; password: string }) {
  return request.post<{
    id: string;
    username: string;
    name: string;
    email: string;
    avatar: string;
    verified: string;
    created: string;
    token: string;
  }>("/api/user/login", body);
}

export function logout(body: { email: string; password: string }) {
  return request.post("/api/user/logout", body);
}

export function get_token() {
  return request.post("/api/token", {});
}

/**
 * 获取当前登录用户信息详情
 * @returns
 */
export function fetchUserProfile() {
  return request.post<{
    id: string;
    nickname: string;
    email: string | null;
    avatar: string | null;
    permissions: string[];
  }>("/api/v2/wechat/user/profile");
}

/**
 * 更新邮箱
 * @returns
 */
export function updateUserEmail(values: { email: string }) {
  return request.post<void>("/api/v2/wechat/mine/update_email", values);
}

/**
 * 更新密码
 * @returns
 */
export function updateUserPwd(values: { pwd: string }) {
  return request.post<void>("/api/v2/wechat/mine/update_pwd", values);
}

/**
 * 成员通过授权链接访问首页时，验证该链接是否有效
 */
export function loginWithTokenId(v: { token: string }) {
  return request.post<{ id: string; email: string; token: string }>("/api/validate", {
    token: v.token,
  });
}

/**
 * 使用小程序 code 登录
 */
export function loginWithWeappCode(values: { code: string }) {
  const { code } = values;
  return request.post<{ id: string; email: string; token: string }>("/api/v2/wechat/auth/weapp", {
    code,
  });
}

/**
 * 使用邮箱、密码登录
 */
export function loginWithEmailAndPwd(values: { email: string; pwd: string }) {
  const { email, pwd } = values;
  return request.post<{ id: string; email: string; token: string }>("/api/v2/wechat/auth/login", {
    email,
    pwd,
  });
}

/**
 * 使用邮箱、密码注册
 */
export function registerWithEmailAndPwd(values: { email: string; pwd: string; code: string }) {
  const { email, pwd, code } = values;
  return request.post<{ id: string; email: string; token: string }>("/api/v2/wechat/auth/register", {
    email,
    pwd,
    code,
  });
}
