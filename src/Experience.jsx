import { Environment, OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import SuperMarket from "./components/SuperMarket";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ToneMapping, DepthOfField, SSAO } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function Experience() {
  const { camera } = useThree();

  return (
    <>
      {/* <Perf position="top-left" /> */}

      {/* <EffectComposer>
        <Bloom intensity={0.6} radius={0.4} threshold={0.2} />
        <Vignette eskil={false} offset={0.3} darkness={0.8} />
      </EffectComposer> */}

      <Environment environmentIntensity={2.5} preset="night" background />

      <SuperMarket />
    </>
  );
}
