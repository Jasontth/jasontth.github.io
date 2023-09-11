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

// Get the user's IP address
const getIPAddress = async () => {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  };
  
  // Check if the user's IP address is already in the database
  getIPAddress().then((ipAddress) => {
    postRef
      .child("views")
      .orderByChild("ipAddress")
      .equalTo(ipAddress)
      .once("value", (snapshot) => {
        if (snapshot.exists()) {
          // User has already viewed the page, display existing view count
          const viewCount = snapshot.val()[Object.keys(snapshot.val())[0]].count;
          const viewCountElement = document.getElementById("viewCount");
          viewCountElement.innerText = viewCount;
        } else {
          // User has not viewed the page, increment view count and add IP address to database
          postRef.child("views").push({ count: 1, ipAddress: ipAddress });
          const viewCountElement = document.getElementById("viewCount");
          viewCountElement.innerText = 1;
        }
      });
  });
  
  // Listen for changes to the view count in the database and update the display
  postRef.child("views").on("value", (snapshot) => {
    const viewCountElement = document.getElementById("viewCount");
    const viewCount = snapshot.numChildren();
    viewCountElement.innerText = viewCount;
  });