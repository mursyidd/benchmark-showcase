(() => {
  'use strict';

  const form = document.querySelector('#account-form');
  const formFields = document.querySelector('#form-fields');
  const saveButton = document.querySelector('#save-button');
  const cancelButton = document.querySelector('#cancel-button');
  const saveLabel = saveButton.querySelector('.button-label');
  const spinner = saveButton.querySelector('.spinner');
  const dirtyIndicator = document.querySelector('#dirty-indicator');
  const actionContext = document.querySelector('#action-context');
  const statusBanner = document.querySelector('#status-banner');
  const statusIcon = statusBanner.querySelector('.status-icon');
  const statusTitle = document.querySelector('#status-title');
  const statusMessage = document.querySelector('#status-message');
  const validationSummary = document.querySelector('#validation-summary');
  const validationSummaryText = document.querySelector('#validation-summary-text');
  const discardDialog = document.querySelector('#discard-dialog');
  const keepEditingButton = document.querySelector('#keep-editing-button');
  const discardButton = document.querySelector('#discard-button');
  const simulationControls = document.querySelector('#simulation-controls');

  const fields = {
    displayName: document.querySelector('#display-name'),
    email: document.querySelector('#email'),
    timezone: document.querySelector('#timezone'),
    language: document.querySelector('#language')
  };

  let savedState = getCurrentState();
  let isDirty = false;
  let isSaving = false;
  let validationAttempted = false;
  let statusTimer = null;

  function getCurrentState() {
    return {
      displayName: fields.displayName.value.trim(),
      email: fields.email.value.trim(),
      timezone: fields.timezone.value,
      language: fields.language.value,
      notifyAssignments: document.querySelector('#notify-assignments').checked,
      notifyDigest: document.querySelector('#notify-digest').checked,
      notifyReleases: document.querySelector('#notify-releases').checked
    };
  }

  function statesMatch(first, second) {
    return Object.keys(first).every((key) => first[key] === second[key]);
  }

  function updateDirtyState() {
    isDirty = !statesMatch(getCurrentState(), savedState);
    dirtyIndicator.hidden = !isDirty;
    saveButton.disabled = !isDirty || isSaving;
    cancelButton.disabled = !isDirty || isSaving;
    actionContext.textContent = isDirty
      ? 'Changes are stored only after you save.'
      : 'No unsaved changes.';

    if (isDirty && statusBanner.dataset.state === 'success') {
      hideStatus();
    }
  }

  function getFieldError(field) {
    const value = field.value.trim();

    if (field.required && !value) {
      if (field === fields.displayName) return 'Enter a display name.';
      if (field === fields.email) return 'Enter an email address.';
      if (field === fields.timezone) return 'Select a time zone.';
      if (field === fields.language) return 'Select a language.';
    }

    if (field === fields.email && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) return 'Enter a valid email address, such as name@example.com.';
    }

    return '';
  }

  function showFieldError(field, message) {
    const error = document.querySelector(`#${field.id}-error`);
    error.textContent = message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateField(field) {
    const message = getFieldError(field);
    showFieldError(field, message);
    return !message;
  }

  function validateForm() {
    validationAttempted = true;
    const invalidFields = Object.values(fields).filter((field) => !validateField(field));

    if (invalidFields.length) {
      validationSummaryText.textContent = `${invalidFields.length} ${invalidFields.length === 1 ? 'field needs' : 'fields need'} attention before your settings can be saved.`;
      validationSummary.hidden = false;
      hideStatus();
      invalidFields[0].focus();
      return false;
    }

    validationSummary.hidden = true;
    return true;
  }

  function clearValidation() {
    validationAttempted = false;
    validationSummary.hidden = true;
    Object.values(fields).forEach((field) => showFieldError(field, ''));
  }

  function showStatus(state, title, message) {
    if (statusTimer) window.clearTimeout(statusTimer);
    statusBanner.dataset.state = state;
    statusTitle.textContent = title;
    statusMessage.textContent = message;
    statusIcon.textContent = state === 'success' ? '✓' : state === 'failure' ? '!' : '…';
    statusBanner.hidden = false;
  }

  function hideStatus() {
    statusBanner.hidden = true;
    statusBanner.removeAttribute('data-state');
  }

  function setSavingState(saving) {
    isSaving = saving;
    form.setAttribute('aria-busy', String(saving));
    formFields.disabled = saving;
    simulationControls.disabled = saving;
    cancelButton.disabled = saving || !isDirty;
    saveButton.disabled = saving || !isDirty;
    spinner.hidden = !saving;
    saveLabel.textContent = saving ? 'Saving…' : 'Save changes';
  }

  function restoreSavedState() {
    fields.displayName.value = savedState.displayName;
    fields.email.value = savedState.email;
    fields.timezone.value = savedState.timezone;
    fields.language.value = savedState.language;
    document.querySelector('#notify-assignments').checked = savedState.notifyAssignments;
    document.querySelector('#notify-digest').checked = savedState.notifyDigest;
    document.querySelector('#notify-releases').checked = savedState.notifyReleases;
    clearValidation();
    hideStatus();
    updateDirtyState();
  }

  form.addEventListener('input', (event) => {
    if (validationAttempted && Object.values(fields).includes(event.target)) {
      validateField(event.target);
      const remainingErrors = Object.values(fields).filter((field) => getFieldError(field)).length;
      if (!remainingErrors) validationSummary.hidden = true;
    }
    updateDirtyState();
  });

  form.addEventListener('change', (event) => {
    if (validationAttempted && Object.values(fields).includes(event.target)) {
      validateField(event.target);
    }
    updateDirtyState();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (isSaving || !isDirty || !validateForm()) return;

    setSavingState(true);
    showStatus('saving', 'Saving account settings', 'Please wait while your changes are securely applied.');

    const outcome = document.querySelector('input[name="saveOutcome"]:checked').value;
    statusTimer = window.setTimeout(() => {
      setSavingState(false);

      if (outcome === 'failure') {
        showStatus('failure', 'Settings could not be saved', 'A temporary service error occurred. Your changes are still here—please try again.');
        updateDirtyState();
        saveButton.focus();
        return;
      }

      savedState = getCurrentState();
      clearValidation();
      updateDirtyState();
      showStatus('success', 'Account settings saved', 'Your profile and notification preferences are now up to date.');
      statusTimer = window.setTimeout(() => {
        if (!isDirty) hideStatus();
      }, 6000);
    }, 900);
  });

  cancelButton.addEventListener('click', () => {
    if (!isDirty || isSaving) return;
    discardDialog.showModal();
    keepEditingButton.focus();
  });

  keepEditingButton.addEventListener('click', () => {
    discardDialog.close();
  });

  discardButton.addEventListener('click', () => {
    discardDialog.close();
    restoreSavedState();
    showStatus('success', 'Changes discarded', 'Your last saved account settings have been restored.');
    fields.displayName.focus();
  });

  discardDialog.addEventListener('close', () => {
    if (isDirty && document.activeElement === document.body) cancelButton.focus();
  });

  window.addEventListener('beforeunload', (event) => {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  updateDirtyState();
})();
