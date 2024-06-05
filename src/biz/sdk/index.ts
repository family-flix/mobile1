import { fetchMediaList, fetchMediaListProcess } from "@/services/media";
import { SeasonMediaCore } from "@/biz/media/season";
import { MediaResolutionTypes } from "@/biz/source/constants";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { HttpClientCore } from "@/domains/http_client";
import { connect } from "@/domains/http_client/connect.axios";
import { MediaTypes } from "@/constants/index";

export function MediaClient() {
  const client = new HttpClientCore({});
  const $mediaList = new ListCore(new RequestCore(fetchMediaList, { process: fetchMediaListProcess, client }));

  return {
    $mediaList,
    client,
  };
}

async function main() {
  const $app = MediaClient();
  connect($app.client);
  const response = await $app.$mediaList.search({
    name: "hello world",
  });
  console.log(response);
  const $season = await new SeasonMediaCore({ resolution: MediaResolutionTypes.HD, client: $app.client });
  const r = await $season.fetchProfile("helloworld");
  if (r.error) {
    console.log(r.error.message);
    return;
  }
  const { profile, curSource } = r.data;
  const r2 = await $season.playEpisode(curSource);
  if (r2.error) {
    console.log(r2.error.message);
    return;
  }
  const data = r2.data;
  const { url } = data;
}
