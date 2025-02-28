import { $ } from "bun";

import { name } from "../package.json";

async function build() {
  console.log(`Building ${name}...`);
  await $`rm -rf dist`;
  await $`tsc --project tsconfig.build.json --outdir ./dist && tsc-esm-fix --tsconfig tsconfig.build.json`;
}

await build();
