let hitx = 0, mode = 0;
let staves = [], barlinepos = [];
let notesounds = [];
let tickrate = 5;
let notedata = [], noteindex = [25], notesused = [], notetostaff=[], bbl=[];//bbl bar beat list notation is a 2d array storing lists for evry beat of what notes are played at that beat
let playback = false, playbackbar, playbackbeat = 0, playbacktime = 0, playbacktempotime, lasttime = 0, playbackcount = 0, playbackmax = 0;
let paused = false, playsound = true;
let songinthehouse = false, horzon = false; //if false, the staves will be verticaly alligned
let timesig = {top:4,pickup:4,tempo:120,name:"Load song with buttons above"};
let onv = ['G5','F5S','F5','E5','D5S','D5','C5S','C5','B4','A4S','A4','G4S','G4','F4S','F4','E4','D4S','D4','C4S','C4','B3','A3S','A3','G3S','G3'];
let nv = ['G5','F#5','F5','E5','D#5','D5','C#5','C5','B4','A#4','A4','G#4','G4','F#4','F4','E4','D#4','D4','C#4','C4','B3','A#3','A3','G#3','G3'];
p5.disableFriendlyErrors = true;
let focused = false;
function preload(){
  hitimg = loadImage('playRes/guide.png');
  barA = loadImage('playRes/barA.png');
  soundssort = loadImage('playRes/soundssort.png');
  selector = loadImage('playRes/selector.png');
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  attatchDemoClickListeners();
  textStyle(BOLD);
  for(let i = 0; i < 25; i++) notesounds[i] = new Audio('sounds/'+onv[i]+'.wav');
  songinput = createFileInput(getFile);
  songinput.position(6,6);
  songinput.size(96,30);
  songinput.id('file-input');
  songinput.hide();
  songbank = createImg('playRes/library.png');
  songbank.position(79,10);
  songbank.mousePressed(showLib);
  play = createImg('playRes/play.png');
  play.position(178,20);
  play.mousePressed(_play);
  stop = createImg('playRes/stop.png');
  stop.position(226,20);
  stop.mousePressed(_stop);
  barinput = createInput();
  barinput.size(40,26);
  barinput.position(290,41);
  barinput.value(1);
  barM = createImg('playRes/minus.png');
  barM.position(274,45);
  barM.mousePressed(_barM);
  barP = createImg('playRes/plus.png');
  barP.position(331,46);
  barP.mousePressed(_barP);
  tempoinput = createInput();
  tempoinput.position(385,41);
  tempoinput.size(47,26);
  tempoinput.value(100);
  tempoM = createImg('playRes/minus.png');
  tempoM.position(369,45);
  tempoM.mousePressed(_tempoM);
  tempoP = createImg('playRes/plus.png');
  tempoP.position(434,46);
  tempoP.mousePressed(_tempoP);
  transposeinput = createInput();
  transposeinput.size(37,26);
  transposeinput.position(492,41);
  transposeinput.value(0);
  transposeinput.input(updatetranspose);
  transM = createImg('playRes/minus.png');
  transM.position(475,45);
  transM.mousePressed(_transM);
  transP = createImg('playRes/plus.png');
  transP.position(532,46);
  transP.mousePressed(_transP);
  playsounds = createImg('playRes/toggleOn.png');
  playsounds.position(574,42);
  playsounds.mousePressed(soundscheck);
  viewmode = createSelect();
  viewmode.position(646, 39);
  viewmode.size(116,31);
  viewmode.option('High to Low');
  viewmode.option('Most Played');
  viewmode.option('Paired');
  viewmode.changed(resort);
  colormode = createSelect();
  colormode.position(787, 39);
  colormode.size(116,31);
  colormode.option('Random');
  colormode.option('8 note set');
  colormode.option('No Colour');
  colormode.changed(colorchange);
  home = createImg('playRes/home.png');
  home.position(12,14);
  home.parent('homeparent');

  currentsongdata = loadStrings('playRes/lib/songs/London Bridge (6 bells).txt', callbackloadfile);
  styleSettings();
}
function attatchDemoClickListeners(){
  let demos = document.getElementsByClassName('demo');
  for(let i = 0; i < demos.length; i++){
    demos[i].addEventListener("click", clickedOnSong);
  }
}
function draw() {
  background('#f9faeb');
  noStroke();
  //playback
  if(paused){
    if(playback){
      if(tempoinput.value() == '' || isNaN(tempoinput.value()) || tempoinput.value() < 50) playbacktempotime = 600;
      else playbacktempotime = 60000/tempoinput.value();
      if(playbacktime >= 0){
        StartNotesAt(playbackbar,playbackbeat);
        playbackbeat+=0.5;
        if(!Number.isInteger(playbackbeat)) barlinepos.unshift(-100);
        playbacktime -= playbacktempotime/2;
        if(playbackbeat>=(playbackbar==0?timesig.pickup:timesig.top)){
          playbackbeat = 0;
          playbackbar++;
          barinput.value(playbackbar+1);
        }
      }
      if(playbackcount >= playbackmax) _stop();
      playbacktime += (millis()-lasttime);
    }else{
      playbackbar = barinput.value()-1;
    }
  }
  lasttime = millis();

  //draw hitline if song is loaded
  if(songinthehouse){
    strokeWeight(3);
    stroke('#2a2a37');
    if(horzon) line(hitx,0,hitx,windowHeight);
    else line(0,hitx, windowWidth, hitx);
  }

  //draw staves and bar lines, and move them
  stroke('#c5c56c');
  strokeWeight(3);
  if(paused){
    let bl = barlinepos.length;
    for(let i = 0; i < bl; i++){
      barlinepos[i]+=tickrate;
      dbl(i);
    }
    if(barlinepos[bl-1] >= hitx){
      barlinepos.pop();
    }
    for(let i = 0; i < staves.length; i++){
      staves[i].tick();
      staves[i].display();
    }
  }
  else{
    for(let i = 0; i < barlinepos.length; i++){
      dbl(i);
    }
    for(let i = 0; i < staves.length; i++){
      staves[i].display();
    }
  }
  function dbl(i){
    if(horzon) line(barlinepos[i],82,barlinepos[i],windowHeight-13);
    else line(0,barlinepos[i],windowWidth,barlinepos[i]);
  }
  //draw top and bottom bars and background images
  noStroke();
  fill('#185162');
  rect(0,0,windowWidth,81);
  rect(0,windowHeight-13,windowWidth,13);
  image(barA,271,16);
  image(soundssort,576,18);
  image(selector,642,37);
  image(selector,783,37);
}
function callbackloadfile(){
  loadSong(currentsongdata);
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  styleSettings();
}
function styleSettings(){
  if(horzon)hitx = windowWidth*0.83;
  else hitx = windowHeight*0.83;
  for(let i = 0; i < staves.length; i++){
    let y = getStafY(i);
    staves[i].y = y;
    staves[i].s = constrain(horzon?((windowHeight-89)/(notesused.length))*0.9: ((windowWidth-100)/notesused.length)*0.7,30,200);
  }
  if(hitx < 907){
    songinfo.style.display = 'none';
  }
  else songinfo.style.display = 'block';
}
function getFile(file){
  loadSong(file.data.split('\n'));
}
//data is an array of strings, the first 8 are metadata
//the next are pairs of 3, {note pitch form 0-24 (high to low), bar, beat}
function loadSong(data){
  notesused = [], notetostaff = [];
  timesig.pickup = Number(data[0]);
  timesig.top = Number(data[1]);
  timesig.tempo = Number(data[2]);
  tempoinput.value(timesig.tempo);
  barinput.value(1);
  transposeinput.value(0);
  timesig.name = data[3];
  notedata = [(data.length-9)/3];
  playbackmax = (data.length-9)/3;
  bbl = [];
  let index = 8;
  for(let i = 0; i < 25; i++) noteindex[i] = 0;
  for(let i = 0; i < (data.length-9)/3; i++){
    notedata[i] = {p:Number(data[index]),bar:Number(data[index+1]),beat:Number(data[index+2])};
    if(bbl[notedata[i].bar] == undefined) bbl[notedata[i].bar] = [];
    if(bbl[notedata[i].bar][notedata[i].beat] == undefined) bbl[notedata[i].bar][notedata[i].beat] = [];
    bbl[notedata[i].bar][notedata[i].beat].push(notedata[i].p);
    noteindex[notedata[i].p]++;
    index+=3;
  }
  index = 0;
  notetostaff = [];
  for(let i = 0; i < 25; i++){
    if(noteindex[i] > 0){
      notesused.push({note:i,freq:noteindex[i]});
      notetostaff[i]=notesused.length-1;//lookup table from note # to staves[] index
    }
  }
  horzon = notesused.length < 7; //use this if you want it vertically aligned if there is less than 7 bells
  staves = [];
  let len = notesused.length;
  for(let i = 0; i < len; i++){
    let y = getStafY(i);
    staves.push(new Staff(notesused[i].note,y,((windowHeight-89)/len)*0.9));
  }
  playback = false;
  playbackbar = 0;
  playbackbeat = 0;
  paused = false;
  songinthehouse = true;
  resort();
}
function getStafY(i){
  if(horzon) return ((windowHeight-100)/notesused.length)*(i+0.5)+85;
  else return windowWidth - (((windowWidth-100)/notesused.length)*(i+0.5)+50);
}
function StartNotesAt(bar, beat){
  // print(bar,beat)
  if(bar >= bbl.length) return;
  if(bbl[bar] != undefined){
    if(bbl[bar][beat] != undefined){
      let c = bbl[bar][beat];
      for(let i = 0; i < c.length; i++) staves[notetostaff[c[i]]].notes.unshift(-100);
    }
  }
}
class Staff {
  //note (p) 0-24 inclusive 0->G5 | 24 -> G3
  constructor(p, y, s) {
    this.p = p;
    this.y = y;
    this.s = s;
    this.notes = [];//holds ticks
    this.c = redocolor(this.p);
    this.deleteme = false;
  }
  display() {
    if(horzon){
      fill(this.c,66,35);
      strokeWeight(3);
      noStroke();
      textAlign(LEFT, TOP);
      textSize(this.s/3);
      if(isNaN(transposeinput.value())) text(nv[this.p],hitx+this.s/2+5,this.y+5);
      else text(nv[this.p-Number(transposeinput.value())],hitx+this.s/2+5,this.y+5);
      stroke('#2a2a37');
      line(0,this.y,windowWidth,this.y);
      image(hitimg,hitx-this.s/2,this.y-this.s/2,this.s,this.s);

      noStroke();
      let length = this.notes.length;
      for(let i = 0; i < length; i++){
        if(this.notes[i] >= hitx-tickrate-tickrate){
          ellipse(this.notes[i], this.y, this.s*2, this.s*2);
        }
        else{
          ellipse(this.notes[i], this.y, this.s-4, this.s-4);
        }
      }
    }
    else{
      fill(this.c,66,35);
      strokeWeight(3);
      noStroke();
      textAlign(LEFT, TOP);
      textSize(this.s/3);
      let num = nv[this.p];
      if(!isNaN(transposeinput.value())) num = nv[this.p-Number(transposeinput.value())];
      text(num,this.y-this.s/2,hitx+this.s/2+5);
      stroke('#2a2a37');
      line(this.y,0,this.y,windowHeight);
      image(hitimg,this.y-this.s/2,hitx-this.s/2,this.s,this.s);

      noStroke();
      let length = this.notes.length;
      for(let i = 0; i < length; i++){
        if(this.notes[i] >= hitx-tickrate-tickrate){
          ellipse(this.y,this.notes[i], this.s*2, this.s*2);
        }
        else{
          ellipse(this.y,this.notes[i], this.s-4, this.s-4);
        }
      }
    }
  }
  tick(){
    let n = this.p;
    let length = this.notes.length;
    for(let i = length-1; i >= 0; i--){
      this.notes[i]+=tickrate;
    }
    if(this.notes[length-1] >= hitx){
      if(playsound){
        if(isNaN(transposeinput.value())) notesounds[n].cloneNode(true).play();
        else notesounds[n-Number(transposeinput.value())].cloneNode(true).play();
      }
      playbackcount++;
      this.notes.pop();
    }
  }
}
function colorchange(){
  for(let i = 0; i < staves.length; i++){
    staves[i].c = redocolor(staves[i].p);
  }
}
function redocolor(n){
  if(colormode.value() == '8 note set'){
    switch(onv[n].charAt(0)){
      case 'A':
        return color('#2e6bc0');
      break;
      case 'B':
        return color('#8a208c');
      break;
      case 'C':
        return color('#ef1111');
      break;
      case 'D':
        return color('#ef6211');
      break;
      case 'E':
        return color('#e9ef11');
      break;
      case 'F':
        return color('#26ef11');
      break;
      case 'G':
        return color('#49bdf4');
      break;
    }
  }
  else if(colormode.value() == 'Random'){
     colorMode(HSL, 360, 100, 100);
     return color(random(0,360),66,35);
  } else{
    return color('#185162');
  }
}
function _play(){
  if(songinthehouse){
    if(!paused){
      playback = true;
      playbackbar = barinput.value()-1;
    }
    paused = !paused;
    if(paused) play.attribute('src', 'playRes/pause.png');
    else play.attribute('src', 'playRes/play.png');
  }
}
function _stop(){
  for(let i = 0; i < staves.length; i++){
    staves[i].notes = [];
  }
  playback = false;
  playbackbar = 0;
  playbackcount = 0;
  playbackbeat = 0;
  barinput.value(1);
  paused = false;
  play.attribute('src', 'playRes/play.png');
  barlinepos = [];
}
function mouseInRect(a,b,c,d){
  if(mouseX < a+c && mouseX > a && mouseY > b && mouseY < b+d) return true;
  return false;
}
function soundscheck() {
  playsound = !playsound;
  if(playsound) playsounds.attribute('src', 'playRes/toggleOn.png');
  else playsounds.attribute('src', 'playRes/toggleOff.png');
}
function updatetranspose(){
  if(transposeinput.value() != '' && transposeinput.value() != '-'){
    let c = Number(transposeinput.value());
    let lowest = 25;
    let highest = -1;
    let tmp;
    for (let i=notesused.length-1; i>=0; i--) {
        tmp = notesused[i].note;
        if (tmp < lowest) lowest = tmp;
        if (tmp > highest) highest = tmp;
    }
    if(isNaN(transposeinput.value())) transposeinput.value(0);
    if(c > lowest){
      transposeinput.value(lowest);
    }
    if(c < highest-24){
      transposeinput.value(highest-24);
    }
  }
}
function resort(){
  _stop();
  playback = false;
  barinput.value(1);
  playbackbeat = 0;
  paused = false;
  switch(viewmode.value()){
    case 'High to Low':
      notesused.sort((a, b) => (a.note > b.note) ? 1 : -1);
      for(let i = 0; i < 25; i++){
        notetostaff[i]=0;
      }
      for(let i = 0; i < notesused.length; i++){
        notetostaff[notesused[i].note]=i;
      }
      len = notesused.length;
      for(let i = 0; i < len; i++){
        let y = getStafY(i);
        staves[i] = new Staff(notesused[i].note,y,((windowHeight-89)/len)*0.9);
      }
    break;
    case 'Most Played':
      notesused.sort((a, b) => (a.freq > b.freq) ? -1 : 1);
      for(let i = 0; i < 25; i++){
        notetostaff[i]=0;
      }
      for(let i = 0; i < notesused.length; i++){
        notetostaff[notesused[i].note]=i;
      }
      len = notesused.length;
      for(let i = 0; i < len; i++){
        let y = getStafY(i);
        staves[i] = new Staff(notesused[i].note,y,((windowHeight-89)/len)*0.9);
      }
    break;
    case 'Paired':
      notesused.sort((a, b) => (a.freq > b.freq) ? -1 : 1);

      for(let i = 0; i < Math.ceil(notesused.length/2)-1; i++){
        notesused.splice(i*2, 0, notesused[notesused.length-1]);
        notesused.pop();
      }

      for(let i = 0; i < 25; i++){
        notetostaff[i]=0;
      }
      for(let i = 0; i < notesused.length; i++){
        notetostaff[notesused[i].note]=i;
      }
      len = notesused.length;
      for(let i = 0; i < len; i++){
        let y = getStafY(i);
        staves[i] = new Staff(notesused[i].note,y,((windowHeight-89)/len)*0.9);
      }
    break;
  }
  styleSettings();
}
function _barP(){
  barinput.value(Number(barinput.value())+1);
}
function _barM(){
  barinput.value(Number(barinput.value())-1);
  if(Number(barinput.value()) < 1) barinput.value(1);
}
function _tempoP(){
  tempoinput.value(Number(tempoinput.value())+1);
}
function _tempoM(){
  tempoinput.value(Number(tempoinput.value())-1);
}
function _transP(){
  transposeinput.value(Number(transposeinput.value())+1);
  updatetranspose();
}
function _transM(){
  transposeinput.value(Number(transposeinput.value())-1);
  updatetranspose();
}
function keyPressed(){
  if(key == ' ' && focused){
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
  }
}
function searchEvent(){
  searchdiatonic = false;
  updateDlever();
  libbells.value('');
  search(libsearch.value());
}
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});
Object.defineProperty(Array.prototype, 'shuffle', {
    value: function() {
        for (let i = this.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this[i], this[j]] = [this[j], this[i]];
        }
        return this;
    }
});
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
  focused = false;
}
function showCorrectLib(){
  let c = document.getElementsByClassName('cloud');
  for(let i = 0; i < c.length; i++) c[i].style.display = 'block';
}
function showLib(){
  _stop();
  hideSignin();
  hideLogin();
  let usr = firebase.auth().currentUser;
  let demos = document.getElementsByClassName('demo');

  if(usr){
    document.getElementById('libmode').style.display = 'inline';
    document.getElementById('message').style.display = 'none';
  }else{
    document.getElementById('libmode').style.display = 'none';
    document.getElementById('message').style.display = 'inline';
  }
  document.getElementById("library").style.display = "inline";
  focused = false;
}
function hideLib(){
  document.getElementById("library").style.display = "none";
  focused = true;
}
function noUserSignedIn(){
  let c = document.getElementById('entries').childNodes;
  for(let i = 0; i < c.length; i++){
    if(!hasClass(c[i],'demo')){
      c[i].remove();
      i--;
    }
  }
  document.getElementById('acctmenubtn').style.display='none';
  document.getElementById('welcome').innerHTML='Not signed in';
  document.getElementById('Login').src = 'res/login.png';
}
function clickedOnSong(e){
  console.log('clicked on ' + e.target);
  if(e.target.nodeName == 'H1'){
    openSongFromDiv(e.target.parentElement);
  }
  else openSongFromDiv(e.target);
}
function openSongFromDiv(targetdom){
  // document.getElementById('liboptions').style.display = 'inline';
  // document.getElementById('songtitleinlib').innerHTML = targetdom.firstChild.innerHTML;
  document.getElementById("songinfo").innerHTML = targetdom.innerText;
  usr = firebase.auth().currentUser;
  timesig.name = targetdom.firstChild.innerHTML;
  console.log(targetdom.firstChild.innerHTML);
  //load song from database
  if(hasClass(targetdom,'demo')){
    currentsongdata = loadStrings('playRes/lib/songs/'+timesig.name+'.txt', callbackloadfile);
    hideLib();
  }
  else{
    let songlookup = timesig.name.split(',')[0]+':'+usr.displayName+':'+usr.uid;
    try{
      songlookup = targetdom.querySelector("#path").innerText.split(':');
      songlookup.pop();
      songlookup = songlookup.join(':');
    }
    catch{
      console.log('using local songlookup');
    }
    console.log('song im looking for',songlookup);
    var docRef = db.collection("Songs").doc(songlookup);
    docRef.get().then(function(doc) {
      songDocData=doc.data();
      console.log('loading song');
      loadSong(songDocData.data.split(','));
      hideLib();
    }).catch(function(e){
      console.log('no song doc exists with that name   ' + songlookup,e);
    });
  }
}
function changeLibrary(){
  if(document.getElementById('libmode').innerHTML == 'Show Private Library'){
    //hide all public songs
    let c = document.getElementsByClassName('cloud');
    for(let i = 0; i < c.length; i++) c[i].style.display = 'none';
    //show all private songs
    c = document.getElementsByClassName('personal');
    for(let i = 0; i < c.length; i++) c[i].style.display = 'block';
    document.getElementById('libmode').innerHTML = 'Show Public Library';
  }else{
    document.getElementById('libmode').innerHTML = 'Show Private Library';
    let c = document.getElementsByClassName('cloud');
    for(let i = 0; i < c.length; i++) c[i].style.display = 'block';
    c = document.getElementsByClassName('personal');
    for(let i = 0; i < c.length; i++) c[i].style.display = 'none';
  }
}
function genPublicThumbs(){
  var docRef = db.collection("Songlists").doc('list1');
  console.log('getting songlist 1... ' + docRef);
  docRef.get().then(function(doc) {
    currentUserDocData=doc.data();
    //loop through all songs and create thumbs
    let names = currentUserDocData.data.split(',');
    for(let i = 0; i < names.length-1; i++){
      console.log('creating elements');
      let g = names[i].split(':');
      var name = document.createElement("H1");
      name.innerHTML = g[0] + ', by ' + g[1] + '  (' + g[3] + ' bells)'; //names[i].split(':')[1] for public or private
      name.className = "innertext";
      var info = document.createElement("H1");
      info.innertext = "";
      info.className = "innertext";
      var path = document.createElement("H3");
      path.style.display = 'none';
      path.id='path';
      path.innerText = names[i];
      var entry = document.createElement("DIV");
      entry.appendChild(name);
      entry.appendChild(info);
      entry.appendChild(path);
      entry.className = 'entry public cloud';
      entry.id='songthumb';
      entry.addEventListener("click", clickedOnSong);
      try{openSongEditMenu(entry);}catch(err){}
      document.getElementById("entries").appendChild(entry);
    }
    //hide all private songs initialy
    // let usr = firebase.auth().currentUser;
    // if(usr){
      let c = document.getElementsByClassName('personal');
      for(let i = 0; i < c.length; i++) c[i].style.display = 'none';
    // }
  }).catch(function(error) {
      console.log("couldn't get songlist: " + error);
  });
}

//search functions
var searchElement = document.getElementById('searchLib');
var searchType = document.getElementById('selectorLib');

searchElement.addEventListener('change',e =>{
  search(searchType.value,e.target.value);
});
searchElement.addEventListener('input',e =>{
  search(searchType.value,e.target.value);
});
searchType.addEventListener('change',e =>{
  searchElement.value = '';
  search(0,'');
});

function search(type,value){
  // console.log(type,value);
  let numericValue = parseInt(value);
  let eles = document.getElementsByClassName('entry');
  for(let i = 0; i < eles.length; i++){
    let string = eles[i].querySelector('.innertext');
    if(string){
      if(type == 0){
        if(string.innerText.toLowerCase().includes(value.toLowerCase())){
          eles[i].style.display = 'block';
        }else{
          eles[i].style.display = 'none'
        }
      }
      else if(type == 1){
        if(parseInt(string.innerText.split('(')[1]) < numericValue){
          eles[i].style.display = 'block';
        }else{
          eles[i].style.display = 'none'
        }
      }
      else if(type == 2){
        if(parseInt(string.innerText.split('(')[1]) >= numericValue){
          eles[i].style.display = 'block';
        }else{
          eles[i].style.display = 'none'
        }
      }
      else if(type == 3 && string.innerText.split(', by')[1]){
        if(string.innerText.split(', by')[1].toLowerCase().includes(value.toLowerCase())){
          eles[i].style.display = 'block';
        }else{
          eles[i].style.display = 'none'
        }
      }
    }
  }
}
