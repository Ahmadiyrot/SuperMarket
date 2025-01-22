import { OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import SuperMarket from "./components/SuperMarket";
import { useThree } from "@react-three/fiber";

export default function Experience() {
  const { camera } = useThree();
  return (
    <>
      <Perf position="top-left" />

      {/* <OrbitControls makeDefault enableDamping dampingFactor={0.05} /> */}

      <directionalLight castShadow position={[1, 2, 3]} intensity={4.5} />
      <ambientLight intensity={1.5} />

      <SuperMarket />
    </>
  );
}
