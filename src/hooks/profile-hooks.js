// Profile DOM Selectors & Hooks

// Form Hooks
export const FORM_HOOKS = {
  profileForm: () => document.getElementById('profileForm'),
  backBtn: () => document.getElementById('backBtn'),
  cancelBtn: () => document.getElementById('cancelBtn'),
  saveBtn: () => document.getElementById('saveBtn'),
  successMessage: () => document.getElementById('successMessage'),
  pictureInput: () => document.getElementById('pictureInput'),
};

// Field Hooks
export const FIELD_HOOKS = {
  firstName: () => document.getElementById('firstName'),
  lastName: () => document.getElementById('lastName'),
  middleName: () => document.getElementById('middleName'),
  sex: () => document.getElementById('sex'),
  dateOfBirth: () => document.getElementById('dateOfBirth'),
  email: () => document.getElementById('email'),
};

// Error Display Hooks
export const ERROR_HOOKS = {
  firstNameError: () => document.getElementById('firstNameError'),
  lastNameError: () => document.getElementById('lastNameError'),
  middleNameError: () => document.getElementById('middleNameError'),
  sexError: () => document.getElementById('sexError'),
  dateOfBirthError: () => document.getElementById('dateOfBirthError'),
  emailError: () => document.getElementById('emailError'),
};

// Profile Picture Hooks
export const PICTURE_HOOKS = {
  profilePicture: () => document.getElementById('profilePicture'),
};

// Helper function to get all hooks at once
export function getProfileHooks() {
  return {
    form: Object.entries(FORM_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    fields: Object.entries(FIELD_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    errors: Object.entries(ERROR_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    picture: Object.entries(PICTURE_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
  };
}
