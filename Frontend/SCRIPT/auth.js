
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    linkWithPhoneNumber,
    PhoneAuthProvider,
    linkWithCredential,
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

// HTML elements
const loginBtn = document.getElementById("loginBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const phoneInput = document.getElementById("phoneNumber");
const otpInput = document.getElementById("otpCode");
const otpSection = document.getElementById("otpSection");
const message = document.getElementById("authMessage");
const subtitle = document.getElementById("authSubtitle");
const switchText = document.getElementById("authSwitchText");
const loginModeBtn = document.getElementById("authModeLogin");
const signupModeBtn = document.getElementById("authModeSignup");
const modalElement = document.getElementById("loginModal");

const loginModal = bootstrap.Modal.getOrCreateInstance(modalElement);

let authMode = "login";
let confirmationResult = null;
let recaptchaVerifier = null;
let pendingGoogleUser = null;
let otpPurpose = "phone";

function showMessage(text, error = false) {
    message.textContent = text;
    message.className = error
        ? "mt-3 mb-0 text-danger"
        : "mt-3 mb-0 text-success";
}

function setMode(mode) {
    authMode = mode;

    loginModeBtn.className = mode === "login"
        ? "btn btn-success active"
        : "btn btn-outline-success";

    signupModeBtn.className = mode === "signup"
        ? "btn btn-success active"
        : "btn btn-outline-success";

    subtitle.textContent = mode === "login"
        ? "Login to your ChargeBuddy account."
        : "Create your ChargeBuddy account.";

    switchText.textContent = mode === "login"
        ? "New to ChargeBuddy? Select Sign Up above."
        : "Already have an account? Select Login above.";

    googleLoginBtn.textContent = mode === "login"
        ? "Continue with Google"
        : "Sign up with Google";

    sendOtpBtn.textContent = mode === "login"
        ? "Login with Phone OTP"
        : "Sign Up with Phone OTP";

    showMessage("");
}

loginModeBtn.addEventListener("click", () => setMode("login"));
signupModeBtn.addEventListener("click", () => setMode("signup"));

loginBtn.addEventListener("click", () => {
    setMode("login");
    loginModal.show();
});

function getPhoneNumber() {
    const digits = phoneInput.value.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(digits)) {
        throw new Error("Valid 10-digit Indian mobile number enter karo.");
    }

    return `+91${digits}`;
}

async function setupRecaptcha() {
    if (recaptchaVerifier) {
        await recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }

    recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
            size: "normal",
            callback: () => showMessage("reCAPTCHA verified."),
            "expired-callback": () =>
                showMessage("reCAPTCHA expire ho gaya. Dobara try karo.", true)
        }
    );

    await recaptchaVerifier.render();
}

// Google authentication
googleLoginBtn.addEventListener("click", async () => {
    try {
        showMessage("Google authentication opening...");

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        if (user.phoneNumber) {
            showMessage(`Login successful! Welcome ${user.displayName || ""}`);
            loginModal.hide();
            return;
        }

        // Google authenticated, but mobile verification is still required.
        pendingGoogleUser = user;
        otpPurpose = "google-link";
        otpSection.hidden = true;
        otpInput.value = "";

        showMessage("Google verified. Ab mobile number enter karke OTP verify karo.");
        phoneInput.focus();

    } catch (error) {
        console.error("Google authentication error:", error);
        showMessage(error.message || "Google authentication failed.", true);
    }
});

// Send phone OTP
sendOtpBtn.addEventListener("click", async () => {
    try {
        const phoneNumber = getPhoneNumber();

        showMessage("Preparing OTP verification...");
        await setupRecaptcha();

        if (pendingGoogleUser && otpPurpose === "google-link") {
            confirmationResult = await linkWithPhoneNumber(
                pendingGoogleUser,
                phoneNumber,
                recaptchaVerifier
            );
        } else {
            confirmationResult = await signInWithPhoneNumber(
                auth,
                phoneNumber,
                recaptchaVerifier
            );
        }

        otpSection.hidden = false;
        showMessage("SMS OTP sent. Apna 6-digit OTP enter karo.");

    } catch (error) {
        console.error("Send OTP error:", error);
        showMessage(error.message || "OTP send nahi hua.", true);

        if (recaptchaVerifier) {
            await recaptchaVerifier.clear();
            recaptchaVerifier = null;
        }
    }
});

// Verify phone OTP
verifyOtpBtn.addEventListener("click", async () => {
    try {
        const code = otpInput.value.trim();

        if (!/^\d{6}$/.test(code)) {
            throw new Error("6-digit OTP enter karo.");
        }

        if (!confirmationResult) {
            throw new Error("Pehle OTP send karo.");
        }

        showMessage("Verifying OTP...");

        if (pendingGoogleUser && otpPurpose === "google-link") {
            const credential = PhoneAuthProvider.credential(
                confirmationResult.verificationId,
                code
            );

            const result = await linkWithCredential(
                pendingGoogleUser,
                credential
            );

            showMessage(`Mobile verified! Welcome ${result.user.displayName || ""}`);
        } else {
            const result = await confirmationResult.confirm(code);

            showMessage(`Phone verified! Welcome ${result.user.displayName || ""}`);
        }

        confirmationResult = null;
        pendingGoogleUser = null;
        otpInput.value = "";
        loginModal.hide();

    } catch (error) {
        console.error("OTP verification error:", error);
        showMessage(error.message || "OTP verification failed.", true);
    }
});

// Observe Firebase login state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Firebase user:", user.uid);
        console.log("Email:", user.email);
        console.log("Verified phone:", user.phoneNumber || "Not verified");
    } else {
        console.log("No Firebase user signed in.");
    }
});

console.log("ChargeBuddy authentication ready.");
