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
let focused = false;
let ineditmode = false;
let ispublic = false;
let prevbells = 0, prevname = undefined;
let songLoaded = false;

var nv = ['G5','F5S','F5','E5','D5S','D5','C5S','C5','B4','A4S','A4','G4S','G4','F4S','F4','E4','D4S','D4','C4S','C4','B3','A3S','A3','G3S','G3'];
function preload(){
  panel = loadImage('composeRes/panel.png');
  playhead=loadImage('composeRes/arrow.png');
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  nameinput = createInput();
  nameinput.position(313,354);
  nameinput.size(216,31);
  nameinput.hide();
  tempoinput = createInput();
  tempoinput.position(444,36);
  tempoinput.size(40,26);
  tempoinput.attribute('autocomplete','off');
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
  download.mousePressed(BigD);
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
  bars.attribute('autocomplete','off');
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
  document.getElementById('editingname').addEventListener('change',e => {
    timesig.name = cleanSongName(e.target.value) || timesig.name;
  });
  //if not signed in, show new song
  if(document.getElementById('lib').style.display == 'none') showNewSong(false,true);
}
for(let i = 0; i < 25; i++){
  // notesounds[i] = new Audio('sounds/'+onv[i]+'.wav');
  createjs.Sound.registerSound('sounds/'+nv[i]+'.wav', i);
}
function draw() {
  if(firstdraw) hideOverlay();
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
    if(mouseX < 100){
      playAudioNote(mousenote);
    }
    else{
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
          console.log({p:mousenote,bar:mousebar,beat:mousebeat});
            notedata.push({p:mousenote,bar:mousebar,beat:mousebeat});
            playAudioNote(mousenote);
            notesplayed = 0;
          }
      }
    }
  }
  if(cancelmenu){cancelmenu = false; mode = 0}
}
function keyPressed(){
  if(key == ' ' && focused && document.activeElement.tagName != 'INPUT'){
    _play();
  }
  if(keyCode == ENTER){
    let log = document.getElementById('loginenter');
    let sig = document.getElementById('signinenter');
    if(document.getElementById('Logindiv').style.display != 'none'){
      log.click();
    }
    if(document.getElementById('Signindiv').style.display != 'none'){
      sig.click();
    }
    if(document.getElementById('newsong').style.display != 'none'){
      document.getElementById('newSongClick').click();
    }
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

      playAudioNote(foo.p);
      if(playback)notesplayed++;
    }
  }
}
function BigD(){
  if(focused){
    let dt = getExportArray();
    console.log(dt.join(','));
    save(dt,timesig.name.replace(/ /g, "_")+'.txt');
  }
}
function getSongString(){
  return getExportArray().join(',');
}
function getSongStringURL(){
  return `sheetmusic.html?s=${encodeURIComponent(getExportArray().join('i'))}&name=${encodeURIComponent(timesig.name)}`;
}
function openSongStringURL(){
  let ele = document.createElement('a');
  ele.href = window.location.origin+'/'+getSongStringURL();
  ele.target = '_blank';
  ele.click();
  ele.remove();
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
    if(notedata[i].p != null && notedata[i].bar != null && notedata[i].beat != null){
      xport[index] = notedata[i].p;
      index++;
      xport[index] = notedata[i].bar;
      index++;
      xport[index] = notedata[i].beat;
      index++;
    }
  }
  return xport;
}
function BigU(file) {
  console.log('yeey');
  let arr = file.data.split('\n');
  if(Number(arr[1]) > 0 && Number(arr[1]) < 15){ //detect if the song is real
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
    setEditingName(timesig.name);
    setEditMode(true);
    if(usr){
      document.getElementById('openlib').innerHTML = 'Save and Return';
    }
    hideNewSong();
    hideLib();
    hideAcctMenu();
    upload.elt.value=null;
  }
  document.getElementById('')
}
function setEditingName(n){
  document.getElementById('editingname').value = n;
}
function showEditingName(){
  document.getElementById('editingname').style.display = 'inline';
  document.getElementById('editingText').style.display = 'inline';
}
function hideEditingName(){
  document.getElementById('editingname').style.display = 'none';
  document.getElementById('editingText').style.display = 'none';
}
function setEditMode(v){
  ineditmode = v;
  if(v){
    songLoaded = true;
    showCancel();
    promptUserBeforeLeaving();
    document.getElementById('openlib').style.display = 'inline';
    showEditingName();
    document.getElementById('btn').style.display = 'inline';
  }else{
    hideCancel();
    dontPromptUserBeforeLeaving();
    document.getElementById('openlib').style.display = 'none';
    hideEditingName();
    document.getElementById('btn').style.display = 'none';
  }
}
function setSongString(file){
  let arr = file.split(',');
  timesig.pickup = Number(arr[0]);
  timesig.top = Number(arr[1]);
  timesig.tempo = Number(arr[2]);
  notedata = [(arr.length-9)/3];
  let index = 8;
  for(let i = 0; i < (arr.length-9)/3; i++){
    notedata[i] = {p:Number(arr[index]),bar:Number(arr[index+1]),beat:Number(arr[index+2])};
    index+=3;
  }
}
function shiftleft(){
  if(cm > 1 && mode == 0 && focused){
    cm--;
  }
}
function shiftright(){
  if(mode == 0 && focused){
    cm++;
  }
}
function _play(){
  if(focused){
    if(mode == 0){
      if(playback){
        playback = false;
        playbackbar = cm-1;
        backbar.value(cm);
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
    console.log('try');
  }
}
function transposeUp(){
  transp(-1);
}
function transposeDown(){
  transp(1);
}
function transp(d){
  if(mode == 0 && focused){
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
  if(!ineditmode) showNewSong();
}
function showLogin() {
  document.getElementById('forgotpasswordbtn').innerText = 'Forgot Password';
  document.getElementById('emaillogin').value = '';
  document.getElementById('pswlogin').value = '';
  hideLib();
  hideNewSong();
  focused = false;
  let imgsrc = document.getElementById('Login').src;
  if(imgsrc.substr(imgsrc.length-5) == 'n.png'){
    document.getElementById("Logindiv").style.display = "inline";
  }else{
    console.log('signing out...');
    signOutActions();
  }
}
function signOutActions(){
  firebase.auth().signOut().then(function() {
    // Sign-out successful.
    document.getElementById('Login').src = 'res/login.png';
  }).catch(function(error) {
    console.log('could not sign out: '+error);
  });
}
function hideSignin() {
  document.getElementById("Signindiv").style.display = "none";
  focused = true;
  if(!ineditmode && !songLoaded) showNewSong();
}
function showSignin() {
  if(usr){
    signOutActions();
    return;
  }
  document.getElementById('email').value = '';
  document.getElementById('psw').value = '';
  document.getElementById('dispname').value = '';
  document.getElementById("Signindiv").style.display = "inline";
  hideLib();
  hideAcctMenu();
  hideNewSong();
  focused = false;
}
function accCreatedCallback(){
  console.log('User Acc Created');
}
function hideAcctMenu(){
  document.getElementById('acctmenu').style.display = "none";
}
function hideAccDone(){
  if(ineditmode){
    focused = true;
  }else{
    showLib();
  }
}
function showLib(){
  if(ineditmode){
    // uploadOnline();
    setEditMode(false);
  }
  hideNewSong();
  hideAcctMenu();
  focused = false;
  document.getElementById('lib').style.display = 'inline';
  document.getElementById('openlib').style.display = 'none';
  document.getElementById('newsongname').style.border = 'none';
}
function hideLib(){
  document.getElementById('lib').style.display = 'none';
}
function closeLib(){
  if(!ineditmode){
    showNewSong(true);
  }else{
    document.getElementById('openlib').innerHTML = 'Save and Return';
    document.getElementById('openlib').style.display = 'inline';
  }
}
function showNewSong(cancellable,donthidelib){
  if(!donthidelib) hideLib();
  hideAcctMenu();
  focused = false;
  document.getElementById('bpb').value = '';
  document.getElementById('pb').value = '';
  document.getElementById('newsongname').value = '';
  if(cancellable){
    document.getElementById('newSongCancel').style.display = 'unset';
  }else{
    document.getElementById('newSongCancel').style.display = 'none';
  }
  document.getElementById('newsong').style.display = 'inline';
}
function hideNewSong(){
  focused = true;
  document.getElementById('newsong').style.display = 'none';
}
function cleanSongName(name){
  return (name.replace(/[^a-zA-Z0-9\s_]/g, '').substring(0,50));
}

function setupNewSong(){
  let validsongname = cleanSongName(document.getElementById('newsongname').value);
  setEditingName(validsongname.split(':')[0]);
  timesig.name = validsongname;
  setEditMode(true);
  focused = true;
  ispublic = false;
  prevbells = 0;
  prevname = undefined;
  if(usr){
    document.getElementById('openlib').innerHTML = 'Save and Return';
  }else{
    document.getElementById('openlib').innerHTML = 'Login to save';
  }
}

//createSongTileFromTimesig();
function createSongTileFromTimesig(){
  console.log('makin a new one');
  let validsongname="";

  var name = document.createElement("H1");
  validsongname = cleanSongName(timesig.name);
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
      },{merge:true});
    }
  }).catch(function(error) {
      console.log("Error getting user specific document:", error);
  });
}
function playAudioNote(n){
  createjs.Sound.play(n);
}
function showCancel(){
  document.getElementById('cancelEditmode').style.display = 'inline';
  document.getElementById('showSheetmusic').style.display = 'inline';
}
function hideCancel(){
  document.getElementById('cancelEditmode').style.display = 'none';
  document.getElementById('showSheetmusic').style.display = 'none';
}
function cancelEditmode(){
  setEditMode(false);
  setSongString("4,4,100,0,,,,");
  songLoaded = false;
  if(usr){
    showLib();
  }else{
    showNewSong();
  }
}
function clickedOnSong(e){
  console.log('clicked on ' + e.target);
  if(e.target.nodeName == 'H1'){
    openSongEditMenu(e.target.parentElement);
  }
  else openSongEditMenu(e.target);
}
function openSongEditMenu(targetdom){
  let entries = document.getElementsByClassName('entry');
  for(let i = 0; i < entries.length; i++){
    entries[i].style.border = 'none';
  }
  targetdom.style.border = 'solid black 3px';
  let btn = document.getElementById('gopublic');
  document.getElementById('liboptions').style.display = 'inline';
  document.getElementById('songtitleinlib').innerHTML = targetdom.firstChild.innerHTML;
  console.log('this song is public: ' + hasClass(targetdom, 'public'));
  ispublic = hasClass(targetdom, 'public');
  if(hasClass(targetdom, 'public')) btn.innerHTML = 'Make Private';
  else btn.innerHTML = 'Make Public';
  document.getElementById('deletesong').innerHTML = "Delete Forever";
}
function playInPlayer(){
  let c = document.createElement('a');
  let songname = document.getElementById('songtitleinlib').innerHTML;
  let songDoc = songname+':'+usr.displayName+':'+usr.uid;
  c.href = `play.html?song=${encodeURIComponent(songDoc)}`;
  c.click();
  c.remove();
}
//save file to web button (save -> save to web menu)
function uploadOnline(){
  console.log('upload online');
  console.log('timesig',timesig);
  console.log('public',ispublic);
  console.log('prevbells',prevbells);
  let usr = firebase.auth().currentUser;
  //ineditmode -> are we currently editing a song from the library?
  if(ineditmode){
    //save to database and return to console
    let songstring = getSongString();
    let songname = cleanSongName(timesig.name);
    if(usr){
      songLoaded = false;
      if(prevname == songname || !prevname){

        //find the song name in the big songlist and replace it with the new song name and bell count
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

        db.collection("Songs").doc(songname+':'+usr.displayName+':'+usr.uid).set({
          data: songstring,
        }).then(function(){
          deleteAllNotes();
          let sth = document.getElementsByClassName('entry');
          let songExists = false;
          for(let i = 0; i < sth.length; i++){
            songExists = (songExists || sth[i].querySelector('.innertext').innerText == songname);
          }
          if(!songExists) createSongTileFromTimesig();
        });
        setEditMode(false);
        showLib();
      }
      else if(prevname){
        //find the song name in the big songlist and replace it with the new song name and bell count
        if(ispublic){
          db.collection("Songlists").doc("list1").get().then(function(list){
            let bells = songstring.split(',')[3];
            console.log(ispublic, prevbells, bells)
            let songlist = list.data().data.replace((prevname+':'+usr.displayName+':'+usr.uid+':'+parseInt(prevbells)+','),(songname+':'+usr.displayName+':'+usr.uid+':'+parseInt(bells)+','));
            db.collection("Songlists").doc("list1").set({
              data: songlist,
            });
          }).catch(function(e){
            console.log('in uploadOnline: '+e);
          });
        }

        db.collection("Songs").doc(prevname+':'+usr.displayName+':'+usr.uid).delete().then(()=>{
          db.collection("Songs").doc(songname+':'+usr.displayName+':'+usr.uid).set({
            data: songstring,
          }).then(function(){
            deleteAllNotes();
            let sth = document.getElementsByClassName('entry');
            let songExists = false;
            for(let i = 0; i < sth.length; i++){
              if(sth[i].querySelector('.innertext').innerText == prevname){
                sth[i].querySelector('.innertext').innerText = songname;
              }
            }
            document.getElementById('liboptions').style.display = 'inline';
            document.getElementById('songtitleinlib').innerHTML = songname;
            setEditMode(false);
            showLib();
          });
        });

        let docRef = db.collection("Users").doc(usr.uid);
        docRef.get().then(function(doc) {
          currentUserDocData=doc.data();
          console.log(prevname,songname);
          let newusrdata = currentUserDocData.data.replace(prevname,songname);
          if(usr){
            docRef.set({
              data: newusrdata,
            },{merge:true}).then(function(){
              console.log('renamed user song');
            });
          }
        });
      }
    }else{
      showLogin();
    }
  }
  else if(usr){
    //upload song right to library
    showLib();
  }else{
    showLogin();
  }
}
function authStateSignedin(){
  if(!songLoaded) showLib();
  document.getElementById('openlib').innerHTML = 'Save and Return';
}
function editsong(){
  focused = true;
  usr = firebase.auth().currentUser;
  timesig.name = document.getElementById('songtitleinlib').innerHTML;
  //load song from database
  setEditingName(timesig.name);
  console.log(timesig.name+':'+usr.displayName+':'+usr.uid);
  var docRef = db.collection("Songs").doc(timesig.name+':'+usr.displayName+':'+usr.uid);
  docRef.get().then(function(doc) {
    songDocData=doc.data();
    prevbells = songDocData.data.split(',')[3];
    prevname = timesig.name;
    setSongString(songDocData.data);
    hideLib();
    document.getElementById('openlib').innerHTML = 'Save and Return';
    setEditMode(true);
  }).catch(function(e){
    console.log('could not open song' + e);
    prevname = undefined;
  });
}
function newsong(){
  let a = document.getElementById('bpb').value || 4;
  let b = document.getElementById('pb').value || 0;
  let c = document.getElementById('newsongname').value;
  if(cleanSongName(c).length >= 1){


    timesig.top = constrain(parseInt(a),2,6);
    timesig.pickup = parseInt(b);
    if(timesig.pickup == 0) timesig.pickup = timesig.top;
    timesig.pickup = constrain(timesig.pickup,1,timesig.top);
    setupNewSong();
    hideNewSong();
  }else{
    document.getElementById('newsongname').style.border = 'solid red';
    document.getElementById('newsongname').focus();
  }
}
function deletesong(){
  let usr = firebase.auth().currentUser;
  let songname = document.getElementById('songtitleinlib').innerHTML;
  if(document.getElementById('deletesong').innerHTML == "Click again to confirm delete"){
    if(ispublic) makePrivate(true);
    else{
      console.log(songname+':'+usr.displayName+':'+usr.uid);
      db.collection("Songs").doc(songname+':'+usr.displayName+':'+usr.uid).delete().then(function() {
      console.log("Song doc successfully deleted!");
      removeThumb(songname);
      //delete personal song index .replace('song name','');
      replacePersonalSongList(songname,'');
    });
  }
  }
  document.getElementById('deletesong').innerHTML = "Click again to confirm delete";
}
function replacePersonalSongList(a,b){
  var docRef = db.collection("Users").doc(usr.uid);
  docRef.get().then(function(doc) {
    currentUserDocData=doc.data();
    let newusrdata = currentUserDocData.data.replace(a+':0'+',',b).replace(a+':1'+',',b);
    if(usr){
      docRef.set({
        data: newusrdata,
      },{merge:true}).then(function(){
        console.log('song successful removed from private library');
      });
    }
  });
}
function removeThumb(songname){
  var thumbs = document.getElementsByClassName("entry");
  for (var i = 0; i < thumbs.length; i++) {
    if(thumbs[i].firstChild.innerHTML == songname){
      thumbs[i].remove();
      i--;
    }
  }
  document.getElementById('liboptions').style.display = 'none';
  document.getElementById('songtitleinlib').innerHTML = '';
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
              },{merge:true}).then(function(){
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
                        },{merge:true}).then(function(){
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
    btn.innerHTML = 'Click to confirm making song public';
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
                  },{merge:true}).then(function(){
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
function deleteAccCallback(){}
function noUserSignedIn(){
  usr = undefined;
  document.getElementById('entries').innerHTML = '';
  document.getElementById('acctmenubtn').style.display='none';
  document.getElementById('welcome').innerHTML='Not signed in';
  document.getElementById('Login').src = 'res/login.png';
  document.getElementById('openlib').innerHTML = 'Login to save';

  if(!songLoaded){
    setEditMode(false)
    setSongString("4,4,100,0,,,,");
    showNewSong(false);
  }else{
    focused=true;
    setEditMode(true);
  }
}
var firstdraw = true;
function hideOverlay(){
  if(!window.mobileCheck()){
    document.getElementById('hideonload').style.background = 'none';
    setTimeout(removeOverlay,1000);
  }else{
    window.location = window.location.origin;
  }
  firstdraw = false;
  document.getElementById('loadingIcon').remove();
}
function removeOverlay(){
  document.getElementById('hideonload').remove();
}
function promptUserBeforeLeaving(){
  window.onbeforeunload = function() {
      return true;
  };
}
function dontPromptUserBeforeLeaving(){
  window.onbeforeunload = null;
}
window.mobileCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};
