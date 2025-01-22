import { useGLTF, Html, Float, Billboard } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function SuperMarket() {
  const model = useGLTF("./Models/supermarket.glb");
  const { camera } = useThree();

  const htmlparts = model.scene.children.filter((el) => el.name.includes("Mark"));

  const cams = model.cameras;
  const animations = model.animations;
  
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
    duration: 1,
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

    const exitButton = document.getElementById("exitMenuButton");
    if (exitButton) {
      exitButton.addEventListener("click", resetCamera);
    }

    return () => {
      if (exitButton) {
        exitButton.removeEventListener("click", resetCamera);
      }
    };
  }, [camera, cams, animations, model.scene, speed]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);

    if (transition.current.isActive) {
      transition.current.progress = Math.min(transition.current.progress + delta / transition.current.duration, 1);

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

  const sectionContent = {
    BreadCam: { title: "Freshly Baked Goods", fact: "Our bread is baked fresh every morning, ensuring you get the most delicious, soft, and aromatic loaves for your family to enjoy all day long!" },
    CashCam: { title: "Cashier Section", fact: "This is where you can quickly and efficiently pay for all your groceries, with friendly staff ready to assist you and multiple payment options available." },
    WallCam: { title: "Cleaning Supplies Wall", fact: "Find a wide variety of cleaning products, from eco-friendly options to heavy-duty supplies, all organized neatly to help you keep your home spotless." },
    BottleCam: { title: "Plastic Bottle Recycling", fact: "Bring your plastic bottles here to recycle them responsibly, contributing to a cleaner planet while earning rewards for your sustainable actions!" },
    CartCam: { title: "Shopping Cart Area", fact: "Grab a shopping cart here to start your shopping journey, making it easy to carry all the great products you’ll find throughout the store." },
    ShelfCam: { title: "Double-Sided Shelf", fact: "Browse the diverse selection of products on this convenient double-sided shelf, designed to maximize visibility and easy access to your favorite goods from either side!" },
  };

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

      const content = sectionContent[viewName];

      if (content) {
        document.getElementById("menuTitle").innerText = content.title;
        document.getElementById("menuFact").innerText = content.fact;
      }

      document.getElementById("menuWrapper").classList.add("visible");
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

    document.getElementById("menuWrapper").classList.remove("visible");
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
              <>
                <button className="faq-button" onClick={() => switchToView(part.name.replace("Mark", "Cam"))}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                    <path d="M80 160c0-35.3 28.7-64 64-64h32c35.3 0 64 28.7 64 64v3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74V320c0 17.7 14.3 32 32 32s32-14.3 32-32v-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7V160c0-70.7-57.3-128-128-128H144C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"></path>
                  </svg>
                </button>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "#ff6b6b", stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: "#ff8e53", stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <path d="M19.924 13.617A1 1 0 0 0 19 13h-3V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v10H5a1 1 0 0 0-.707 1.707l7 7a1 1 0 0 0 1.414 0l7-7a1 1 0 0 0 .217-1.09z" fill="url(#gradient1)" />
                </svg>
              </>
            </Html>
          </Float>
        );
      })}
    </>
  );
}
