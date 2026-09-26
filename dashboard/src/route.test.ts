import { parseRoute } from "./route";

describe("parseRoute", () => {
  it.each([
    ["", "home"],
    ["#/", "home"],
    ["#/overview", "overview"],
    ["#/settings", "settings"],
    ["#/privacy", "privacy"],
    ["#/signin", "signin"],
    ["#/settings/extra", "home"],
    ["#settings", "home"],
    ["#/<script>", "home"],
  ])("%j -> %s", (hash, expected) => {
    expect(parseRoute(hash)).toBe(expected);
  });
});
