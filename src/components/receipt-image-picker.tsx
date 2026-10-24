"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./estock-app.module.css";

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const MAX_CANVAS_EDGE = 3200;
const MAX_CANVAS_PIXELS = 8_000_000;
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function jpegFromCanvas(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && SUPPORTED_TYPES.has(blob.type)) resolve(blob);
        else reject(new Error("The photo could not be prepared. Try again or use Upload file."));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function resizedJpeg(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): Promise<Blob> {
  if (!sourceWidth || !sourceHeight)
    throw new Error("This image could not be read. Choose another photo.");
  const scale = Math.min(
    1,
    MAX_CANVAS_EDGE / Math.max(sourceWidth, sourceHeight),
    Math.sqrt(MAX_CANVAS_PIXELS / (sourceWidth * sourceHeight)),
  );
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  try {
    for (const reduction of [1, 0.85, 0.7]) {
      canvas.width = Math.max(1, Math.round(width * reduction));
      canvas.height = Math.max(1, Math.round(height * reduction));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This photo could not be prepared. Try another photo.");
      context.imageSmoothingQuality = "high";
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.9, 0.82]) {
        const converted = await jpegFromCanvas(canvas, quality);
        if (converted.size > 0 && converted.size <= MAX_IMAGE_BYTES) return converted;
      }
    }
    throw new Error(
      "This photo could not be reduced below 6 MB while keeping the text readable. Crop or retake it closer, then try again.",
    );
  } finally {
    canvas.width = canvas.height = 0;
  }
}

async function supportedImage(file: File): Promise<File> {
  if (!file.size) throw new Error("The image is empty. Take another photo or choose another file.");
  if (file.size > MAX_SOURCE_BYTES)
    throw new Error("This photo is larger than 40 MB. Choose a smaller image or retake it.");
  if (SUPPORTED_TYPES.has(file.type) && file.size <= MAX_IMAGE_BYTES) return file;
  if (!file.type.startsWith("image/") && !/\.(heic|heif|avif)$/i.test(file.name)) {
    throw new Error("Choose a JPEG, PNG or WebP receipt image.");
  }
  const source = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error(
            "This photo format cannot be read in this browser. Use Upload file to choose a JPEG, PNG or WebP image.",
          ),
        );
      image.src = source;
    });
    const converted = await resizedJpeg(image, image.naturalWidth, image.naturalHeight);
    return new File([converted], converted.type === "image/png" ? "receipt.png" : "receipt.jpg", {
      type: converted.type,
    });
  } finally {
    image.src = "";
    URL.revokeObjectURL(source);
  }
}

function cameraError(cause: unknown): string {
  if (cause instanceof DOMException) {
    if (cause.name === "NotAllowedError" || cause.name === "SecurityError") {
      return "Camera permission was denied. Allow camera access and try Take photo again, or use Upload file.";
    }
    if (cause.name === "NotFoundError" || cause.name === "OverconstrainedError") {
      return "No usable camera was found. Connect a camera or use Upload file.";
    }
    if (cause.name === "NotReadableError") {
      return "The camera is busy or unavailable. Close other camera apps and try again, or use Upload file.";
    }
  }
  return "The camera could not open. Try again or use Upload file to choose a saved image.";
}

export function ReceiptImagePicker({
  file,
  onChange,
  disabled,
  allowCamera = true,
  uploadLabel = "Upload file",
  previewAlt = "Selected receipt for review before creating a draft",
  previewDescription = "Check that the date, product names and quantities are readable. This image stays only in this page until you create a draft or leave.",
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled: boolean;
  allowCamera?: boolean;
  uploadLabel?: string;
  previewAlt?: string;
  previewDescription?: string;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const cameraTrigger = useRef<HTMLButtonElement>(null);
  const retryTrigger = useRef<HTMLButtonElement>(null);
  const cameraPanel = useRef<HTMLDivElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const cameraVersion = useRef(0);
  const imageVersion = useRef(0);
  const [camera, setCamera] = useState<"closed" | "opening" | "open">("closed");
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);
  const [error, setError] = useState("");
  const cameraVisible = camera !== "closed";

  const releaseCamera = useCallback(() => {
    cameraVersion.current++;
    const activeStream = stream.current;
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    activeStream?.getTracks().forEach((track) => {
      track.stop();
    });
  }, []);
  const closeCamera = useCallback(() => {
    releaseCamera();
    setCamera("closed");
    setActiveCameraId(null);
    setVideoReady(false);
  }, [releaseCamera]);
  const closeCameraAndFocus = () => {
    closeCamera();
    requestAnimationFrame(() =>
      (file ? retryTrigger : cameraTrigger).current?.focus({ preventScroll: true }),
    );
  };

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const wasUsingCamera = video.current !== null;
    setPreviewHeight(video.current?.getBoundingClientRect().height ?? null);
    setPreview(url);
    closeCamera();
    if (wasUsingCamera)
      requestAnimationFrame(() => retryTrigger.current?.focus({ preventScroll: true }));
    return () => URL.revokeObjectURL(url);
  }, [file, closeCamera]);

  useEffect(() => {
    if (!cameraVisible || !cameraPanel.current) return;
    const panel = cameraPanel.current;
    const fitCamera = () => {
      const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      panel.style.height = `${Math.max(160, viewportHeight - headerHeight - 32)}px`;
      window.scrollTo({
        top: Math.max(0, window.scrollY + panel.getBoundingClientRect().top - headerHeight - 16),
        behavior: "instant",
      });
    };
    fitCamera();
    panel.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    window.addEventListener("resize", fitCamera);
    window.visualViewport?.addEventListener("resize", fitCamera);
    return () => {
      window.removeEventListener("resize", fitCamera);
      window.visualViewport?.removeEventListener("resize", fitCamera);
    };
  }, [cameraVisible]);

  useEffect(() => {
    const nativeInput = cameraInput.current;
    const cancelPhoto = () =>
      setError("No photo was selected. Try Take photo again or use Upload file.");
    const leaveCamera = () => {
      if (document.hidden) closeCamera();
    };
    nativeInput?.addEventListener("cancel", cancelPhoto);
    document.addEventListener("visibilitychange", leaveCamera);
    return () => {
      imageVersion.current++;
      releaseCamera();
      nativeInput?.removeEventListener("cancel", cancelPhoto);
      document.removeEventListener("visibilitychange", leaveCamera);
    };
  }, [closeCamera, releaseCamera]);

  async function chooseImage(selected: File | undefined) {
    if (!selected || disabled) return;
    const version = ++imageVersion.current;
    setError("");
    setPreparing(true);
    try {
      const image = await supportedImage(selected);
      if (version === imageVersion.current) onChange(image);
    } catch (cause) {
      if (version === imageVersion.current)
        setError(cause instanceof Error ? cause.message : "Choose another receipt image.");
    } finally {
      if (version === imageVersion.current) setPreparing(false);
    }
  }

  async function takePhoto(deviceId?: string) {
    if (disabled || preparing) return;
    closeCamera();
    setError("");
    const phone =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    if (phone) {
      cameraInput.current?.click();
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera preview needs a supported browser on HTTPS or localhost. Upload file is still available.",
      );
      return;
    }
    setCamera("opening");
    const version = cameraVersion.current;
    try {
      const opened = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: { ideal: "environment" } }),
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (version !== cameraVersion.current) {
        opened.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      stream.current = opened;
      opened.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (stream.current === opened) {
            closeCameraAndFocus();
            setError("The camera disconnected. Try Take photo again or use Upload file.");
          }
        });
      });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (version !== cameraVersion.current) return;
      if (!video.current) {
        closeCameraAndFocus();
        setError("The camera preview could not open. Try again or use Upload file.");
        return;
      }
      video.current.srcObject = opened;
      await video.current.play();
      if (version === cameraVersion.current) {
        setCamera("open");
        setActiveCameraId(opened.getVideoTracks()[0]?.getSettings().deviceId || deviceId || null);
      }
    } catch (cause) {
      if (version === cameraVersion.current) {
        closeCameraAndFocus();
        setError(cameraError(cause));
      }
    }
  }

  async function switchCamera() {
    if (camera !== "open" || disabled || preparing) return;
    const version = cameraVersion.current;
    let devices: MediaDeviceInfo[];
    try {
      devices = await navigator.mediaDevices.enumerateDevices();
    } catch {
      if (version === cameraVersion.current)
        setError("Camera sources could not be listed. Keep this camera or use Upload file.");
      return;
    }
    if (version !== cameraVersion.current) return;
    const cameras = devices.filter((device) => device.kind === "videoinput" && device.deviceId);
    if (cameras.length < 2) {
      setError("Only one camera is available. Keep this camera or use Upload file.");
      return;
    }
    const index = cameras.findIndex((device) => device.deviceId === activeCameraId);
    await takePhoto(cameras[(index + 1) % cameras.length].deviceId);
  }

  async function capturePhoto() {
    if (!video.current || !videoReady || disabled || preparing) return;
    const version = ++imageVersion.current;
    setPreparing(true);
    setError("");
    try {
      const photo = await resizedJpeg(
        video.current,
        video.current.videoWidth,
        video.current.videoHeight,
      );
      if (version === imageVersion.current) {
        onChange(
          new File([photo], photo.type === "image/png" ? "receipt.png" : "receipt.jpg", {
            type: photo.type,
          }),
        );
      }
    } catch (cause) {
      if (version === imageVersion.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "The photo could not be taken. Try again or use Upload file.",
        );
    } finally {
      if (version === imageVersion.current) setPreparing(false);
    }
  }

  return (
    <div className={styles.receiptCapture}>
      <div className={styles.captureActions}>
        {allowCamera && (
          <button
            ref={cameraTrigger}
            className={styles.secondaryButton}
            type="button"
            disabled={disabled || preparing || camera !== "closed"}
            onClick={() => void takePhoto()}
          >
            Take photo
          </button>
        )}
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={disabled || preparing}
          onClick={() => {
            closeCamera();
            setError("");
            uploadInput.current?.click();
          }}
        >
          {file ? "Change file" : uploadLabel}
        </button>
      </div>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        disabled={disabled || preparing}
        aria-label="Take a receipt photo"
        onChange={(event) => {
          void chooseImage(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={uploadInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif"
        hidden
        disabled={disabled || preparing}
        aria-label="Upload a receipt image"
        onChange={(event) => {
          void chooseImage(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <p className={styles.smallCopy}>
        JPEG, PNG or WebP. Larger photos and other camera formats are resized in your browser to fit
        the 6 MB scan limit when they can be read.
      </p>
      {camera !== "closed" && (
        <div ref={cameraPanel} className={styles.cameraPanel} aria-busy={preparing}>
          <video
            ref={video}
            className={styles.receiptPreview}
            autoPlay
            muted
            playsInline
            aria-label="Live receipt camera preview"
            onCanPlay={() => setVideoReady(true)}
          />
          <p role="status">
            {camera === "opening"
              ? "Opening camera. Your browser may ask for permission."
              : "Keep the receipt date, names and quantities in view."}
          </p>
          <div className={styles.captureActions}>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={disabled || preparing || !videoReady}
              onClick={() => void capturePhoto()}
            >
              {preparing ? "Preparing image…" : "Take picture"}
            </button>
            {camera === "open" && (
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={disabled || preparing || !videoReady}
                onClick={() => void switchCamera()}
              >
                Switch camera
              </button>
            )}
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={preparing}
              onClick={closeCameraAndFocus}
            >
              Cancel camera
            </button>
          </div>
        </div>
      )}
      {camera === "closed" && preview && file && (
        <figure className={styles.receiptFigure}>
          {/* biome-ignore lint/performance/noImgElement: A local blob preview must stay in the browser and bypass image optimization. */}
          <img
            className={styles.receiptPreview}
            src={preview}
            width={1200}
            height={900}
            style={previewHeight ? { height: previewHeight, maxHeight: "none" } : undefined}
            alt={previewAlt}
            onError={() => {
              onChange(null);
              setError(
                "This image could not be previewed. Take another photo or choose a different file.",
              );
            }}
          />
          <figcaption>{previewDescription}</figcaption>
          <div className={styles.captureActions}>
            {allowCamera && (
              <button
                ref={retryTrigger}
                className={styles.secondaryButton}
                type="button"
                disabled={disabled || preparing}
                onClick={() => void takePhoto()}
              >
                Retake photo
              </button>
            )}
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={disabled || preparing}
              onClick={() => {
                imageVersion.current++;
                onChange(null);
                setError("");
                requestAnimationFrame(() => cameraTrigger.current?.focus({ preventScroll: true }));
              }}
            >
              Remove image
            </button>
          </div>
        </figure>
      )}
      {camera === "closed" && preparing && <p role="status">Preparing image…</p>}
      {error && (
        <div className={styles.errorNotice} role="alert">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
