// Your web app's Firebase configuration
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
firebase.initializeApp(firebaseConfig);

// Get a reference to the blog post in the Firebase Realtime Database
const postRef = firebase.database().ref("blog/blog1");

// Get the number of unique IP addresses in the database
function getUniqueIPCount() {
    return postRef
      .child("views")
      .orderByChild("ipAddress")
      .once("value")
      .then((snapshot) => {
        const uniqueIPs = new Set();
        snapshot.forEach((childSnapshot) => {
          uniqueIPs.add(childSnapshot.val().ipAddress);
        });
        return uniqueIPs.size;
      });
  }
  
  // Call the function to get the unique IP count and update the display
  getUniqueIPCount().then((uniqueIPCount) => {
    const uniqueIPCountElement = document.getElementById("uniqueIPCount");
    uniqueIPCountElement.innerText = uniqueIPCount;
  });
  
  // Listen for changes to the view count in the database and update the display
  postRef.child("views").on("value", (snapshot) => {
    getUniqueIPCount().then((uniqueIPCount) => {
      const uniqueIPCountElement = document.getElementById("uniqueIPCount");
      uniqueIPCountElement.innerText = uniqueIPCount;
    });
  });