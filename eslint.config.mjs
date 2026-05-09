import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
    ],
  },
];

export default config;
