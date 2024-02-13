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
export function fetch_user_profile() {
  return request.get("/api/user/profile");
}

/**
 * 成员通过授权链接访问首页时，验证该链接是否有效
 */
export function validateMemberToken(v: { token: string }) {
  return request.post<{ token: string; id: string }>("/api/validate", {
    token: v.token,
  });
}
