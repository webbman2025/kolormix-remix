/// <reference types="vite/client" />

interface Window {
  onDeviceShake?: () => void;
  webkit?: {
    messageHandlers?: {
      storekit?: { postMessage: (msg: unknown) => void };
    };
  };
}
