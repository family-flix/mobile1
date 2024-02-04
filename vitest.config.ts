import path from "path";

export default {
  test: {
    //     alias: {
    //       "$app/forms": resolve("./mocks/forms.js"),
    //     },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
