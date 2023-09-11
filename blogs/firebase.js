import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyD77oQgRFTauLXol5ai2My9RvNjuIv3hoc",
    authDomain: "resume-website-7c7ff.firebaseapp.com",
    databaseURL: "https://resume-website-7c7ff-default-rtdb.firebaseio.com",
    projectId: "resume-website-7c7ff",
    storageBucket: "resume-website-7c7ff.appspot.com",
    messagingSenderId: "896649471462",
    appId: "1:896649471462:web:14a7136209b094f2cb6227",
    measurementId: "G-SECZR9P6TY"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Get a reference to the view count element
const viewCountElement = document.getElementById('viewCount');

// Get a reference to the view count in the database
const viewCountRef = ref(database, 'blog1/view_count');

// Get the current view count value from the database
viewCountRef.once('value').then((snapshot) => {
  const viewCount = snapshot.val() || 0;
  viewCountElement.textContent = `${viewCount} views`;
});

// Increment the view count by one
viewCountRef.transaction((currentCount) => {
  return (currentCount || 0) + 1;
});