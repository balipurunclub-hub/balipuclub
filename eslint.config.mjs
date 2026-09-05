import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "generate_qr.js",
    "src/shared/**",
  ]),
  {
    rules: {
      // Client data-fetching / timers legitimately set state after mount
      "react-hooks/set-state-in-effect": "off",
      // React Hook Form + Razorpay callbacks use refs outside render
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
