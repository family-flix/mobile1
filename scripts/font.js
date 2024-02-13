/**
 * @file 找出该项目使用了哪些 lucide 图标
 */
const fs = require("fs");
const path = require("path");

function find_icons(filepath, pattern) {
  const content = fs.readFileSync(filepath, "utf8");
  const matched = content.match(pattern);
  if (!matched) {
    return [];
  }
  const variables = matched
    .map((line) => {
      const v = line.match(/\{([^}]{1,})\}/);
      if (!v) {
        return null;
      }
      return v[1].split(",");
    })
    .filter(Boolean)
    .reduce((result, cur) => {
      return result.concat(cur);
    }, []);
  return variables
    .map((variable) => {
      const r = variable.match(/[a-zA-Z0-9]{1,}/);
      if (r) {
        return r[0];
      }
      return null;
    })
    .filter(Boolean);
}

function process_directory(dir_path, pattern) {
  const files = fs.readdirSync(dir_path);
  let result = [];
  for (const file of files) {
    const filepath = path.join(dir_path, file);
    if (fs.statSync(filepath).isDirectory()) {
      result = [...result, ...process_directory(filepath, pattern)];
    }
    if (filepath.endsWith(".tsx")) {
      const variables = find_icons(filepath, pattern);
      result = [...result, ...variables];
    }
  }
  return result;
}

const directory = path.resolve(process.cwd(), "src");
const import_pattern = /import \{[^}]{1,}\} from ['"]lucide-react['"];/g;

const variables = process_directory(directory, import_pattern);
const unique_variables = [...new Set(variables)].map((variable) => {
  return variable.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
});
console.log(unique_variables);
