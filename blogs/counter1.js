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
const analytics = firebase.analytics();

// Get a reference to the blog post in the Firebase Realtime Database
const postRef = firebase.database().ref("blog/blog1");

// Retrieve the current view count from the database and increment it
postRef.transaction((post) => {
    if (post) {
        if (!post.views) {
            post.views = 1;
        } else {
            post.views++;
        }
    }
    return post;
});

// Display the view count on the blog
postRef.on("value", (snapshot) => {
    const post = snapshot.val();
    const viewCount = post.views || 0;
    const viewCountElement = document.getElementById("viewCount");
    viewCountElement.innerText = viewCount;
});