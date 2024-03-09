import { HttpClientCore } from "@/domains/http_client";
import { connect } from "@/domains/http_client/connect.web";
import { __VERSION__ } from "@/constants";

export const client = new HttpClientCore({
  hostname: window.location.origin,
  headers: {
    "client-version": __VERSION__,
  },
});
connect(client);
