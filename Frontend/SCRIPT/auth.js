import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBmZrijD394UCYQPGS-_lNWw_H6RmvuAWI",
    authDomain: "chargebuddy-2af9a.firebaseapp.com",
    projectId: "chargebuddy-2af9a",
    storageBucket: "chargebuddy-2af9a.firebasestorage.app",
    messagingSenderId: "805837816784",
    appId: "1:805837816784:web:316d228c737b7fc3662fd5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const API_URL = "http://localhost:8080/api/profile";

// Login elements
const loginBtn = document.getElementById("loginBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");

const loginModal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById("loginModal")
);

const authMessage = document.getElementById("authMessage");
const authSubtitle = document.getElementById("authSubtitle");
const authSwitchText = document.getElementById("authSwitchText");
const loginModeBtn = document.getElementById("authModeLogin");
const signupModeBtn = document.getElementById("authModeSignup");

// Profile elements
const profileBtn = document.getElementById("profileBtn");

const profileModal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById("profileModal")
);

const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");
const profileGoogleName = document.getElementById("profileGoogleName");
const profileEmail = document.getElementById("profileEmail");
const profilePhoto = document.getElementById("profilePhoto");
const navProfileName = document.getElementById("navProfileName");
const navProfilePhoto = document.getElementById("navProfilePhoto");

const nicknameInput = document.getElementById("nickname");
const phoneInput = document.getElementById("profilePhone");
const stateInput = document.getElementById("profileState");
const cityInput = document.getElementById("profileCity");
const addressInput = document.getElementById("profileAddress");
const signOutBtn = document.getElementById("signOutBtn");

let currentUser = null;
let authMode = "login";

function showAuthMessage(text, isError = false) {
    authMessage.textContent = text;
    authMessage.className = isError
        ? "mt-3 mb-0 text-danger"
        : "mt-3 mb-0 text-success";
}

function showProfileMessage(text, isError = false) {
    profileMessage.textContent = text;
    profileMessage.className = isError
        ? "small text-danger"
        : "small text-success";
}

function setAuthMode(mode) {
    authMode = mode;

    loginModeBtn.className = mode === "login"
        ? "btn btn-success active"
        : "btn btn-outline-success";

    signupModeBtn.className = mode === "signup"
        ? "btn btn-success active"
        : "btn btn-outline-success";

    authSubtitle.textContent = mode === "login"
        ? "Login to your ChargeBuddy account."
        : "Create your ChargeBuddy account.";

    authSwitchText.textContent = mode === "login"
        ? "New to ChargeBuddy? Select Sign Up above."
        : "Already have an account? Select Login above.";

    googleLoginBtn.textContent = mode === "login"
        ? "Continue with Google"
        : "Sign up with Google";

    showAuthMessage("");
}

loginModeBtn.addEventListener("click", () => setAuthMode("login"));
signupModeBtn.addEventListener("click", () => setAuthMode("signup"));

loginBtn.addEventListener("click", () => {
    setAuthMode("login");
    loginModal.show();
});

// Google login/signup
googleLoginBtn.addEventListener("click", async () => {
    try {
        showAuthMessage("Opening Google login...");

        const result = await signInWithPopup(auth, googleProvider);

        showAuthMessage(
            `Welcome ${result.user.displayName || "to ChargeBuddy"}!`
        );

        loginModal.hide();
    } catch (error) {
        console.error("Google login error:", error);
        showAuthMessage(error.message || "Google login failed.", true);
    }
});

// Call backend with Firebase ID token
async function profileRequest(method, body = null) {
    if (!currentUser) {
        throw new Error("Please login first.");
    }

    const idToken = await currentUser.getIdToken();

    const options = {
        method,
        headers: {
            "Authorization": `Bearer ${idToken}`
        }
    };

    if (body !== null) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    const response = await fetch(API_URL, options);

    if (response.status === 404 && method === "GET") {
        return null;
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.error || `Request failed (${response.status})`
        );
    }

    return result;
}

// Update profile UI
function updateProfileUI(user, saved = {}) {
    profileGoogleName.textContent = user.displayName || "ChargeBuddy User";
    profileEmail.textContent = user.email || "Email unavailable";

    if (user.photoURL) {
        profilePhoto.src = user.photoURL;
        profilePhoto.hidden = false;

        navProfilePhoto.src = user.photoURL;
        navProfilePhoto.hidden = false;
    } else {
        profilePhoto.hidden = true;
        navProfilePhoto.hidden = true;
    }

    nicknameInput.value = saved.nickname ?? user.displayName ?? "";
    phoneInput.value = saved.phone ?? "";
    stateInput.value = saved.state ?? "";
    cityInput.value = saved.city ?? "";
    addressInput.value = saved.address ?? "";

    navProfileName.textContent =
        saved.nickname || user.displayName || "My Profile";
}

// Load profile from MySQL backend
async function loadProfile(user) {
    updateProfileUI(user);

    try {
        const saved = await profileRequest("GET");

        if (currentUser?.uid !== user.uid) return;

        if (saved) {
            updateProfileUI(user, saved);
        }
    } catch (error) {
        console.error("Profile load error:", error);
        showProfileMessage(
            "Profile load nahi hua. Backend running hai ya nahi check karo.",
            true
        );
    }
}

// Open profile
profileBtn.addEventListener("click", async () => {
    if (!currentUser) return;

    showProfileMessage("Loading profile...");

    profileModal.show();
    await loadProfile(currentUser);

    if (currentUser) {
        showProfileMessage("");
    }
});

// Save profile to MySQL
profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
        showProfileMessage("Please login first.", true);
        return;
    }

    const phone = phoneInput.value.trim();

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
        showProfileMessage(
            "Enter a valid 10-digit Indian mobile number.",
            true
        );
        return;
    }

    const profile = {
        nickname: nicknameInput.value.trim(),
        phone,
        state: stateInput.value.trim(),
        city: cityInput.value.trim(),
        address: addressInput.value.trim()
    };

    try {
        showProfileMessage("Saving profile...");

        const saved = await profileRequest("PUT", profile);

        navProfileName.textContent =
            saved.nickname || currentUser.displayName || "My Profile";

        showProfileMessage("Profile saved successfully in MySQL!");
    } catch (error) {
        console.error("Profile save error:", error);
        showProfileMessage(
            error.message || "Could not save profile. Check backend.",
            true
        );
    }
});

// Sign out
signOutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        profileModal.hide();
        loginModal.hide();
    } catch (error) {
        console.error("Sign out error:", error);
        showProfileMessage("Sign out failed. Please try again.", true);
    }
});

// Keep navbar synced with Firebase login state
onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (user) {
        loginBtn.hidden = true;
        profileBtn.hidden = false;

        updateProfileUI(user);
        loadProfile(user);

        console.log("Logged in:", user.email);
    } else {
        loginBtn.hidden = false;
        profileBtn.hidden = true;
        navProfileName.textContent = "My Profile";
        navProfilePhoto.hidden = true;

        console.log("No user signed in.");
    }
});

console.log("ChargeBuddy authentication and profile ready.");
