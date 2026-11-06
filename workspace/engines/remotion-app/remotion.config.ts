import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig((config) => enableTailwind(config));
// First run after a fresh install (cold webpack cache, newly downloaded browser) can exceed the 30s default.
Config.setDelayRenderTimeoutInMilliseconds(120000);
