var usrname = '';
var privateNames = '';
var publicNames = '';

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
    let pconfirm = document.getElementById('psw2').value;
    let disp = document.getElementById("dispname").value;
    let verif = true, msg = '';
    if(password != pconfirm){
      verif = false;
      msg="Passwords don't match";
    }
    if(password.length < 5){
      verif = false;
      msg="Password too short";
    }
    if(password.length > 30){
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
    if(verif){ auth.createUserWithEmailAndPassword(email, password).then(function(result) {
      console.log('created account');
      // console.log("creating songlist document: Users/"+result.user.uid);
      // db.collection("Users").doc(result.user.uid).set({songplays: 10, data:''}).then(function(re){
      //   console.log('DOCUMENT WAS CREATED',re);
      // }).catch(function(e){
      //   console.log("couldn't make user document: "+e);
      // }); //add user specific document
      hideSignin();
    return result.user.updateProfile({displayName: disp});
  }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log('something bad happened: ');
      console.log(errorCode, errorMessage);
      if(errorCode == 'auth/email-already-in-use') msg = 'Email alreay in use';
      if(errorCode == 'auth/invalid-email') msg = 'Enter a valid email'
      document.getElementById('error').innerHTML = msg;
    });
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
    // ...
    });
  }
}
//get status of login
auth.onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    let usr = firebase.auth().currentUser;
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
function deleteAcct(){
  let d = document.getElementById('delbtn');
  var user = firebase.auth().currentUser;
  // if(d.innerHTML == 'Are you sure? This cannot be undone'){
    //delete account here
    //delete user-specific document
    console.log('preparing to delete...');
    const credential = firebase.auth.EmailAuthProvider.credential(user.email,document.getElementById('delpword').value);
// reauthenticate, delete firestore file, delete user
  user.reauthenticateWithCredential(credential).then(function(){
    db.collection("Users").doc(user.uid).delete().then(function() {
        console.log("User Data successfully deleted. Deleting account...");
        user.delete().then(function() {
          console.log('user deleted');
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
      document.getElementById('delpword').style.backgroundColor = "yellow";
    }
  });
}
