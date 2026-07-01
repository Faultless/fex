import type { FexContext } from "@fex/kit";

export const meta = {
  name: "scene-scaffold",
  description: "scaffold a Three.js scene module (camera, renderer, animation loop)",
};

export async function run(ctx: FexContext) {
  const [name] = ctx.args;
  if (!name) {
    ctx.log.error("Usage: fex scene-scaffold <sceneName>");
    return;
  }

  const fnName = `create${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  const path = `src/scenes/${name}.ts`;

  await Bun.write(
    path,
    `import { PerspectiveCamera, Scene, WebGLRenderer } from "three";

export function ${fnName}(canvas: HTMLCanvasElement) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  return { scene, camera, renderer };
}
`,
  );

  ctx.log.success(`Created ${path}`);
}
