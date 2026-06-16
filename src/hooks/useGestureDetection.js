import { useEffect, useRef, useCallback } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const HOLD_TIME = 700;
const PITCH_DOWN = 0.035;
const PITCH_UP = -0.03;
const SMILE_THRESHOLD = 0.1;
const JAW_OPEN_THRESHOLD = 0.5;

function detectGestureFromResults(results) {
  const matrices = results.facialTransformationMatrixes;
  if (!matrices?.length) return null;

  const matrix = matrices[0];
  if (!matrix?.data) return null;

  const m = matrix.data;
  const pitch = Math.asin(Math.max(-1, Math.min(1, -m[9])));

  const categories = results.faceBlendshapes?.[0]?.categories ?? [];
  const get = (name) =>
    categories.find((c) => c.categoryName === name)?.score ?? 0;

  const smileLeft = get("mouthSmileLeft");
  const smileRight = get("mouthSmileRight");
  const jawOpen = get("jawOpen");

  if (pitch > PITCH_DOWN) return "HEAD_DOWN";
  if (pitch < PITCH_UP) return "HEAD_UP";
  if (smileRight > SMILE_THRESHOLD) return "HEAD_RIGHT";
  if (smileLeft > SMILE_THRESHOLD) return "HEAD_LEFT";
  if (jawOpen > JAW_OPEN_THRESHOLD) return "JAW_OPEN";
  return null;
}

export function useGestureDetection({ onGesture, enabled = true }) {
  const landmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const gestureStateRef = useRef({
    current: null,
    startTime: null,
    fired: false,
  });

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
        if (elapsed >= HOLD_TIME) {
          gestureStateRef.current.fired = true;
          onGesture?.(detected);
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
