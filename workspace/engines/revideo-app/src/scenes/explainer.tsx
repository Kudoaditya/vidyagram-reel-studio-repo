import { Circle, Line, Rect, Txt, makeScene2D } from "@revideo/2d";
import { all, createRef, createRefArray, easeInOutCubic, sequence, useScene, waitFor } from "@revideo/core";

// A vertical three-step flowchart: boxes pop in, arrows draw between them,
// then a dot travels the path and the last box morphs into a circle.
export default makeScene2D("explainer", function* (view) {
  const title = useScene().variables.get("title", "How it works")();
  const steps = useScene().variables.get("steps", ["Record", "Cut", "Animate"])();

  const boxes = createRefArray<Rect>();
  const arrows = createRefArray<Line>();
  const heading = createRef<Txt>();
  const dot = createRef<Circle>();
  const gap = 460;
  const ys = steps.map((_, i) => (i - (steps.length - 1) / 2) * gap + 120);

  view.add(
    <>
      <Txt ref={heading} y={-760} text={title} fill="#fafafa" fontSize={96} fontWeight={800} opacity={0} />
      {ys.slice(0, -1).map((y) => (
        <Line
          ref={arrows}
          points={[[0, y + 130], [0, y + gap - 130]]}
          stroke="#6366f1"
          lineWidth={12}
          endArrow
          arrowSize={28}
          end={0}
        />
      ))}
      {steps.map((label, i) => (
        <Rect ref={boxes} y={ys[i]} width={640} height={220} radius={36} fill="#18181b" stroke="#6366f1" lineWidth={6} scale={0}>
          <Txt text={label} fill="#fafafa" fontSize={80} fontWeight={700} />
        </Rect>
      ))}
      <Circle ref={dot} size={48} fill="#facc15" y={ys[0]} opacity={0} />
    </>,
  );

  yield* heading().opacity(1, 0.5);
  for (let i = 0; i < boxes.length; i++) {
    yield* boxes[i].scale(1, 0.4, easeInOutCubic);
    if (arrows[i]) yield* arrows[i].end(1, 0.4);
  }
  dot().opacity(1);
  yield* sequence(0.05, ...ys.slice(1).map((y) => dot().y(y, 0.6, easeInOutCubic)));
  const last = boxes[boxes.length - 1];
  yield* all(last.width(420, 0.8), last.height(420, 0.8), last.radius(210, 0.8), last.fill("#312e81", 0.8), dot().opacity(0, 0.3));
  yield* waitFor(1);
});
