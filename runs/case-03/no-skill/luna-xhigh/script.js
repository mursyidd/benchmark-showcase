(function () {
  "use strict";

  const form = document.getElementById("settings-form");
  const email = document.getElementById("email");
  const displayName = document.getElementById("display-name");
  const timezone = document.getElementById("timezone");
  const language = document.getElementById("language");
  const notificationInputs = Array.from(form.querySelectorAll('input[type="checkbox"]'));
  const editableFields = [email, displayName, timezone, language, ...notificationInputs];
  const saveButton = document.getElementById("save-button");
  const saveButtonLabel = document.getElementById("save-button-label");
  const cancelButton = document.getElementById("cancel-button");
  const simulationMode = document.getElementById("simulation-mode");
  const unsavedWarning = document.getElementById("unsaved-warning");
  const feedback = document.getElementById("form-feedback");
  const feedbackIcon = document.getElementById("feedback-icon");
  const feedbackTitle = document.getElementById("feedback-title");
  const feedbackMessage = document.getElementById("feedback-message");

  let savedState = readFormState();
  let isSaving = false;
  let saveRun = 0;

  function readFormState() {
    return {
      email: email.value,
      displayName: displayName.value,
      timezone: timezone.value,
      language: language.value,
      productUpdates: document.getElementById("product-updates").checked,
      securityAlerts: document.getElementById("security-alerts").checked,
      weeklyDigest: document.getElementById("weekly-digest").checked
    };
  }

  function hasUnsavedChanges() {
    return JSON.stringify(readFormState()) !== JSON.stringify(savedState);
  }

  function updateDirtyState() {
    const dirty = hasUnsavedChanges();
    unsavedWarning.hidden = !dirty;
    cancelButton.disabled = !dirty || isSaving;
    form.dataset.dirty = String(dirty);
    return dirty;
  }

  function fieldErrorElement(field) {
    return document.getElementById(field.id + "-error");
  }

  function setFieldError(field, message) {
    const errorElement = fieldErrorElement(field);
    if (!errorElement) return;

    if (message) {
      errorElement.textContent = message;
      errorElement.hidden = false;
      field.setAttribute("aria-invalid", "true");
      return;
    }

    errorElement.textContent = "";
    errorElement.hidden = true;
    field.removeAttribute("aria-invalid");
  }

  function validateField(field) {
    const value = field.value.trim();

    if (field.required && !value) {
      setFieldError(field, field.id === "email" ? "Enter your email address." : "Choose a value for this field.");
      return false;
    }

    if (field.type === "email" && value && !field.validity.valid) {
      setFieldError(field, "Enter a valid email address, such as name@example.com.");
      return false;
    }

    setFieldError(field, "");
    return true;
  }

  function validateAll() {
    const validity = [email, displayName, timezone, language].map(validateField);
    return validity.every(Boolean);
  }

  function showFeedback(kind, title, message) {
    feedback.className = "feedback " + kind;
    feedback.setAttribute("role", kind === "success" ? "status" : "alert");
    feedback.setAttribute("aria-live", kind === "success" ? "polite" : "assertive");
    feedbackIcon.textContent = kind === "success" ? "✓" : "!";
    feedbackTitle.textContent = title;
    feedbackMessage.textContent = message;
    feedback.hidden = false;
  }

  function clearFeedback() {
    feedback.hidden = true;
    feedback.className = "feedback";
    feedbackTitle.textContent = "";
    feedbackMessage.textContent = "";
    feedbackIcon.textContent = "";
  }

  function normalizeValues() {
    email.value = email.value.trim();
    displayName.value = displayName.value.trim();
  }

  function setSavingState(saving) {
    isSaving = saving;
    form.setAttribute("aria-busy", String(saving));
    saveButton.disabled = saving;
    cancelButton.disabled = saving || !hasUnsavedChanges();
    simulationMode.disabled = saving;
    editableFields.forEach(function (field) {
      field.disabled = saving;
    });

    saveButton.classList.toggle("is-saving", saving);
    saveButtonLabel.textContent = saving ? "Saving changes…" : "Save changes";
  }

  function resetToSavedState() {
    email.value = savedState.email;
    displayName.value = savedState.displayName;
    timezone.value = savedState.timezone;
    language.value = savedState.language;
    document.getElementById("product-updates").checked = savedState.productUpdates;
    document.getElementById("security-alerts").checked = savedState.securityAlerts;
    document.getElementById("weekly-digest").checked = savedState.weeklyDigest;
    [email, displayName, timezone, language].forEach(function (field) {
      setFieldError(field, "");
    });
    updateDirtyState();
  }

  editableFields.forEach(function (field) {
    const eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, function () {
      if (fieldErrorElement(field) && field.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
      updateDirtyState();
      clearFeedback();
    });

    if (field.type !== "checkbox") {
      field.addEventListener("blur", function () {
        if (field.value.trim() || field.getAttribute("aria-invalid") === "true") {
          validateField(field);
        }
      });
    }
  });

  cancelButton.addEventListener("click", function () {
    if (!hasUnsavedChanges()) {
      showFeedback("success", "No changes to discard", "Your saved account settings are unchanged.");
      feedback.focus();
      return;
    }

    resetToSavedState();
    showFeedback("success", "Changes discarded", "Your account settings have been restored to the last saved version.");
    feedback.focus();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (isSaving) return;

    clearFeedback();
    if (!validateAll()) {
      showFeedback("validation", "Check your information", "Correct the highlighted fields before saving.");
      const firstInvalid = [email, displayName, timezone, language].find(function (field) {
        return field.getAttribute("aria-invalid") === "true";
      });
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    normalizeValues();
    updateDirtyState();
    setSavingState(true);
    const thisRun = ++saveRun;

    window.setTimeout(function () {
      if (thisRun !== saveRun) return;

      if (simulationMode.value === "failure") {
        setSavingState(false);
        updateDirtyState();
        showFeedback("failure", "Could not save changes", "This simulated request failed. Your edits are still here—try again or choose Simulate success.");
        feedback.focus();
        return;
      }

      savedState = readFormState();
      setSavingState(false);
      updateDirtyState();
      showFeedback("success", "Changes saved", "Your account settings are up to date.");
      feedback.focus();
    }, 850);
  });

  window.addEventListener("beforeunload", function (event) {
    if (!hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = "You have unsaved changes.";
  });

  document.querySelectorAll('.settings-nav-link[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (!hasUnsavedChanges()) return;
      const proceed = window.confirm("You have unsaved changes. Continue viewing another settings section?");
      if (!proceed) event.preventDefault();
    });
  });

  updateDirtyState();
})();
