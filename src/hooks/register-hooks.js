// Register Form DOM Selectors & Hooks

// Role Selection Hooks
export const ROLE_HOOKS = {
  roleOwnerBtn: () => document.getElementById('roleOwner'),
  roleRenterBtn: () => document.getElementById('roleRenter'),
  roleAdminBtn: () => document.getElementById('roleAdmin'),
};

// Form Input Hooks
export const FORM_HOOKS = {
  firstName: () => document.getElementById('firstName'),
  lastName: () => document.getElementById('lastName'),
  middleName: () => document.getElementById('middleName'),
  sex: () => document.getElementById('sex'),
  dateOfBirth: () => document.getElementById('dateOfBirth'),
  email: () => document.getElementById('email'),
  password: () => document.getElementById('password'),
  passwordRepeat: () => document.getElementById('passwordRepeat'),
};

// Form Control Hooks
export const CONTROL_HOOKS = {
  registerForm: () => document.getElementById('registerForm'),
  submitBtn: () => document.getElementById('submitBtn'),
  successMessage: () => document.getElementById('successMessage'),
};

// Link Hooks
export const LINK_HOOKS = {
  loginLink: () => document.querySelector('a[href="login.html"]'),
  adminRegisterLink: () => document.querySelector('a[href="admin-register.html"]'),
};

// Helper function to get all hooks at once
export function getRegisterHooks() {
  return {
    role: Object.entries(ROLE_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    form: Object.entries(FORM_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    control: Object.entries(CONTROL_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    links: Object.entries(LINK_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
  };
}
