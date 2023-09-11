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
  
  // Increment the view count in the database
  const incrementViewCount = async () => {
    const ipAddress = await getIPAddress();
    postRef.transaction((post) => {
      if (post) {
        if (!post.views) {
          post.views = {};
        }
        if (!post.views[ipAddress]) {
          post.views[ipAddress] = true;
          post.viewCount = Object.keys(post.views).length;
        }
      }
      return post;
    });
  };