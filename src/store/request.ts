/**
 * @file 网络请求
 */
import { HttpClientCore } from "@/domains/http_client/index";
import { connect } from "@/domains/http_client/connect.axios";
import { __VERSION__ } from "@/constants/index";

export const client = new HttpClientCore({
  headers: {
    "client-version": __VERSION__,
  },
});
connect(client);
