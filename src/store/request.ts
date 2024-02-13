import { HttpClientCore } from "@/domains/http_client";
import { __VERSION__ } from "@/constants";

export const client = new HttpClientCore({
  hostname: window.location.origin,
  headers: {
    "client-version": __VERSION__,
  },
});

export const fetch = new HttpClientCore({
  hostname: "",
});
