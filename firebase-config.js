// Firebase 콘솔 → 프로젝트 설정(톱니바퀴) → 일반 → "내 앱" → 웹 앱 → "SDK 설정 및 구성" → 구성(Config)
// 거기 나오는 firebaseConfig 값을 아래에 그대로 붙여넣으세요. 이 값은 공개되어도 되는 식별자입니다(보안은 Firestore 규칙이 담당).
window.FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT.firebaseapp.com",
  projectId: "PASTE_PROJECT",
  storageBucket: "PASTE_PROJECT.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
