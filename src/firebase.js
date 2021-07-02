import firebase from "firebase/app";
import "firebase/firebase-firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDLe_YyhZvb7IR7ZSy-2ctVmu_UNJgiNMw",
    authDomain: "eve-industry-planner-dev.firebaseapp.com",
    databaseURL: "https://eve-industry-planner-dev-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "eve-industry-planner-dev",
    storageBucket: "eve-industry-planner-dev.appspot.com",
    messagingSenderId: "837613127098",
    appId: "1:837613127098:web:e8d8d8826a236735ce4983"
  };

  firebase.initializeaApp(firebaseConfig);
  
  export default firebase;