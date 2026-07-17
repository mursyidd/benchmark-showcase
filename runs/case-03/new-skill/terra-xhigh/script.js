(function () {
  "use strict";

  const form = document.querySelector("#account-form");
  const statusRegion = document.querySelector("#status-region");
  const unsavedWarning = document.querySelector("#unsaved-warning");
  const saveButton = document.querySelector("#save-button");
  const cancelButton = document.querySelector("#cancel-button");
  const saveLabel = saveButton.querySelector(".button-label");
  const formControls = Array.from(form.querySelectorAll("input, select"));
  const failureMode = new URLSearchParams(window.location.search).get("save") === "failure";
  let savedState = captureState();
  let saving = false;

  function captureState() {
    return formControls.reduce((state, control) => {
      state[control.name] = control.type === "checkbox" ? control.checked : control.value.trim();
      return state;
    }, {});
  }

  function statesMatch(first, second) {
    return Object.keys(first).every((name) => first[name] === second[name]);
  }

  function isDirty() {
    return !statesMatch(captureState(), savedState);
  }

  function updateDirtyState() {
    const dirty = isDirty();
    unsavedWarning.hidden = !dirty;
    form.dataset.dirty = String(dirty);
  }

  function fieldElements(fieldName) {
    const field = document.querySelector(`[data-field="${fieldName}"]`);
    if (!field) return {};
    return {
      field,
      control: field.querySelector("input, select"),
      error: field.querySelector(".field-error"),
    };
  }

  function setFieldError(fieldName, message) {
    const { field, control, error } = fieldElements(fieldName);
    if (!field || !control || !error) return;
    error.textContent = message;
    control.setAttribute("aria-invalid", "true");
    field.classList.add("is-invalid");
  }

  function clearFieldError(fieldName) {
    const { field, control, error } = fieldElements(fieldName);
    if (!field || !control || !error) return;
    error.textContent = "";
    control.removeAttribute("aria-invalid");
    field.classList.remove("is-invalid");
  }

  function clearAllErrors() {
    clearFieldError("email");
    clearFieldError("displayName");
  }

  function validateField(fieldName) {
    const { control } = fieldElements(fieldName);
    if (!control) return true;
    const value = control.value.trim();

    if (!value) {
      setFieldError(fieldName, `${fieldName === "email" ? "Email address" : "Display name"} is required.`);
      return false;
    }

    if (fieldName === "email" && !control.validity.valid) {
      setFieldError("email", "Enter a valid email address, for example demo@example.invalid.");
      return false;
    }

    clearFieldError(fieldName);
    return true;
  }

  function validateForm() {
    const emailValid = validateField("email");
    const nameValid = validateField("displayName");
    return emailValid && nameValid;
  }

  function showStatus(kind, title, detail) {
    statusRegion.innerHTML = "";
    const message = document.createElement("div");
    message.className = `status-message is-${kind}`;
    message.setAttribute("role", kind === "failure" ? "alert" : "status");
    const icon = kind === "success" ? "✓" : kind === "failure" ? "!" : "…";
    message.innerHTML = `
      <span class="status-icon" aria-hidden="true">${icon}</span>
      <span><strong>${title}</strong>${detail}</span>
    `;
    statusRegion.appendChild(message);
  }

  function clearStatus() {
    statusRegion.innerHTML = "";
  }

  function setSaving(isSaving) {
    saving = isSaving;
    form.setAttribute("aria-busy", String(isSaving));
    form.classList.toggle("is-saving", isSaving);
    formControls.forEach((control) => { control.disabled = isSaving; });
    saveButton.disabled = isSaving;
    cancelButton.disabled = isSaving;
    saveLabel.textContent = isSaving ? "Saving changes…" : "Save changes";
  }

  function restoreSavedValues() {
    formControls.forEach((control) => {
      const value = savedState[control.name];
      if (control.type === "checkbox") {
        control.checked = value;
      } else {
        control.value = value;
      }
    });
    clearAllErrors();
    clearStatus();
    updateDirtyState();
  }

  form.addEventListener("input", (event) => {
    if (event.target.matches("input, select")) {
      if (event.target.name === "email") validateField("email");
      if (event.target.name === "displayName") validateField("displayName");
      clearStatus();
      updateDirtyState();
    }
  });

  form.addEventListener("change", (event) => {
    if (event.target.matches("input, select")) {
      clearStatus();
      updateDirtyState();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearStatus();

    if (!validateForm()) {
      const firstInvalid = form.querySelector("[aria-invalid=\"true\"]");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    showStatus("saving", "Saving changes…", "Your account settings are being updated.");
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);

      if (failureMode) {
        showStatus("failure", "Changes could not be saved.", "Your updates are still here. Check your connection and try again.");
        saveButton.focus();
        return;
      }

      savedState = captureState();
      updateDirtyState();
      showStatus("success", "Changes saved.", "Your account settings are up to date.");
      saveButton.focus();
    }, 900);
  });

  cancelButton.addEventListener("click", () => {
    if (!isDirty()) {
      clearStatus();
      return;
    }
    restoreSavedValues();
    showStatus("success", "Changes discarded.", "Your form has been restored to the last saved settings.");
    cancelButton.focus();
  });

  window.addEventListener("beforeunload", (event) => {
    if (isDirty() && !saving) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  updateDirtyState();
})();
