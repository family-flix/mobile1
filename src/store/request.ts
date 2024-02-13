import { HttpClientCore } from "@/domains/http_client";
import { __VERSION__ } from "@/constants";
import { connect } from "@/domains/http_client/connect.web";

export const client = new HttpClientCore({
  hostname: window.location.origin,
  headers: {
    "client-version": __VERSION__,
  },
});
connect(client);
