const ACCESS_TOKEN_KEY = "ems_access_token";
const REMEMBER_ME_KEY = "ems_remember_me";

function getAccessToken() {
  return (
    window.sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    window.localStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

function setAuthToken(token, rememberMe = false) {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);

  if (rememberMe) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    window.localStorage.setItem(REMEMBER_ME_KEY, "true");
    return;
  }

  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.localStorage.removeItem(REMEMBER_ME_KEY);
}

function clearAuthToken() {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REMEMBER_ME_KEY);
}

function isRememberMeEnabled() {
  return window.localStorage.getItem(REMEMBER_ME_KEY) === "true";
}

export { getAccessToken, setAuthToken, clearAuthToken, isRememberMeEnabled };
