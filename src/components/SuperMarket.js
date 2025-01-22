import { useGLTF, Html, Float } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Easing function for smooth transitions
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function SuperMarket() {
  const model = useGLTF("./Models/supermarketC.glb");
  const { camera } = useThree();

  const htmlparts = model.scene.children.filter((el) => el.name.includes("Mark"));
  const cams = model.cameras;
  const animations = model.animations;
  const cameraGroupRef = useRef();
  const mixerRef = useRef();
  const speed = 0.2;
  const cameraViews = useRef({});

  const originalCamRef = useRef({
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    fov: 50,
  });

  const [menuVisible, setMenuVisible] = useState(false);

  const transition = useRef({
    isActive: false,
    startPosition: new THREE.Vector3(),
    endPosition: new THREE.Vector3(),
    startQuaternion: new THREE.Quaternion(),
    endQuaternion: new THREE.Quaternion(),
    progress: 0,
    duration: 1, // Transition duration in seconds
  });

  useEffect(() => {
    camera.fov = 50;
    camera.position.set(-1.7, 4, -7);
    camera.lookAt(2.7, -0.59, 4.69);
    camera.updateProjectionMatrix();

    originalCamRef.current.position.copy(camera.position);
    originalCamRef.current.quaternion.copy(camera.quaternion);

    if (cams) {
      const views = {};
      cams.forEach((cam) => {
        views[cam.name] = {
          position: cam.position.clone(),
          quaternion: cam.quaternion.clone(),
        };
      });
      cameraViews.current = views;
    }

    if (animations?.length === 500) {
      mixerRef.current = new THREE.AnimationMixer(model.scene);
      animations.forEach((clip) => {
        const action = mixerRef.current.clipAction(clip);
        action.timeScale = speed;
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
        action.play();

        const onFinished = () => {
          action.timeScale = -action.timeScale;
          action.play();
        };

        mixerRef.current.addEventListener("finished", onFinished);
        return () => mixerRef.current?.removeEventListener("finished", onFinished);
      });
    }
  }, [animations, model.scene, speed, camera, cams]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);

    if (transition.current.isActive) {
      transition.current.progress = Math.min(transition.current.progress + delta / transition.current.duration / 5, 1);

      const easedProgress = easeInOutCubic(transition.current.progress);

      camera.position.lerpVectors(transition.current.startPosition, transition.current.endPosition, easedProgress);

      camera.quaternion.slerpQuaternions(transition.current.startQuaternion, transition.current.endQuaternion, easedProgress);

      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();

      if (transition.current.progress === 1) {
        transition.current.isActive = false;
      }
    }
  });

  const switchToView = (viewName) => {
    const view = cameraViews.current[viewName];
    if (view) {
      transition.current.isActive = true;
      transition.current.startPosition.copy(camera.position);
      transition.current.endPosition.copy(view.position);
      transition.current.startQuaternion.copy(camera.quaternion);
      transition.current.endQuaternion.copy(view.quaternion);
      transition.current.progress = 0;
      setMenuVisible(true);
    }
  };

  const resetCamera = () => {
    transition.current.isActive = true;
    transition.current.startPosition.copy(camera.position);
    transition.current.endPosition.copy(originalCamRef.current.position);
    transition.current.startQuaternion.copy(camera.quaternion);
    transition.current.endQuaternion.copy(originalCamRef.current.quaternion);
    transition.current.progress = 0;
    setMenuVisible(false);
  };

  return (
    <>
      <primitive object={model.scene} />
      {htmlparts.map((part, index) => {
        const worldPosition = new THREE.Vector3();
        part.getWorldPosition(worldPosition);
        worldPosition.y += 0.5;

        return (
          <Float speed={5} floatIntensity={1} rotationIntensity={0} key={index}>
            <Html position={worldPosition} className="html-label" scale={0.2} transform occlude>
              <button className="faq-button" onClick={() => switchToView(part.name.replace("Mark", "Cam"))}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                  <path d="M80 160c0-35.3 28.7-64 64-64h32c35.3 0 64 28.7 64 64v3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74V320c0 17.7 14.3 32 32 32s32-14.3 32-32v-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7V160c0-70.7-57.3-128-128-128H144C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"></path>
                </svg>
              </button>
            </Html>
          </Float>
        );
      })}

      <group ref={(ref) => ref && camera.add(ref)}>
        <Html center transform={false}>
          <div className={`menu-wrapper ${menuVisible ? "visible" : "hidden"}`}>
            <div className="menu">
              <h1>Menu</h1>
              <p>Here is some text displayed for the camera view.</p>
              <button onClick={resetCamera}>Exit</button>
            </div>
          </div>
        </Html>
      </group>
    </>
  );
}
