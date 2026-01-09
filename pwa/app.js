const config = window.__APP_CONFIG__ || {};
const API_BASE_URL = config.API_BASE_URL || "http://localhost:8799";

const authCard = document.getElementById("auth-card");
const mainCard = document.getElementById("main-card");
const tabBar = document.getElementById("tab-bar");
const logoutBtn = document.getElementById("logout-btn");
const authForm = document.getElementById("auth-form");
const authMessage = document.getElementById("auth-message");
const oauthMessage = document.getElementById("oauth-message");
const nameField = document.getElementById("name-field");
const userSummary = document.getElementById("user-summary");
const authTabs = document.querySelectorAll("[data-auth]");

let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;
  authTabs.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.auth === mode);
  });
  nameField.hidden = mode !== "register";
  authMessage.textContent = "";
}

function setAuthMessage(message, isError = true) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#b42318" : "#1d4ed8";
}

function setOauthMessage(message, isError = true) {
  oauthMessage.textContent = message;
  oauthMessage.style.color = isError ? "#b42318" : "#1d4ed8";
}

function setAuthenticated(user) {
  authCard.hidden = true;
  mainCard.hidden = false;
  tabBar.hidden = false;
  logoutBtn.hidden = false;
  userSummary.textContent = user?.email
    ? `Signed in as ${user.email}`
    : "Signed in";
}

function setLoggedOut() {
  authCard.hidden = false;
  mainCard.hidden = true;
  tabBar.hidden = true;
  logoutBtn.hidden = true;
  userSummary.textContent = "Signed out";
}

function saveToken(token) {
  localStorage.setItem("aimemo_token", token);
}

function clearToken() {
  localStorage.removeItem("aimemo_token");
}

function getToken() {
  return localStorage.getItem("aimemo_token");
}

async function apiRequest(path, body, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || "Request failed";
    throw new Error(message);
  }
  return data;
}

async function apiGet(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || "Request failed";
    throw new Error(message);
  }
  return data;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  authMessage.textContent = "";
  const formData = new FormData(authForm);
  const payload = Object.fromEntries(formData.entries());
  try {
    const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
    const data = await apiRequest(endpoint, payload);
    saveToken(data.access_token);
    setAuthenticated(data.user);
  } catch (error) {
    setAuthMessage(error.message || "Authentication failed");
  }
}

function setActiveTab(tab) {
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-content").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.tabView === tab);
  });
}

async function bootstrapSession() {
  const token = getToken();
  if (!token) {
    setLoggedOut();
    return;
  }
  try {
    const data = await apiGet("/auth/me", token);
    setAuthenticated(data.user);
  } catch (error) {
    clearToken();
    setLoggedOut();
  }
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
    });
  });
}

function setupGoogleSignIn() {
  const container = document.getElementById("google-button");
  if (!container) {
    return;
  }
  if (!config.GOOGLE_CLIENT_ID) {
    container.innerHTML = "<p class=\"helper\">Google sign-in needs GOOGLE_CLIENT_ID.</p>";
    return;
  }
  if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    container.innerHTML = "<p class=\"helper\">Google sign-in script not loaded.</p>";
    return;
  }

  window.google.accounts.id.initialize({
    client_id: config.GOOGLE_CLIENT_ID,
    callback: async (response) => {
      try {
        const data = await apiRequest("/auth/oauth/google", {
          id_token: response.credential,
        });
        saveToken(data.access_token);
        setAuthenticated(data.user);
      } catch (error) {
        setOauthMessage(error.message || "Google sign-in failed");
      }
    },
  });

  window.google.accounts.id.renderButton(container, {
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
  });
}

function setupAppleSignIn() {
  const appleButton = document.getElementById("apple-button");
  if (!appleButton) {
    return;
  }
  if (!config.APPLE_CLIENT_ID || !config.APPLE_REDIRECT_URI) {
    appleButton.disabled = true;
    setOauthMessage("Apple sign-in needs APPLE_CLIENT_ID and APPLE_REDIRECT_URI.", false);
    return;
  }
  if (!window.AppleID) {
    setOauthMessage("Apple sign-in script not loaded.", true);
    return;
  }

  window.AppleID.auth.init({
    clientId: config.APPLE_CLIENT_ID,
    scope: "name email",
    redirectURI: config.APPLE_REDIRECT_URI,
    usePopup: true,
  });

  appleButton.addEventListener("click", async () => {
    try {
      const response = await window.AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;
      if (!idToken) {
        setOauthMessage("Apple did not return an id_token.");
        return;
      }
      const payload = {
        id_token: idToken,
        email: response?.user?.email,
        display_name: response?.user?.name
          ? `${response.user.name.firstName || ""} ${response.user.name.lastName || ""}`.trim()
          : undefined,
      };
      const data = await apiRequest("/auth/oauth/apple", payload);
      saveToken(data.access_token);
      setAuthenticated(data.user);
    } catch (error) {
      setOauthMessage(error.message || "Apple sign-in failed");
    }
  });
}

function init() {
  authTabs.forEach((btn) => {
    btn.addEventListener("click", () => setAuthMode(btn.dataset.auth));
  });
  authForm.addEventListener("submit", handleAuthSubmit);
  logoutBtn.addEventListener("click", () => {
    clearToken();
    setLoggedOut();
  });
  setupTabs();
  setActiveTab("ideas");
  bootstrapSession();

  window.addEventListener("load", () => {
    setupGoogleSignIn();
    setupAppleSignIn();
  });
}

init();
