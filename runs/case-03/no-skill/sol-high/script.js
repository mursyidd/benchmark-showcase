(() => {
  "use strict";

  const form = document.querySelector("#settings-form");
  const saveButton = document.querySelector("#save-button");
  const saveLabel = saveButton.querySelector(".button-label");
  const cancelButton = document.querySelector("#cancel-button");
  const dirtyWarning = document.querySelector("#dirty-warning");
  const status = document.querySelector("#form-status");
  const discardDialog = document.querySelector("#discard-dialog");

  const trackedControls = [
    form.elements.email,
    form.elements.displayName,
    form.elements.timezone,
    form.elements.language,
    form.elements.productUpdates,
    form.elements.activitySummary
  ];

  const validatedControls = [
    form.elements.email,
    form.elements.displayName,
    form.elements.timezone,
    form.elements.language
  ];

  const errorIds = {
    email: "email-error",
    displayName: "display-name-error",
    timezone: "timezone-error",
    language: "language-error"
  };

  const touched = new Set();
  let baseline = takeSnapshot();
  let dirty = false;
  let saving = false;

  function takeSnapshot() {
    return {
      email: form.elements.email.value,
      displayName: form.elements.displayName.value,
      timezone: form.elements.timezone.value,
      language: form.elements.language.value,
      productUpdates: form.elements.productUpdates.checked,
      activitySummary: form.elements.activitySummary.checked
    };
  }

  function snapshotsMatch(left, right) {
    return Object.keys(left).every((key) => left[key] === right[key]);
  }

  function setDirty(nextDirty) {
    dirty = nextDirty;
    dirtyWarning.hidden = !dirty;
  }

  function updateDirtyState() {
    setDirty(!snapshotsMatch(takeSnapshot(), baseline));
  }

  function setStatus(type, message) {
    const icons = {
      saving: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5a7.5 7.5 0 1 0 7.5 7.5"/></svg>',
      success: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.5 3 3 7-7"/></svg>',
      error: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 6v4m0 3h.01M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/></svg>'
    };

    if (!type || !message) {
      status.hidden = true;
      status.className = "status";
      status.replaceChildren();
      return;
    }

    status.className = `status status--${type}`;
    status.innerHTML = `${icons[type]}<span>${message}</span>`;
    status.hidden = false;
  }

  function errorFor(control) {
    const value = control.value.trim();

    if (control.required && !value) {
      if (control.name === "email") return "Enter your email address.";
      if (control.name === "displayName") return "Enter your display name.";
      if (control.name === "timezone") return "Select your time zone.";
      if (control.name === "language") return "Select your language.";
    }

    if (control.name === "email" && !control.validity.valid) {
      return "Enter a valid email address, such as name@example.com.";
    }

    return "";
  }

  function renderValidation(control) {
    const message = errorFor(control);
    const errorElement = document.getElementById(errorIds[control.name]);
    errorElement.textContent = message;
    control.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  function validateForm() {
    let firstInvalid = null;

    validatedControls.forEach((control) => {
      touched.add(control.name);
      if (!renderValidation(control) && !firstInvalid) firstInvalid = control;
    });

    if (firstInvalid) {
      setStatus("error", "Some information needs your attention. Review the highlighted fields.");
      firstInvalid.focus();
      return false;
    }

    return true;
  }

  function setSaving(nextSaving) {
    saving = nextSaving;
    form.setAttribute("aria-busy", String(saving));
    trackedControls.forEach((control) => { control.disabled = saving; });
    cancelButton.disabled = saving;
    saveButton.disabled = saving;
    saveLabel.textContent = saving ? "Saving…" : "Save changes";
  }

  function restoreBaseline() {
    Object.entries(baseline).forEach(([name, value]) => {
      const control = form.elements[name];
      if (control.type === "checkbox") control.checked = value;
      else control.value = value;
    });

    touched.clear();
    validatedControls.forEach((control) => {
      document.getElementById(errorIds[control.name]).textContent = "";
      control.removeAttribute("aria-invalid");
    });
    setDirty(false);
    setStatus(null, null);
  }

  trackedControls.forEach((control) => {
    control.addEventListener("input", () => {
      updateDirtyState();
      if (touched.has(control.name) && errorIds[control.name]) renderValidation(control);
      if (!saving && !status.hidden) setStatus(null, null);
    });

    control.addEventListener("change", () => {
      updateDirtyState();
      if (touched.has(control.name) && errorIds[control.name]) renderValidation(control);
      if (!saving && !status.hidden) setStatus(null, null);
    });
  });

  validatedControls.forEach((control) => {
    control.addEventListener("blur", () => {
      touched.add(control.name);
      renderValidation(control);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (saving || !validateForm()) return;

    setSaving(true);
    setStatus("saving", "Saving your account settings…");

    window.setTimeout(() => {
      const shouldFail = form.elements.email.value.trim().toLowerCase() === "save-failure@example.com";
      setSaving(false);

      if (shouldFail) {
        setStatus("error", "We couldn’t save your changes. Your entries are still here—please try again.");
        saveButton.focus();
        return;
      }

      baseline = takeSnapshot();
      setDirty(false);
      setStatus("success", "Account settings saved successfully.");
      saveButton.focus();
    }, 900);
  });

  cancelButton.addEventListener("click", () => {
    if (!dirty) {
      restoreBaseline();
      setStatus("success", "No unsaved changes to discard.");
      return;
    }

    if (typeof discardDialog.showModal === "function") {
      discardDialog.showModal();
    } else if (window.confirm("Discard unsaved changes?")) {
      restoreBaseline();
      form.elements.email.focus();
    }
  });

  discardDialog.addEventListener("close", () => {
    if (discardDialog.returnValue === "discard") {
      restoreBaseline();
      form.elements.email.focus();
    } else {
      cancelButton.focus();
    }
  });

  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
})();
