
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
    signInWithCredential,
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
const modalElement = document.getElementById("loginModal");

const loginModal = bootstrap.Modal.getOrCreateInstance(modalElement);

let confirmationResult = null;
let recaptchaVerifier = null;
let pendingGoogleUser = null;
let otpPurpose = "phone";

// Display status
function showMessage(text, isError = false) {
    message.textContent = text;
    message.className = isError
        ? "mt-3 mb-0 text-danger"
        : "mt-3 mb-0 text-success";
}

function getPhoneNumber() {
    const digits = phoneInput.value.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(digits)) {
        throw new Error("Valid 10-digit Indian mobile number enter karo.");
    }

    return `+91${digits}`;
}

// reCAPTCHA for real SMS verification
async function setupRecaptcha() {
    if (recaptchaVerifier) {
        try {
            await recaptchaVerifier.render();
            return;
        } catch {
            recaptchaVerifier = null;
        }
    }

    recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: () => showMessage("reCAPTCHA verified. OTP bhej sakte ho."),
        "expired-callback": () => {
            showMessage("reCAPTCHA expire ho gaya. Dobara verify karo.", true);
        }
    });

    await recaptchaVerifier.render();
}

// Open login modal
loginBtn.addEventListener("click", () => {
    showMessage("");
    loginModal.show();
});

// Google login
googleLoginBtn.addEventListener("click", async () => {
    try {
        showMessage("Google login open ho raha hai...");

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        if (user.phoneNumber) {
            showMessage(`Login successful! Welcome ${user.displayName || ""}`);
            loginModal.hide();
            return;
        }

        // Google account is signed in, but phone verification is still required.
        pendingGoogleUser = user;
        otpPurpose = "google-link";
        sendOtpBtn.textContent = "Verify mobile with OTP";
        showMessage("Google login successful. Ab mobile number verify karo.");
        phoneInput.focus();

    } catch (error) {
        showMessage(error.message || "Google login failed.", true);
    }
});

// Send OTP
sendOtpBtn.addEventListener("click", async () => {
    try {
        const phoneNumber = getPhoneNumber();

        await setupRecaptcha();
        showMessage("OTP bheja ja raha hai...");

        if (otpPurpose === "google-link" && pendingGoogleUser) {
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
        showMessage("SMS OTP bhej diya gaya. Apna OTP enter karo.");

    } catch (error) {
        showMessage(error.message || "OTP send nahi hua.", true);

        if (recaptchaVerifier) {
            try {
                await recaptchaVerifier.clear();
            } catch {}
            recaptchaVerifier = null;
        }
    }
});

// Verify OTP
verifyOtpBtn.addEventListener("click", async () => {
    try {
        const code = otpInput.value.trim();

        if (!/^\d{6}$/.test(code)) {
            throw new Error("6-digit OTP enter karo.");
        }

        if (!confirmationResult) {
            throw new Error("Pehle OTP send karo.");
        }

        showMessage("OTP verify ho raha hai...");

        if (otpPurpose === "google-link" && pendingGoogleUser) {
            const phoneCredential = PhoneAuthProvider.credential(
                confirmationResult.verificationId,
                code
            );

            const linkedResult = await linkWithCredential(
                pendingGoogleUser,
                phoneCredential
            );

            showMessage(`Mobile verified! Welcome ${linkedResult.user.displayName || ""}`);
        } else {
            const result = await confirmationResult.confirm(code);
            showMessage(`Login successful! Welcome ${result.user.displayName || ""}`);
        }

        pendingGoogleUser = null;
        confirmationResult = null;
        otpInput.value = "";
        loginModal.hide();

    } catch (error) {
        showMessage(error.message || "OTP verification failed.", true);
    }
});

// Restore login state on page load
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Firebase user:", user.uid);
        console.log("Phone verified:", Boolean(user.phoneNumber));
    } else {
        console.log("No user logged in.");
    }
});

console.log("ChargeBuddy Firebase Auth initialized.");
