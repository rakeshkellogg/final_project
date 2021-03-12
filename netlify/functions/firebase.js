const firebase = require("firebase/app")
require("firebase/firestore")

const firebaseConfig = {
    apiKey: "AIzaSyASc6MEnufSxR67UMGIBLmV42_v8UEldZQ",
    authDomain: "kiei-final-project.firebaseapp.com",
    projectId: "kiei-final-project",
    storageBucket: "kiei-final-project.appspot.com",
    messagingSenderId: "895011058032",
    appId: "1:895011058032:web:101efae9adb7e3a7ecdfb5",
    measurementId: "G-PM7Z2L5KMY"
} // replace

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

module.exports = firebase