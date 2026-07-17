(function () {
  "use strict";

  const form = document.getElementById("account-form");
  const profileFields = document.getElementById("profile-fields");
  const notificationFields = document.getElementById("notification-fields");
  const dirtyBanner = document.getElementById("dirty-banner");
  const validationSummary = document.getElementById("validation-summary");
  const validationSummaryText = document.getElementById("validation-summary-text");
  const feedback = document.getElementById("feedback");
  const saveButton = document.getElementById("save-button");
  const cancelButton = document.getElementById("cancel-button");
  const saveMeta = document.getElementById("save-meta");
  const savingNote = document.getElementById("saving-note");
  const saveOutcome = document.getElementById("save-outcome");
  const fieldInputs = [
    document.getElementById("display-name"),
    document.getElementById("email"),
    document.getElementById("time-zone"),
    document.getElementById("language"),
    document.getElementById("product-updates"),
    document.getElementById("security-alerts"),
    document.getElementById("weekly-digest")
  ];

  const initialAccount = {
    displayName: "Mara Ellison",
    email: "demo@example.invalid",
    timeZone: "America/Los_Angeles",
    language: "en-US",
    productUpdates: true,
    securityAlerts: true,
    weeklyDigest: false
  };

  let savedSnapshot = serializeAccount(initialAccount);
  let saving = false;

  function serializeAccount(account) {
    return JSON.stringify(account);
  }

  function readAccount() {
    return {
      displayName: document.getElementById("display-name").value.trim(),
      email: document.getElementById("email").value.trim(),
      timeZone: document.getElementById("time-zone").value,
      language: document.getElementById("language").value,
      productUpdates: document.getElementById("product-updates").checked,
      securityAlerts: document.getElementById("security-alerts").checked,
      weeklyDigest: document.getElementById("weekly-digest").checked
    };
  }

  function writeAccount(account) {
    document.getElementById("display-name").value = account.displayName;
    document.getElementById("email").value = account.email;
    document.getElementById("time-zone").value = account.timeZone;
    document.getElementById("language").value = account.language;
    document.getElementById("product-updates").checked = account.productUpdates;
    document.getElementById("security-alerts").checked = account.securityAlerts;
    document.getElementById("weekly-digest").checked = account.weeklyDigest;
    updateToggleLabels();
  }

  function isDirty() {
    return serializeAccount(readAccount()) !== savedSnapshot;
  }

  function updateDirtyState() {
    const dirty = isDirty();
    dirtyBanner.hidden = !dirty;
    cancelButton.disabled = saving || !dirty;
    saveButton.disabled = saving || !dirty;
    form.dataset.dirty = String(dirty);
    return dirty;
  }

  function updateToggleLabels() {
    document.querySelectorAll(".toggle-wrap input[type='checkbox']").forEach(function (input) {
      const state = document.getElementById(input.getAttribute("aria-describedby"));
      if (state) {
        state.textContent = input.checked ? "On" : "Off";
      }
    });
  }

  function fieldErrorElement(input) {
    return document.getElementById(input.id + "-error");
  }

  function setFieldError(input, message) {
    const error = fieldErrorElement(input);
    const hasError = Boolean(message);
    input.setAttribute("aria-invalid", String(hasError));
    if (hasError) {
      error.textContent = message;
      error.hidden = false;
    } else {
      error.textContent = "";
      error.hidden = true;
    }
  }

  function validateField(input) {
    if (input.id === "display-name") {
      setFieldError(input, input.value.trim() ? "" : "Add a display name so teammates can identify you.");
      return input.value.trim() !== "";
    }

    if (input.id === "email") {
      const email = input.value.trim();
      if (!email) {
        setFieldError(input, "Enter an email address for account notices.");
        return false;
      }
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
      setFieldError(input, validEmail ? "" : "Enter a valid email address, such as demo@example.invalid.");
      return validEmail;
    }

    return true;
  }

  function validateForm() {
    const errors = fieldInputs.filter(function (input) {
      return input.type !== "checkbox" && !validateField(input);
    });

    validationSummary.hidden = errors.length === 0;
    validationSummaryText.textContent = errors.length === 1
      ? "There is 1 field to correct before saving."
      : "There are " + errors.length + " fields to correct before saving.";

    return errors;
  }

  function clearValidation() {
    fieldInputs.forEach(function (input) {
      if (fieldErrorElement(input)) {
        setFieldError(input, "");
      }
    });
    validationSummary.hidden = true;
  }

  function showFeedback(state, title, message) {
    feedback.dataset.state = state;
    feedback.innerHTML = "<div><strong>" + title + "</strong><span>" + message + "</span></div>";
    feedback.hidden = false;
  }

  function clearFeedback() {
    feedback.hidden = true;
    feedback.textContent = "";
    delete feedback.dataset.state;
  }

  function setSavingState(isSaving) {
    saving = isSaving;
    form.classList.toggle("is-saving", isSaving);
    form.setAttribute("aria-busy", String(isSaving));
    profileFields.disabled = isSaving;
    notificationFields.disabled = isSaving;
    saveOutcome.disabled = isSaving;
    saveButton.setAttribute("aria-label", isSaving ? "Saving account settings" : "Save changes");
    saveButton.querySelector(".button-label").textContent = isSaving ? "Saving…" : "Save changes";
    savingNote.hidden = !isSaving;
    if (!isSaving) {
      saveMeta.hidden = false;
    }
    updateDirtyState();
  }

  function resetToSaved() {
    writeAccount(JSON.parse(savedSnapshot));
    clearValidation();
    clearFeedback();
    saveMeta.textContent = "Last saved today at 09:42";
    updateDirtyState();
    dirtyBanner.hidden = true;
    document.getElementById("display-name").focus();
  }

  function completeSave() {
    const outcome = saveOutcome.value;
    if (outcome === "failure") {
      setSavingState(false);
      showFeedback("failure", "Save failed", "We couldn’t reach Northline right now. Your changes are still here—try saving again.");
      saveMeta.hidden = true;
      saveOutcome.value = "success";
      saveButton.focus();
      return;
    }

    savedSnapshot = serializeAccount(readAccount());
    setSavingState(false);
    clearValidation();
    updateDirtyState();
    saveMeta.hidden = false;
    saveMeta.textContent = "Last saved just now";
    saveOutcome.value = "success";
    showFeedback("success", "Changes saved", "Your account details and notification preferences are up to date.");
    saveButton.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (saving) {
      return;
    }

    clearFeedback();
    const errors = validateForm();
    if (errors.length) {
      showFeedback("failure", "Save blocked", "Correct the highlighted fields, then try again.");
      errors[0].focus();
      return;
    }

    setSavingState(true);
    window.setTimeout(completeSave, 900);
  }

  fieldInputs.forEach(function (input) {
    input.addEventListener("input", function () {
      if (input.id === "display-name" || input.id === "email") {
        validateField(input);
      }
      clearFeedback();
      updateDirtyState();
    });
    input.addEventListener("change", function () {
      if (input.id === "display-name" || input.id === "email") {
        validateField(input);
      }
      updateToggleLabels();
      clearFeedback();
      updateDirtyState();
    });
  });

  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", function (event) {
    event.preventDefault();
    if (saving) {
      return;
    }
    resetToSaved();
    showFeedback("success", "Changes discarded", "The form is back to the last saved version.");
  });

  saveOutcome.addEventListener("change", function () {
    saveOutcome.dataset.selected = saveOutcome.value;
  });

  const requestedOutcome = new URLSearchParams(window.location.search).get("save");
  if (requestedOutcome === "failure" || requestedOutcome === "fail") {
    saveOutcome.value = "failure";
  }

  window.addEventListener("beforeunload", function (event) {
    if (isDirty() && !saving) {
      event.preventDefault();
      event.returnValue = "You have unsaved account changes.";
    }
  });

  document.querySelectorAll(".settings-link").forEach(function (link) {
    link.addEventListener("click", function () {
      document.querySelectorAll(".settings-link").forEach(function (navLink) {
        navLink.classList.remove("is-active");
        navLink.removeAttribute("aria-current");
      });
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    });
  });

  updateToggleLabels();
  updateDirtyState();
})();
