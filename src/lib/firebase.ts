import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD3mlTsZN7DXO3To8jaDrXLSxP2MXddf5g",
    authDomain: "sales-store-de395.firebaseapp.com",
    projectId: "sales-store-de395",
    storageBucket: "sales-store-de395.firebasestorage.app",
    messagingSenderId: "930894842495",
    appId: "1:930894842495:web:985628f4a40acf88594d4a",
    measurementId: "G-55K1LEE3KP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 🔒 تأمين استمرار الجلسة لضمان عدم تسجيل الخروج التلقائي
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        // console.error("Firebase Persistence Error:", error);
    });
