var ui = [], panel;
var cm = 1;//current measure (horizontal scrolling)
var mousenote = -1;
var mousebar = -1, mousebeat = -1;
var notedata = [];
var timesig = {top:4,pickup:4,tempo:120,name:"New Song"};
var faketimesig;
var notesounds = [];
var playback = false, playhead;
var lasttime = 0;
var mode = 0;//play mode 0 | song settings mode 1 |
var tempoinput, tempoP, tempoM, backbar, barP, barM, download, upload, play, right, left, up, down, clear, home;
var playbackbar = 0, playbackbeat = 0, playbacktime = 0, playbacktempotime = 500;
//settings menu
let nameinput, bars, pickups, smok, smcancel;
let cancelmenu = false;
let notesplayed = 0;
let focused = true;
let ineditmode = false;
let ispublic = false;
let prevbells = 0;

var nv = ['G5','F5S','F5','E5','D5S','D5','C5S','C5','B4','A4S','A4','G4S','G4','F4S','F4','E4','D4S','D4','C4S','C4','B3','A3S','A3','G3S','G3'];
function preload(){
  panel = loadImage('composeRes/panel.png');
  playhead=loadImage('composeRes/arrow.png');
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  for(let i = 0; i < 25; i++) notesounds[i] = loadSound('sounds/'+nv[i]+'.wav');
  nameinput = createInput();
  nameinput.position(313,354);
  nameinput.size(216,31);
  nameinput.hide();
  tempoinput = createInput();
  tempoinput.position(444,36);
  tempoinput.size(40,26);
  nameinput.size(195,31);
  tempoinput.value(100);
  tempoM = createImg('composeRes/minus.png');
  tempoM.position(430,41);
  tempoM.mousePressed(_tempoM);
  tempoP = createImg('composeRes/plus.png');
  tempoP.position(484,42);
  tempoP.mousePressed(_tempoP);
  backbar = createInput();
  backbar.position(358,36);
  backbar.size(36,25);
  backbar.value(1);
  barM = createImg('composeRes/minus.png');
  barM.position(342,41);
  barM.mousePressed(_barM);
  barP = createImg('composeRes/plus.png');
  barP.position(395,42);
  barP.mousePressed(_barP);
  upload = createFileInput(BigU);
  upload.position(78, 41);
  upload.id('file-input');
  upload.hide();
  download = createImg('composeRes/savefile.png');
  download.position(79,10);
  download.mousePressed(showSaver);
  play = createImg('composeRes/play.png');
  play.position(189,21);
  play.mousePressed(_play);
  left = createImg('composeRes/left.png');
  left.position(237,21);
  left.mousePressed(shiftleft);
  right = createImg('composeRes/right.png');
  right.position(282,21);
  right.mousePressed(shiftright);
  up = createImg('composeRes/up.png');
  up.position(526,35);
  up.mousePressed(transposeUp);
  down = createImg('composeRes/down.png');
  down.position(569,35);
  down.mousePressed(transposeDown);
  // smok = createImg('composeRes/apply.png');
  // smok.mousePressed(_smok);
  smcancel = createImg('composeRes/cancel.png');
  smcancel.mousePressed(_smcancel);
  bars = createInput();
  pickups = createInput();
  bars.size(39,29);
  pickups.size(39,29);
  barsM = createImg('composeRes/minus.png');
  barsM.mousePressed(_pickupsM);
  barsP = createImg('composeRes/plus.png');
  barsP.mousePressed(_pickupsP);
  bars.value(4);
  pickupsM = createImg('composeRes/minus.png');
  pickupsM.mousePressed(_barsM);
  pickupsP = createImg('composeRes/plus.png');
  pickupsP.mousePressed(_barsP);
  pickups.value(4);
  nameinput.value("new song");

  faketimesig = Object.assign({}, timesig);

  home = createImg('composeRes/home.png');
  home.position(12,14);
  home.parent('homeparent');
}

function draw() {
  playbacktempotime = 60000/timesig.tempo;
  textSize(12);
  timesig.tempo = tempoinput.value();
  if(timesig.tempo < 50) timesig.tempo = 50;
  if(notesplayed >= notedata.length && playback){
    // _play();
    notesplayed = 0;
  }
  //playback control
  if(playback){
    backbar.value(playbackbar+1);
    if(playbacktime >= 0){
      playNotesAt(playbackbar,playbackbeat);
      playbackbeat+=0.5;
      playbacktime -= playbacktempotime/2;
      if(playbackbeat>=(playbackbar==0?timesig.pickup:timesig.top)){
        playbackbeat = 0;
        playbackbar++;
      }
    }
    playbacktime += (millis()-lasttime);
  }else{
    playbackbar = backbar.value()-1;
  }
  lasttime = millis();

  background('#fffdf2');
  noStroke();
  fill('#185162');
  rect(0,0,windowWidth,81);
  rect(0,height-15,windowWidth,15);
  image(panel,339,10);

  //draw horizontal lines
  stroke('#2a2a37');
  strokeWeight(1);
  for(let i = 0; i < 25; i++){
    let y = 100 + (i/25.0)*(windowHeight-15-100);
    line(0,y,windowWidth,y);
  }
  if(mouseY > 100 && mouseY < windowHeight-15){
    mousenote = floor((mouseY-100)/(windowHeight-15-100)*25);
  }else{
    mousenote=-1;
  }
  //draw selectorbar
  if(mousenote != -1 && focused){
    noStroke();
    fill(220);
    let y = 100 + (mousenote/25.0)*(windowHeight-15-100);
    rect(70,y,windowWidth,(windowHeight-15-100)/25);
  }
  //draw keyboard
  stroke(0);
  for(let i = 0; i < 25; i++){
    if((i+9)%12==1||(i+9)%12==3||(i+9)%12==6||(i+9)%12==8||(i+9)%12==10){
      fill(0);
      let y = 100 + (i/25.0)*(windowHeight-115);
      rect(0,y,80,(windowHeight-115)/25);
    }
    else{
      fill(255);
      let y = 100 + (i/25.0)*(windowHeight-115);
      rect(0,y,100,(windowHeight-115)/25);
    }
  }
  //draw notes
  for(let i = 0; i < notedata.length; i++){
    drawNote(notedata[i].p,notedata[i].bar,notedata[i].beat);
  }
  //draw barlines
  for(let i = 0; i < 10; i++){
    let x = 120 + i*((windowWidth-120)/10);
    if(i+cm == 1){//if its the pickup bar
      x = 120 + ((windowWidth-120)/10)-(((windowWidth-120)/10*(1/timesig.top))*timesig.pickup);
    }
    stroke('#2a2a37');
    strokeWeight(3);
    if(i+cm-1 == playbackbar && playbackbeat == 0){
      stroke(255,0,0);
      strokeWeight(5);
      image(playhead,x-9, 78);
    }
    line(x,80,x, windowHeight-15);

    if(i+cm-1 == playbackbar && playbackbeat == 0.5){
      stroke(255,0,0);
      strokeWeight(5);
      let t=x+((windowWidth-120)/10*(1/timesig.top))/2;
      line(t,85,t, windowHeight-15);
      image(playhead,t-9, 80);
    }

    if(mouseInRect(x,80,((windowWidth-120)/10*(1/timesig.top))/2,windowHeight-95)){
      mousebar = i+cm-1;
      mousebeat = 0;
    }
    if(mouseInRect(x+((windowWidth-120)/10*(1/timesig.top))/2,80,((windowWidth-120)/10*(1/timesig.top))/2,windowHeight-95)){
      mousebar = i+cm-1;
      mousebeat = 0.5;
    }
    noStroke();
    fill(0);
    text(i+cm,x+4,95);
    //draw beatlines
    for(let e = 1; e < (i+cm==1?timesig.pickup:timesig.top); e++){
      let sx = (windowWidth-120)/10*(e/timesig.top);
      stroke('#908e9f');
      strokeWeight(1);
      if(i+cm-1 == playbackbar && playbackbeat == e){
        stroke(255,0,0);
        strokeWeight(5);
        image(playhead,x+sx-9, 80);
      }
      line(x+sx,85,x+sx, windowHeight-15);
      if(i+cm-1 == playbackbar && playbackbeat == e+0.5){
        stroke(255,0,0);
        strokeWeight(5);
        let t=x+sx+((windowWidth-120)/10*(1/timesig.top))/2;
        line(t,85,t, windowHeight-15);
        image(playhead,t-9, 80);
      }
      if(mouseInRect(x+sx,85,((windowWidth-120)/10*(1/timesig.top))/2,windowHeight-100)){
        mousebar = i+cm-1;
        mousebeat = e;
      }else if(mouseInRect(x+sx+((windowWidth-120)/10*(1/timesig.top))/2,85,((windowWidth-120)/10*(1/timesig.top))/2,windowHeight-100)){
        mousebar = i+cm-1;
        mousebeat = e+0.5;
      }
      noStroke();
      fill(120);
      text(e+1,x+sx+3,95);
    }
  }

  if(mode == 1) drawSettings();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
function mousePressed(){
  if(mode == 0){
  if(mouseY > 105 && mouseY < windowHeight-15){//roll
    if(playback) _play();
    let ok = true;
      for(let i = 0; i < notedata.length; i++){
        let foo = notedata[i];
        if(foo.p == mousenote && foo.bar == mousebar && foo.beat == mousebeat && focused){
          notedata.splice(i,1);
          ok = false;
        }
      }
      if(ok && focused){
          notedata.push({p:mousenote,bar:mousebar,beat:mousebeat});
          if(notesounds[mousenote]) notesounds[mousenote].play();
          notesplayed = 0;
        }
    }
  }
  if(cancelmenu){cancelmenu = false; mode = 0}
}
function keyPressed(){
  if(key == ' ' && focused){
    _play();
  }
}
function mouseInRect(a,b,c,d){
  if(mouseX < a+c && mouseX > a && mouseY > b && mouseY < b+d) return true;
  return false;
}
function drawNote(p,bar,beat){
  stroke('#908e9f');
  strokeWeight(1);
  fill(0,255,0);
  //offset + beat + bar
  var pickupoffset = 0;
  if(bar == 0) pickupoffset = timesig.top-timesig.pickup;
  if(bar-cm+1 >= 0 && bar-cm+1 < 10) rect(120 + ((windowWidth-120)/10*(1/timesig.top))*(beat+pickupoffset) + ((windowWidth-120)/10)*(bar-cm+1),100+(windowHeight-15-100)*(p/25),(windowWidth-120)/10*(1/timesig.top)/2,(windowHeight-15-100)/25,5,5,5,5,5);
}
function playNotesAt(bar, beat){
  for(let i = 0; i < notedata.length; i++){
    let foo = notedata[i];
    if(foo.bar == bar && foo.beat == beat){
      if(notesounds[foo.p]) notesounds[foo.p].play();
      if(playback)notesplayed++;
    }
  }
}
function BigD(){
  let dt = getExportArray();
  console.log(dt.join(','));
  save(dt,timesig.name.replace(/ /g, "_")+'.txt');
}
function getSongString(){
  return getExportArray().join(',');
}
function getExportArray(){
  let xport = [];
  let index = 8;
  let expfile = '';
  xport[0] = timesig.pickup;
  xport[1] = timesig.top;
  xport[2] = timesig.tempo;

  var counts = {};
  for (var i = 0; i < notedata.length; i++) {counts[notedata[i].p] = 1 + (counts[notedata[i].p] || 0);}
  xport[3] = Object.keys(counts).length;//bell count
  if(xport[3] === undefined) xport[3] = 0;
  xport[4] = '';
  xport[5] = '';
  xport[6] = '';
  xport[7] = '';
  for(let i = 0; i < notedata.length; i++){
    xport[index] = notedata[i].p;
    index++;
    xport[index] = notedata[i].bar;
    index++;
    xport[index] = notedata[i].beat;
    index++;
  }
  return xport;
}
function BigU(file) {
  let arr = file.data.split('\n');
  timesig.pickup = Number(arr[0]);
  timesig.top = Number(arr[1]);
  timesig.tempo = Number(arr[2]);
  timesig.name = file.name.substring(0, file.name.length-4).replace(/_/g, " ");
  notedata = [(arr.length-9)/3];
  let index = 8;
  for(let i = 0; i < (arr.length-9)/3; i++){
    notedata[i] = {p:Number(arr[index]),bar:Number(arr[index+1]),beat:Number(arr[index+2])};
    index+=3;
  }
}
function setSongString(file){
  let arr = file.split(',');
  timesig.pickup = Number(arr[0]);
  timesig.top = Number(arr[1]);
  timesig.tempo = Number(arr[2]);
  timesig.name = 'unnamed';
  notedata = [(arr.length-9)/3];
  let index = 8;
  for(let i = 0; i < (arr.length-9)/3; i++){
    notedata[i] = {p:Number(arr[index]),bar:Number(arr[index+1]),beat:Number(arr[index+2])};
    index+=3;
  }
}
function shiftleft(){
  if(cm > 1 && mode == 0){
    cm--;
  }
}
function shiftright(){
  if(mode == 0){
    cm++;
  }
}
function _play(){
  if(mode == 0){
    if(playback){
      playback = false;
      playbackbar = 0;
      backbar.value(1);
      playbackbeat = 0;
      playbacktime = 0;
      play.attribute('src', 'composeRes/play.png');
    }
    else{
      playback = true;
      playbackbar = backbar.value()-1;
      playbackbeat = 0;
      play.attribute('src', 'composeRes/stop.png');
    }
  }
}
function transposeUp(){
  transp(-1);
}
function transposeDown(){
  transp(1);
}
function transp(d){
  if(mode == 0){
    for(let i = 0; i < notedata.length; i++){
      if(Number(notedata[i].p)+Number(d) < 0 || Number(notedata[i].p)+Number(d) > 24){
        return;
      }
    }
    for(let i = 0; i < notedata.length; i++){
      notedata[i].p = notedata[i].p + d;
    }
  }
}
function toggleSettings(){
  if(mode == 0){
    mode = 1;
  }
}
//song menu OK/apply and cancel
// function _smok(){
//   timesig.name = nameinput.value().replace(/:/g, "_").replace(/,/g, "_");
//   timesig.top = constrain(Number(pickups.value()),2,6);
//   timesig.pickup = Number(bars.value());
//   if(timesig.pickup == 0) timesig.pickup = timesig.top;
//   timesig.pickup = constrain(timesig.pickup,1,timesig.top);
//   hideSettings();
//   cancelmenu = true;
// }
function _smcancel(){
  faketimesig = Object.assign({}, timesig);
  cancelmenu = true;
}
function _tempoM(){
  tempoinput.value(Number(tempoinput.value())-1);
}
function _tempoP(){
  tempoinput.value(Number(tempoinput.value())+1);
}
function _barM(){
  if(mode == 0) backbar.value(Number(backbar.value())-1);
}
function _barP(){
  if(mode == 0) backbar.value(Number(backbar.value())+1);
}

function _barsM(){
  if(mode == 1) bars.value(Number(bars.value())-1);
}
function _barsP(){
  if(mode == 1) bars.value(Number(bars.value())+1);
}
function _pickupsM(){
  if(mode == 1) pickups.value(Number(pickups.value())-1);
}
function _pickupsP(){
  if(mode == 1) pickups.value(Number(pickups.value())+1);
}
function deleteAllNotes(){
  if(mode == 0){
    notedata = [];
    cm = 1;
  }
}
function hideLogin() {
  document.getElementById("Logindiv").style.display = "none";
  focused = true;
}
function showLogin() {
  hideLib();
  focused = false;
  let imgsrc = document.getElementById('Login').src;
  if(imgsrc.substr(imgsrc.length-5) == 'n.png'){
    document.getElementById("Logindiv").style.display = "inline";
  }else{
    console.log('signing out...');
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
      document.getElementById('Login').src = 'res/login.png';
    }).catch(function(error) {
      // An error happened.
      console.log('could not sign out: '+error);
    });
  }
}
function hideSignin() {
  document.getElementById("Signindiv").style.display = "none";
  focused = true;
}
function showSignin() {
  document.getElementById("Signindiv").style.display = "inline";
  hideLib();
  hideAcctMenu();
  focused = false;
}
function showLib(){
  hideNewSong();
  hideAcctMenu();
  focused = false;
  document.getElementById('lib').style.display = 'inline';
  document.getElementById('openlib').style.display = 'none';
}
function hideLib(){
  document.getElementById('lib').style.display = 'none';
  document.getElementById('openlib').style.display = 'inline';
  focused = true;
}
function showNewSong(){
  hideLib();
  hideAcctMenu();
  focused = false;
  document.getElementById('newsong').style.display = 'inline';
}
function hideNewSong(){
  focused = true;
  document.getElementById('newsong').style.display = 'none';
}
function showSaver(){
  hideLib();
  hideAcctMenu();
  focused = false;
  document.getElementById('saver').style.display = 'inline';
}
function hideSaver(){
  focused = true;
  document.getElementById('saver').style.display = 'none';
}
function cleanSongName(name){
  return name.replace(/[^a-zA-Z0-9\s_]/g, '');
}
function setupNewSong(){
  let validsongname="";
  var name = document.createElement("H1");
  validsongname = cleanSongName(document.getElementById('newsongname').value);
  name.innerHTML = validsongname;
  name.className = "innertext";
  var info = document.createElement("H1");
  info.innerHTML = "";
  info.className = "innertext";
  var entry = document.createElement("DIV");
  entry.appendChild(name);
  entry.appendChild(info);
  entry.className = "entry";
  entry.id='songthumb';
  entry.addEventListener("click", clickedOnSong);
  openSongEditMenu(entry);
  document.getElementById("entries").appendChild(entry);
  let usr = firebase.auth().currentUser;
  let currentUserDocData;
  var docRef = db.collection("Users").doc(usr.uid);
  docRef.get().then(function(doc) {
    currentUserDocData=doc.data();
    let newusrdata = currentUserDocData.data + validsongname+':0'+',';// 0 means private, 1 means public
    if(usr){
      docRef.set({
        data: newusrdata,
      }).then(function(){
        db.collection("Songs").doc(validsongname+':'+usr.displayName+':'+usr.uid).set({
          data: timesig.pickup+','+timesig.top+',100,,,,,'
        });
        document.getElementById('openlib').innerHTML = 'Save and Return';
        document.getElementById('songtitleinlib').innerHTML = validsongname.split(':')[0];
        ineditmode = true;
        document.getElementById('editingname').style.display = 'inline';
        document.getElementById('btn').style.display = 'inline';
      });
    }
  }).catch(function(error) {
      console.log("Error getting user specific document:", error);
  });
}
function clickedOnSong(e){
  console.log('clicked on ' + e.target);
  if(e.target.nodeName == 'H1'){
    openSongEditMenu(e.target.parentElement);
  }
  else openSongEditMenu(e.target);
}
function openSongEditMenu(targetdom){
  let btn = document.getElementById('gopublic');
  document.getElementById('liboptions').style.display = 'inline';
  document.getElementById('songtitleinlib').innerHTML = targetdom.firstChild.innerHTML;
  console.log('this song is public: ' + hasClass(targetdom, 'public'));
  ispublic = hasClass(targetdom, 'public');
  if(hasClass(targetdom, 'public')) btn.innerHTML = 'Make Private';
  else btn.innerHTML = 'Make Public';
  document.getElementById('deletesong').innerHTML = "Delete Forever";
}
//save file to web button (save -> save to web menu)
function uploadOnline(){
  hideSaver();
  let usr = firebase.auth().currentUser;
  //ineditmode -> are we currently editing a song from the library?
  if(ineditmode){
    //save to database and return to console
    let songstring = getSongString();
    if(usr){
      if(ispublic){
        db.collection("Songlists").doc("list1").get().then(function(list){
          let bells = songstring.split(',')[3];
          console.log(ispublic, prevbells, bells)
          let songlist = list.data().data.replace((songname+':'+usr.displayName+':'+usr.uid+':'+parseInt(prevbells)+','),(songname+':'+usr.displayName+':'+usr.uid+':'+parseInt(bells)+','));
          db.collection("Songlists").doc("list1").set({
            data: songlist,
          });
        }).catch(function(e){
          console.log('in uploadOnline: '+e);
        });
      }

      let songname = document.getElementById('songtitleinlib').innerHTML;
      db.collection("Songs").doc(songname+':'+usr.displayName+':'+usr.uid).set({
        data: songstring,
      }).then(function(){
        deleteAllNotes();
      });
    }
    showLib();
    ineditmode = false;
    document.getElementById('editingname').style.display = 'none';
    document.getElementById('btn').style.display = 'none';
    document.getElementById('openlib').innerHTML = 'Open Library';
  }
  else if(usr){
    //upload song right to library
    showLib();
  }else{
    //set some flag that will upload the song after they authenticate
    showLogin();
  }
}
function editsong(){
  ineditmode=true;
  document.getElementById('editingname').style.display = 'inline';
  document.getElementById('btn').style.display = 'inline';
  usr = firebase.auth().currentUser;
  timesig.name = document.getElementById('songtitleinlib').innerHTML;
  //load song from database
  document.getElementById('editingname').innerHTML = 'Editing: ' +timesig.name;
  console.log(timesig.name+':'+usr.displayName+':'+usr.uid);
  var docRef = db.collection("Songs").doc(timesig.name+':'+usr.displayName+':'+usr.uid);
  docRef.get().then(function(doc) {
    songDocData=doc.data();
    prevbells = songDocData.data.split(',')[3];
    setSongString(songDocData.data);
    hideLib();
    document.getElementById('openlib').innerHTML = 'Save and Return';
  }).catch(function(e){
    console.log('could not open song' + e);
  });
}
function newsong(){
  let a = document.getElementById('bpb').value;
  let b = document.getElementById('pb').value;
  let c = document.getElementById('newsongname').value;
  if(a.length > 0 && b.length > 0 && c.length > 0){
    timesig.top = constrain(parseInt(a),2,6);
    timesig.pickup = parseInt(b);
    if(timesig.pickup == 0) timesig.pickup = timesig.top;
    timesig.pickup = constrain(timesig.pickup,1,timesig.top);
    setupNewSong();
    editsong();
    hideNewSong();
  }
}
function deletesong(){
  let usr = firebase.auth().currentUser;
  let songname = document.getElementById('songtitleinlib').innerHTML;
  if(document.getElementById('deletesong').innerHTML == "Are you sure?"){
    console.log('deleting song...');
    if(ispublic) makePrivate(true);
    else{
      db.collection("Songs").doc(songname+':'+usr.displayName+':'+usr.uid).delete().then(function() {
      console.log("Song doc successfully deleted!");
      //delete personal song index .replace('song name','');
      var docRef = db.collection("Users").doc(usr.uid);
      docRef.get().then(function(doc) {
        currentUserDocData=doc.data();
        let newusrdata = currentUserDocData.data.replace(songname+':0'+',','').replace(songname+':1'+',','');
        if(usr){
          docRef.set({
            data: newusrdata,
          }).then(function(){
            console.log('song successful removed from private library');
            var thumbs = document.getElementsByClassName("entry");
            for (var i = 0; i < thumbs.length; i++) {
              if(thumbs[i].firstChild.innerHTML == songname){
                thumbs[i].remove();
                i--;
              }
            }
            document.getElementById('liboptions').style.display = 'none';
            document.getElementById('songtitleinlib').innerHTML = '';
          });
        }
      });
    });
  }
  }
  document.getElementById('deletesong').innerHTML = "Are you sure?";
}
function makePrivate(deleteAfter){
  let btn = document.getElementById('gopublic');
  let songname = document.getElementById('songtitleinlib').innerHTML;
  var docRef = db.collection("Songlists").doc("list1");
  let songdat='';
  docRef.get().then(function(doc) {
    songdat=doc.data().data;//songlist
    let cu = firebase.auth().currentUser;
    db.collection("Songs").doc(songname+':'+cu.displayName+':'+cu.uid).get().then(function(doc){
      //delete the song from the public songlists
      console.log((songname+':'+cu.displayName+':'+cu.uid+':'+parseInt(doc.data().data.split(',')[3])+','));//real
      let songlist = songdat.replace((songname+':'+cu.displayName+':'+cu.uid+':'+parseInt(doc.data().data.split(',')[3])+','),'');//fake
      console.log(songlist);
        docRef.set({
          data: songlist,
        }).then(function(){
          let docRef = db.collection("Users").doc(cu.uid);
          docRef.get().then(function(doc) {
            currentUserDocData=doc.data();
            let newusrdata = currentUserDocData.data.replace(songname+':1',songname+':0');// 0 means private, 1 means public
              docRef.set({
                data: newusrdata,
              }).then(function(){
                let els = document.getElementsByClassName('entry');
                for(let i = 0; i < els.length; i++){
                  if(els[i].firstChild.innerHTML == songname){
                    els[i].className = 'entry';
                  }
                }
                console.log('song is now private');
                btn.innerHTML = 'Make Public';
                if(deleteAfter){
                  db.collection("Songs").doc(songname+':'+cu.displayName+':'+cu.uid).delete().then(function() {
                    console.log("Song doc successfully deleted!");
                    //delete personal song index .replace('song name','');
                    var docRef = db.collection("Users").doc(cu.uid);
                    docRef.get().then(function(doc) {
                      currentUserDocData=doc.data();
                      let newusrdata = currentUserDocData.data.replace(songname+':0'+',','').replace(songname+':1'+',','');
                      if(cu){
                        docRef.set({
                          data: newusrdata,
                        }).then(function(){
                          console.log('song successful removed from private library');
                          var thumbs = document.getElementsByClassName("entry");
                          for (var i = 0; i < thumbs.length; i++) {
                            if(thumbs[i].firstChild.innerHTML == songname){
                              thumbs[i].remove();
                              i--;
                            }
                          }
                          document.getElementById('liboptions').style.display = 'none';
                          document.getElementById('songtitleinlib').innerHTML = '';
                        });
                      }
                    });
                  });
                }
                return;
              });
          });
        });
      });
  });
}
function goPublic(){
  let btn = document.getElementById('gopublic');
  let songname = document.getElementById('songtitleinlib').innerHTML;
  if(btn.innerHTML == 'Make Public'){
    btn.innerHTML = 'Click to Confirm';
  }else{
    if(btn.innerHTML == 'Make Private'){
      //make the song private
      makePrivate(false);
    }
    else{
      console.log('making song public...');
      ispublic = true;
      //add song name to songlist
      var docRef = db.collection("Songlists").doc("list1");
      let songdat='';
      docRef.get().then(function(doc) {
        songdat=doc.data().data;
        let cu = firebase.auth().currentUser;
        db.collection("Songs").doc(songname+':'+cu.displayName+':'+cu.uid).get().then(function(doc){
          let songlist = songdat+songname+':'+cu.displayName+':'+cu.uid+':'+parseInt(doc.data().data.split(',')[3])+',';
            docRef.set({
              data: songlist,
            }).then(function(){
              let docRef = db.collection("Users").doc(cu.uid);
              docRef.get().then(function(doc) {
                currentUserDocData=doc.data();
                let newusrdata = currentUserDocData.data.replace(songname+':0',songname+':1');// 0 means private, 1 means public
                  docRef.set({
                    data: newusrdata,
                  }).then(function(){
                    let els = document.getElementsByClassName('entry');
                    for(let i = 0; i < els.length; i++){
                      if(els[i].firstChild.innerHTML == songname){
                        els[i].className = 'entry public';
                      }
                    }
                    console.log('song is now public');
                    btn.innerHTML = 'Make Private';
                  });
              });
            });
          });
      });
    }
  }
}
function noUserSignedIn(){
  document.getElementById('entries').innerHTML = '';
  document.getElementById('openlib').style.display='none';
  document.getElementById('acctmenubtn').style.display='none';
  document.getElementById('welcome').innerHTML='Not signed in';
  console.log("not logged in yet");
  document.getElementById('Login').src = 'res/login.png';
}
