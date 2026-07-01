import type { FexContext } from "@fex/kit";

export const meta = {
  name: "component-scaffold",
  description: "scaffold a MUI-flavored component + test file under src/components",
};

export async function run(ctx: FexContext) {
  const [name] = ctx.args;
  if (!name) {
    ctx.log.error("Usage: fex component-scaffold <ComponentName>");
    return;
  }

  const dir = `src/components/${name}`;

  await Bun.write(
    `${dir}/${name}.tsx`,
    `import { Box, type BoxProps } from "@mui/material";

export interface ${name}Props extends BoxProps {}

export function ${name}({ ...props }: ${name}Props) {
  return <Box {...props} />;
}
`,
  );

  await Bun.write(
    `${dir}/${name}.test.tsx`,
    `import { render } from "@testing-library/react";
import { ${name} } from "./${name}";

test("renders", () => {
  render(<${name} />);
});
`,
  );

  ctx.log.success(`Created ${dir}/${name}.tsx and ${name}.test.tsx`);
}
