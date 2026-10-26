import { readFileSync, writeFileSync } from "node:fs";
const file = "src/styles.css";
const luminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const paper = luminance("#e2e7d7");
const source = readFileSync(file, "utf8")
  .replace(/--muted:\s*#6e7467/g, "--muted: #626b59")
  .replace(
    /(?<![-\w])color:\s*(#[a-fA-F0-9]{6})(?![a-fA-F0-9])/g,
    (whole, color) => {
      const l = luminance(color);
      return l < 0.45 && (paper + 0.05) / (l + 0.05) < 4.6
        ? "color: #58664e"
        : whole;
    },
  );
writeFileSync(file, source);
