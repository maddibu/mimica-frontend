import { useEffect, useRef, useCallback } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const UMBRALES = {
  PITCH_DOWN: 0.08,
  PITCH_UP: -0.08,
  YAW: 0.25,
  SMILE: 0.35,
  JAW_OPEN: 0.1,
  BROW_UP: 0.5,
  CHEEK_PUFF: 0.1,
  WINK: 0.3,
  WINK_OPEN: 0.2,
};

function detectGestureFromResults(results) {
  const matrices = results.facialTransformationMatrixes;
  if (!matrices?.length) return null;

  const matrix = matrices[0];
  if (!matrix?.data) return null;

  const m = matrix.data;
  const pitch = Math.asin(Math.max(-1, Math.min(1, -m[9])));
  const yaw = Math.asin(Math.max(-1, Math.min(1, m[1])));

  const categories = results.faceBlendshapes?.[0]?.categories ?? [];
  const get = (name) =>
    categories.find((c) => c.categoryName === name)?.score ?? 0;

  const smileLeft = get("mouthSmileLeft");
  const smileRight = get("mouthSmileRight");
  const jawOpen = get("jawOpen");
  const browInnerUp = get("browInnerUp");
  const browOuterUpL = get("browOuterUpLeft");
  const browOuterUpR = get("browOuterUpRight");
  const cheekPuff = get("cheekPuff");
  const eyeBlinkL = get("eyeBlinkLeft");
  const eyeBlinkR = get("eyeBlinkRight");

  if (eyeBlinkR > UMBRALES.WINK && eyeBlinkL < UMBRALES.WINK_OPEN)
    return "WINK_RIGHT";
  if (eyeBlinkL > UMBRALES.WINK && eyeBlinkR < UMBRALES.WINK_OPEN)
    return "WINK_LEFT";

  // SMILE evaluado ANTES que JAW_OPEN y cabeza, para evitar falsos HEAD_DOWN
  if (smileLeft > UMBRALES.SMILE && smileRight > UMBRALES.SMILE) return "SMILE";

  if (jawOpen > UMBRALES.JAW_OPEN) return "JAW_OPEN";

  // Yaw evaluado ANTES que pitch, para evitar falsos HEAD_DOWN al girar
  if (yaw > UMBRALES.YAW) return "HEAD_RIGHT";
  if (yaw < -UMBRALES.YAW) return "HEAD_LEFT";

  if (pitch > UMBRALES.PITCH_DOWN) return "HEAD_DOWN";
  if (pitch < UMBRALES.PITCH_UP) return "HEAD_UP";

  const browsUp = (browInnerUp + browOuterUpL + browOuterUpR) / 3;
  if (browsUp > UMBRALES.BROW_UP) return "BROW_UP";

  if (cheekPuff > UMBRALES.CHEEK_PUFF) return "CHEEK_PUFF";

  return null;
}

// gestureMap: { NOMBRE_GESTO: NOMBRE_ACCION }
// Si no se pasa, onGesture recibe el nombre crudo del gesto
export function useGestureDetection({
  onGesture,
  gestureMap = null,
  enabled = true,
}) {
  const landmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const gestureStateRef = useRef({
    current: null,
    startTime: null,
    fired: false,
  });
  const gestureMapRef = useRef(gestureMap);

  // Mantiene la ref actualizada sin re-crear el loop
  useEffect(() => {
    gestureMapRef.current = gestureMap;
  }, [gestureMap]);

  const handleResults = useCallback(
    (results) => {
      const detected = detectGestureFromResults(results);
      const state = gestureStateRef.current;
      const now = Date.now();

      if (detected !== state.current) {
        gestureStateRef.current = {
          current: detected,
          startTime: detected ? now : null,
          fired: false,
        };
        return;
      }

      if (detected && !state.fired) {
        const elapsed = now - state.startTime;
        const HOLD_TIME = 700;
        if (elapsed >= HOLD_TIME) {
          gestureStateRef.current.fired = true;

          // Lookup en el mapa; si no hay mapa pasa el nombre crudo
          const accion = gestureMapRef.current?.[detected] ?? detected;
          onGesture?.(accion);
        }
      }
    },
    [onGesture],
  );

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    const video = document.createElement("video");
    video.style.cssText =
      "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;";
    document.body.appendChild(video);

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1,
      });

      if (stopped) {
        landmarker.close();
        return;
      }

      landmarkerRef.current = landmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      video.srcObject = stream;
      await video.play();

      let lastTime = -1;
      function detect() {
        if (stopped) return;
        if (video.currentTime !== lastTime) {
          lastTime = video.currentTime;
          const results = landmarker.detectForVideo(video, performance.now());
          handleResults(results);
        }
        animFrameRef.current = requestAnimationFrame(detect);
      }

      animFrameRef.current = requestAnimationFrame(detect);
    }

    init().catch((err) => console.error("[Mímica] FaceLandmarker error:", err));

    return () => {
      stopped = true;
      cancelAnimationFrame(animFrameRef.current);
      landmarkerRef.current?.close();
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((t) => t.stop());
      }
      document.body.removeChild(video);
    };
  }, [enabled, handleResults]);
}

export const useHeadGesture = useGestureDetection;
