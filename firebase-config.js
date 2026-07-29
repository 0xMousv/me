

const firebaseConfig = {
  apiKey: "AIzaSyDKFOnA_VxnCfn563UkWS__lxljm16yemM",
  authDomain: "myblog-c5aa1.firebaseapp.com",
  projectId: "myblog-c5aa1",
  storageBucket: "myblog-c5aa1.firebasestorage.app",
  messagingSenderId: "188017411821",
  appId: "1:188017411821:web:2fb9cc770279a4fc06aee4",
  measurementId: "G-RGL1307MEC"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


const CLOUDINARY_CLOUD_NAME = "k8r5lexd";
const CLOUDINARY_UPLOAD_PRESET = "myblog";

async function uploadImageToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error("Cloudinary upload failed: " + errText);
  }
  const data = await res.json();
  return data.secure_url;
}
