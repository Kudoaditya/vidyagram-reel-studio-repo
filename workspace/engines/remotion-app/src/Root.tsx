import "./index.css";
import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import { Reel, reelSchema, type ReelProps } from "./Reel";
import { LongForm, longFormSchema, type LongFormProps } from "./LongForm";
import { IntroPro, INTRO_FRAMES } from "./IntroPro";
import { IntroWhite } from "./IntroWhite";
import { CaptionsOverlay, captionsOverlaySchema } from "./reel2/CaptionsOverlay";
import reel2Pages from "../public/reel2/captions_pages.json";

const WIDTH = 1080;
const HEIGHT = 1920;
const FALLBACK_SECONDS = 10;

// Duration follows the source video when one is given, otherwise the last caption, otherwise 10s.
const makeMetadata =
  (fps: number): CalculateMetadataFunction<ReelProps> =>
  async ({ props }) => {
    let seconds = FALLBACK_SECONDS;
    if (props.videoSrc) {
      seconds = (await getVideoMetadata(staticFile(props.videoSrc))).durationInSeconds;
    } else if (props.captions.length > 0) {
      seconds = props.captions[props.captions.length - 1].endMs / 1000 + 0.5;
    }
    for (const ins of props.inserts ?? []) seconds = Math.max(seconds, (ins.startMs + ins.durationMs) / 1000);
    return { durationInFrames: Math.max(1, Math.ceil(seconds * fps)), fps };
  };

const longMetadata: CalculateMetadataFunction<LongFormProps> = async ({ props }) => {
  let seconds = FALLBACK_SECONDS;
  if (props.videoSrc) seconds = (await getVideoMetadata(staticFile(props.videoSrc))).durationInSeconds;
  return { durationInFrames: Math.max(1, Math.ceil(seconds * 30)), fps: 30 };
};

const defaultProps: ReelProps = {
  videoSrc: "",
  captions: [
    { text: "Drop", startMs: 0, endMs: 400, timestampMs: 200, confidence: 1 },
    { text: " a", startMs: 400, endMs: 600, timestampMs: 500, confidence: 1 },
    { text: " reel", startMs: 600, endMs: 1100, timestampMs: 850, confidence: 1 },
    { text: " in", startMs: 1100, endMs: 1300, timestampMs: 1200, confidence: 1 },
    { text: " public/", startMs: 1300, endMs: 2000, timestampMs: 1650, confidence: 1 },
  ],
  inserts: [],
  showCaptions: true,
  title: "Explainer",
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel30"
      component={Reel}
      width={WIDTH}
      height={HEIGHT}
      fps={30}
      durationInFrames={FALLBACK_SECONDS * 30}
      schema={reelSchema}
      defaultProps={defaultProps}
      calculateMetadata={makeMetadata(30)}
    />
    <Composition
      id="Reel60"
      component={Reel}
      width={WIDTH}
      height={HEIGHT}
      fps={60}
      durationInFrames={FALLBACK_SECONDS * 60}
      schema={reelSchema}
      defaultProps={defaultProps}
      calculateMetadata={makeMetadata(60)}
    />
    <Composition
      id="Wide30"
      component={LongForm}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={FALLBACK_SECONDS * 30}
      schema={longFormSchema}
      defaultProps={{ videoSrc: "", scenes: [] } as LongFormProps}
      calculateMetadata={longMetadata}
    />
    <Composition
      id="Reel2Captions"
      component={CaptionsOverlay}
      width={WIDTH}
      height={HEIGHT}
      fps={30000 / 1001}
      durationInFrames={1385}
      schema={captionsOverlaySchema}
      defaultProps={reel2Pages}
    />
    <Composition id="IntroWhite" component={IntroWhite} width={1920} height={1080} fps={30} durationInFrames={1018} />
    <Composition id="IntroPro" component={IntroPro} width={1920} height={1080} fps={30} durationInFrames={INTRO_FRAMES} />
  </>
);
