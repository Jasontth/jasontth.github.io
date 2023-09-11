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
const postRef = firebase.database().ref("blog/blog1/views");

// Retrieve the current IP addresses from the database
postRef.once("value", (snapshot) => {
  const viewData = snapshot.val();
  
  if (viewData && viewData.ipAddress) {
    const uniqueIPs = viewData.ipAddress || [];

    // Get the current visitor's IP address
    const currentIP = getVisitorIP();

    // Check if the current IP address is already recorded
    if (!uniqueIPs.includes(currentIP)) {
      uniqueIPs.push(currentIP);
    }

    // Update the unique IP addresses in the database
    postRef.update({ ipAddress: uniqueIPs });

    // Calculate the latest view count
    const viewCount = uniqueIPs.length;

    // Display the view count on the blog
    const viewCountElement = document.getElementById("viewCount");
    viewCountElement.innerText = viewCount.toString();
    
    console.log("View count:", viewCount);
  } else {
    console.log("No view data found in the database.");
  }
}).catch((error) => {
  console.error("Error retrieving view data:", error);
});

// Function to get the visitor's IP address
async function getVisitorIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Error fetching visitor IP:", error);
    return null;
  }
}