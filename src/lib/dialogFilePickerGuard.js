/** Prevent modal dialogs from closing when the native OS file picker steals focus. */

export function createDialogFilePickerGuard() {
  let pickerActive = false;
  let focusListener = null;

  function clearFocusListener() {
    if (focusListener) {
      window.removeEventListener("focus", focusListener);
      focusListener = null;
    }
  }

  function markPickerClosed() {
    pickerActive = false;
    clearFocusListener();
  }

  function openFileInput(inputEl) {
    if (!inputEl) return;
    pickerActive = true;
    clearFocusListener();
    focusListener = () => {
      window.setTimeout(markPickerClosed, 400);
    };
    window.addEventListener("focus", focusListener, { once: true });
    window.requestAnimationFrame(() => {
      inputEl.click();
    });
  }

  /** Return true when a close attempt should be ignored. */
  function shouldBlockClose() {
    return pickerActive;
  }

  function onFileInputChange(handler) {
    return (event) => {
      markPickerClosed();
      handler?.(event);
    };
  }

  return {
    openFileInput,
    shouldBlockClose,
    onFileInputChange,
    markPickerClosed,
  };
}
