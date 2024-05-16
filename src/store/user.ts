import { UserCore } from "@/domains/user";

import { storage } from "./storage";
import { client } from "./request";

const { id, username, email, avatar, token } = storage.get("user");

class ExtendsUser extends UserCore {
  say() {
    console.log(`My name is ${this.username}`);
  }
}
export const user = new ExtendsUser({
  id,
  username,
  email,
  avatar,
  token,
  client,
});

// user.walk = () => {

// };
