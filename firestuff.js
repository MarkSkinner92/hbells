var usrname = '';
var privateNames = '';
var publicNames = '';
var songplays = 10;
var usr;
var firebaseConfig = {
    apiKey: "AIzaSyDYfqrtoGoZqFusXkQaEH-9fiPozlzWq2I",
    authDomain: "handybells-3a6e6.firebaseapp.com",
    databaseURL: "https://handybells-3a6e6.firebaseio.com",
    projectId: "handybells-3a6e6",
    storageBucket: "handybells-3a6e6.appspot.com",
    messagingSenderId: "140845128306",
    appId: "1:140845128306:web:712c2ede197e98e78080eb",
    measurementId: "G-V3N8ERHMPY"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

  var auth = firebase.auth();
  var db = firebase.firestore();
  var email = "";
  var password = "";
  function createAccount(){
    email = document.getElementById('email').value;
    password = document.getElementById('psw').value;
    let disp = document.getElementById("dispname").value;
    let verif = true, msg = '';
    if(password.length < 6){
      verif = false;
      msg="Password too short";
    }
    if(password.length > 35){
      verif = false;
      msg="Password too long";
    }
    if(disp.length < 3){
      verif = false;
      msg="Display name too short";
    }
    if(disp.length < 3){
      verif = false;
      msg="Display name too short";
    }
    usrname = disp;
    if(verif){
      let userInfo = {
        email:email,
        password:password,
        displayName:disp
      }
      createFirebaseAccount(userInfo);
    }
    else{
      console.log('varif was false');
      document.getElementById('error').innerHTML = msg;
    }
  }
function LogInAccount(){
  email = document.getElementById('emaillogin').value;
  password = document.getElementById('pswlogin').value;
  if(email.length > 0 && password.length > 0){
    auth.signInWithEmailAndPassword(email, password).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode, errorMessage);
    if(errorCode == 'auth/invalid-email') alert('Enter a valid email');
    if(errorCode == 'auth/wrong-password') alert('Wrong password');
    if(errorCode == 'auth/user-not-found') alert('User not found. Maybe sign up?');
    // ...
    });
  }
}
//get status of login
auth.onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    usr = firebase.auth().currentUser;
    document.getElementById('acctmenubtn').style.display='inline';
    try {document.getElementById('openlib').style.display='inline';} catch(err){}
    if(usr.displayName != null) document.getElementById('welcome').innerHTML='Hello, '+usr.displayName;
    console.log("your in");
    document.getElementById('Login').src = 'res/logout.png';
    if(usrname != '')document.getElementById('welcome').innerHTML='Hello, '+usrname;
    //add personal songs to Library
    let currentUserDocData;
    var docRef = db.collection("Users").doc(usr.uid);
    console.log('getting doc... ' + usr.uid);
    docRef.get().then(function(doc) {
      currentUserDocData=doc.data();
      songplays = currentUserDocData.songplays;
      if(document.getElementById('songplayelement')){
        document.getElementById('songplayelement').style.display = 'unset';
        document.getElementById('songplayelement').innerText = `You have ${songplays} song plays left`;
      }
      //loop through all songs and create thumbs
      let names = currentUserDocData.data.split(',');
      privateNames = names;
      for(let i = 0; i < names.length-1; i++){
        console.log('creating elements');
        var name = document.createElement("H1");
        name.innerHTML = names[i].split(':')[0]; //names[i].split(':')[1] for public or private
        name.className = "innertext";
        var info = document.createElement("H1");
        info.innerHTML = "";
        info.className = "innertext";
        var entry = document.createElement("DIV");
        entry.appendChild(name);
        entry.appendChild(info);
        entry.className = "personal entry";
        if(names[i].split(':')[1] == 1) entry.className = 'personal entry public';
        entry.id='songthumb';
        entry.addEventListener("click", clickedOnSong);
        try{openSongEditMenu(entry);}catch(err){}
        document.getElementById("entries").appendChild(entry);
      }
      try{genPublicThumbs();}catch(err){}
    }).catch(function(error) {
        console.log("couldn't get doc" + error);
        console.log("creating songlist document: Users/"+usr.uid);
        db.collection("Users").doc(usr.uid).set({songplays: 10, data:''}).then(function(re){
          console.log('DOCUMENT WAS CREATED',re);
          try{genPublicThumbs();}catch(err){}
        }).catch(function(e){
          console.log("couldn't make user document: "+e);
        }); //add user specific document
    });
    showLib();
  } else {
    // No user is signed in.
    noUserSignedIn();
    if(document.getElementById('songplayelement')){
      document.getElementById('songplayelement').style.display = 'none';
    }
    focused = true;
  }
});
function showAcctMenu(){
  hideLib();
  hideSignin();
  focused = false;
  document.getElementById('acctmenu').style.display = "inline";
}
function hideAcctMenu(){
  document.getElementById('acctmenu').style.display = "none";
  focused = true;
}
function hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className+ ' ') > -1;
}
function constrain(g,mi,ma){
  if(g < mi) return mi;
  if(g > ma) return ma;
  return g;
}
function deleteAcct(psw){
  psw = psw || document.getElementById('delpword').value;
  let d = document.getElementById('delbtn');
  var user = firebase.auth().currentUser;
  // if(d.innerHTML == 'Are you sure? This cannot be undone'){
    //delete account here
    //delete user-specific document
    console.log('preparing to delete...');
    const credential = firebase.auth.EmailAuthProvider.credential(user.email,psw);
// reauthenticate, delete firestore file, delete user
  user.reauthenticateWithCredential(credential).then(function(){
    db.collection("Users").doc(user.uid).delete().then(function() {
        console.log("User Data successfully deleted. Deleting account...");
        user.delete().then(function() {
          console.log('user deleted');
          hideDeleteAcctmenu();
          hideAcctMenu();
        }).catch(function(e) {
          console.log('something went wrong deleting user: '+e);
        });
    }).catch(function(e) {
      console.log('something went wrong deleting document: '+e);
    });
  }).catch(function(e){
    console.log(e.code);
    if(e.code == 'auth/wrong-password'){
      alert('Cannot delete because of wrong password');
    }
  });
}

function forgotPassword(){
  let email = arguments[0] || document.getElementById('emaillogin').value;

  if(!email) alert("Please enter your account's email");
  else{
    auth.sendPasswordResetEmail(email).then(function() {
      alert('Sent a password reset email to ' + email);
    }).catch(function(error) {
      alert('Could not send an email to ' + email);
    });
  }
}

const createStripeCheckout = firebase.functions().httpsCallable('createStripeCheckout');
//live key
// const stripe = Stripe('pk_live_51Inv5oIHwSlonKXUVboNbqRiCefYAbYTdecxM5CP2UeY8fwsgfBvBoJof4mvanBTWBOt3npIqIHYUsHqIs7lLU4E00Ag49s02I');
//test key
const stripe = Stripe('pk_test_51Inv5oIHwSlonKXUAhSIFmNIjnVMOBQ9pr4ZiNU27f9hWXR2CnMPPEknYoOxHjhRG7MeJOfZKGiKRuTnqAeT2yym00YMFGAPRj');
function buyMoreSongs(){
  let ogText = document.getElementById('buysongs').innerText;
  document.getElementById('buysongs').innerText = 'Creating stripe checkout...';
  document.getElementById('buysongs').onclick = null;
  createStripeCheckout().then(response => {
    const sessionId = response.data.id;

    //add sessionID to firestore, with uuid
    console.log(sessionId,usr.uid);
    document.getElementById('buysongs').innerText = 'Redirecting to stripe checkout...';
    db.collection("Sessions").doc(sessionId).set({uid: usr.uid}).then((e) => {
      document.getElementById('buysongs').innerText = ogText;
      stripe.redirectToCheckout( {
        sessionId: sessionId
      } );
      console.log('success');
    }).catch(err => {
      console.log('db error',err);
    });
  }).catch(err => {console.log('error',err)});
}

function createFirebaseAccount({email,password,displayName}){
  auth.createUserWithEmailAndPassword(email, password).then(function(result) {
  console.log('created account');
    console.log("creating songlist document: Users/"+result.user.uid);
    usr = result.user;
    db.collection("Users").doc(result.user.uid).set({songplays: 50, data:''}).then(function(re){
      console.log('DOCUMENT WAS CREATED',re);
    }).catch(function(e){
      console.log("couldn't make user document: "+e);
    }); //add user specific document
    hideSignin();
    return result.user.updateProfile({displayName: displayName});
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log('something bad happened: ');
    console.log(errorCode, errorMessage);
    if(errorCode == 'auth/email-already-in-use') msg = 'Email alreay in use';
    if(errorCode == 'auth/invalid-email') msg = 'Enter a valid email';
    document.getElementById('error').innerHTML = msg;
  });
}
const decrement = firebase.firestore.FieldValue.increment(-1);
function decreaseSongplays(num){
  if(usr){
    db.collection("Users").doc(usr.uid).update({
      songplays: decrement
    }).then(e => {
      songplays--;
      if(document.getElementById('songplayelement')){
        document.getElementById('songplayelement').innerText = `You have ${songplays} song plays left`;
      }
    });
  }
}

function showDeleteMenu(){
  document.getElementById('deleteAcctmenu').style.display = 'unset';
}
function hideDeleteAcctmenu(){
  document.getElementById('deleteAcctmenu').style.display = 'none';
}
