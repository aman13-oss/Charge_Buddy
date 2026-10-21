
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

let authMode = "login";
let currentUser = null;

function showAuthMessage(text, isError = false) {
    authMessage.textContent = text;
    authMessage.className = isError
        ? "mt-3 mb-0 text-danger"
        : "mt-3 mb-0 text-success";
}

function getProfileStorageKey(user) {
    return `chargebuddy_profile_${user.uid}`;
}

function getSavedProfile(user) {
    try {
        return JSON.parse(
            localStorage.getItem(getProfileStorageKey(user)) || "{}"
        );
    } catch {
        return {};
    }
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

// Google Login / Signup
googleLoginBtn.addEventListener("click", async () => {
    try {
        showAuthMessage("Opening Google login...");

        const result = await signInWithPopup(auth, googleProvider);

        showAuthMessage(`Welcome ${result.user.displayName || "to ChargeBuddy"}!`);
        loginModal.hide();
    } catch (error) {
        console.error("Google login error:", error);
        showAuthMessage(error.message || "Google login failed.", true);
    }
});

// Load profile details
function loadProfile(user) {
    const saved = getSavedProfile(user);

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

// Open profile
profileBtn.addEventListener("click", () => {
    if (!currentUser) return;

    loadProfile(currentUser);
    profileMessage.textContent = "";
    profileModal.show();
});

// Save profile in this browser
profileForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!currentUser) {
        profileMessage.textContent = "Please login first.";
        return;
    }

    const phone = phoneInput.value.trim();

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
        profileMessage.textContent =
            "Enter a valid 10-digit Indian mobile number.";
        profileMessage.className = "small text-danger";
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
        localStorage.setItem(
            getProfileStorageKey(currentUser),
            JSON.stringify(profile)
        );

        navProfileName.textContent =
            profile.nickname || currentUser.displayName || "My Profile";

        profileMessage.textContent = "Profile saved in this browser!";
        profileMessage.className = "small text-success";
    } catch (error) {
        console.error("Profile save error:", error);
        profileMessage.textContent = "Could not save profile.";
        profileMessage.className = "small text-danger";
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
        profileMessage.textContent = "Sign out failed. Please try again.";
        profileMessage.className = "small text-danger";
    }
});

// Keep navbar in sync with login state
onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (user) {
        loginBtn.hidden = true;
        profileBtn.hidden = false;
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
