// Flat config — no external plugins needed.
// TypeScript files are linted via tsc; ignoring them here avoids parser deps.
module.exports = [
  {
    ignores: ["dist/**", "node_modules/**", "**/*.ts"],
  },
];
