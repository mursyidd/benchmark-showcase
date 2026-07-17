(() => {
  "use strict";

  const form = document.querySelector("#settings-form");
  const profileFields = document.querySelector("#profile-fields");
  const notificationFields = document.querySelector("#notification-fields");
  const email = document.querySelector("#email");
  const displayName = document.querySelector("#display-name");
  const unsavedWarning = document.querySelector("#unsaved-warning");
  const status = document.querySelector("#form-status");
  const saveButton = document.querySelector("#save-button");
  const cancelButton = document.querySelector("#cancel-button");

  const saveShouldFail = new URLSearchParams(window.location.search).get("save") === "fail";
  const controlledFields = [...form.elements].filter((element) => element.name);
  let savedValues = readValues();
  let saving = false;

  function readValues() {
    return Object.fromEntries(controlledFields.map((field) => [field.name, field.type === "checkbox" ? field.checked : field.value]));
  }

  function isDirty() {
    const currentValues = readValues();
    return Object.keys(savedValues).some((key) => currentValues[key] !== savedValues[key]);
  }

  function setDirtyState() {
    const dirty = isDirty();
    unsavedWarning.hidden = !dirty;
    return dirty;
  }

  function setStatus(type, message) {
    status.hidden = !message;
    status.className = `form-status${type ? ` is-${type}` : ""}`;
    if (!message) {
      status.textContent = "";
      return;
    }
    const icon = type === "success" ? "✓" : type === "error" ? "!" : "i";
    status.innerHTML = `<span class="status-icon" aria-hidden="true">${icon}</span><span>${message}</span>`;
    status.setAttribute("role", type === "error" ? "alert" : "status");
  }

  function clearStatus() {
    setStatus("", "");
  }

  function setFieldError(field, message) {
    const error = document.querySelector(`#${field.id}-error`);
    field.setAttribute("aria-invalid", "true");
    error.textContent = message;
    error.hidden = false;
  }

  function clearFieldError(field) {
    const error = document.querySelector(`#${field.id}-error`);
    field.removeAttribute("aria-invalid");
    error.textContent = "";
    error.hidden = true;
  }

  function validateField(field) {
    const value = field.value.trim();
    clearFieldError(field);

    if (!value) {
      setFieldError(field, "This field is required.");
      return false;
    }

    if (field === email) {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!validEmail) {
        setFieldError(field, "Enter an email address in the format name@example.com.");
        return false;
      }
    }
    return true;
  }

  function validateForm() {
    const emailIsValid = validateField(email);
    const displayNameIsValid = validateField(displayName);
    return emailIsValid && displayNameIsValid;
  }

  function setSavingState(nextSaving) {
    saving = nextSaving;
    form.setAttribute("aria-busy", String(nextSaving));
    profileFields.disabled = nextSaving;
    notificationFields.disabled = nextSaving;
    saveButton.disabled = nextSaving;
    cancelButton.disabled = nextSaving;
    saveButton.classList.toggle("is-saving", nextSaving);
  }

  function resetToSavedValues() {
    controlledFields.forEach((field) => {
      const value = savedValues[field.name];
      if (field.type === "checkbox") field.checked = value;
      else field.value = value;
    });
    clearFieldError(email);
    clearFieldError(displayName);
    clearStatus();
    setDirtyState();
  }

  controlledFields.forEach((field) => {
    const eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, () => {
      if (saving) return;
      clearStatus();
      setDirtyState();
    });
  });

  [email, displayName].forEach((field) => {
    field.addEventListener("blur", () => {
      if (field.value || field.hasAttribute("aria-invalid")) validateField(field);
    });
    field.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid")) validateField(field);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (saving) return;

    clearStatus();
    if (!validateForm()) {
      setStatus("error", "Review the highlighted fields before saving your changes.");
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setSavingState(true);
    setStatus("", "");

    window.setTimeout(() => {
      setSavingState(false);
      if (saveShouldFail) {
        setStatus("error", "We couldn’t save your changes. Check your connection and try again.");
        setDirtyState();
        saveButton.focus();
        return;
      }

      savedValues = readValues();
      setDirtyState();
      setStatus("success", "Your account settings have been saved.");
      saveButton.focus();
    }, 850);
  });

  cancelButton.addEventListener("click", () => {
    if (saving) return;
    if (isDirty() && !window.confirm("Discard your unsaved changes?")) return;
    resetToSavedValues();
    displayName.focus();
  });

  window.addEventListener("beforeunload", (event) => {
    if (!saving && isDirty()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
})();
