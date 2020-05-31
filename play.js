let songinput, songbank, play,stop,
 barM, barP, tempoM, tempoP, transM, transP,
 tempoinput, barinput, transposeinput, playsounds, viewmode,colormode, home;
let hitimg, barA, soundssort;
let hitx = 0, mode = 0;
let staves = [], barlinepos = [];
var notesounds = [];
let tickrate = 5;
let notedata = [], noteindex = [25], notesused = [], notetostaff=[];
let playback = false, playbackbar, playbackbeat = 0, playbacktime = 0, playbacktempotime, lasttime = 0;
let paused = false, playsound = true;
let songinthehouse = false;
var timesig = {top:4,pickup:4,tempo:120,name:"Load song with buttons above"};
var onv = ['G5','F5S','F5','E5','D5S','D5','C5S','C5','B4','A4S','A4','G4S','G4','F4S','F4','E4','D4S','D4','C4S','C4','B3','A3S','A3','G3S','G3'];
var nv = ['G5','F#5','F5','E5','D#5','D5','C#5','C5','B4','A#4','A4','G#4','G4','F#4','F4','E4','D#4','D4','C#4','C4','B3','A#3','A3','G#3','G3'];
// let bkimg;
//library elements
let showlib = true, libmain, libbanner, libsearch, libP, libM, libonoff, left, right, entercode, libcancel,currentsongdata,dat=[], formatdat = [];
let sorteddat = [], shiftElements = 0, searchdiatonic = false;
//code elements
let codepanel, getcode, ok, cancel, code;
let permited = false, justwaitforoneclick = false;
p5.disableFriendlyErrors = true;
function preload(){//-160 x
  hitimg = loadImage('playRes/guide.png');
  barA = loadImage('playRes/_barA.png');
  soundssort = loadImage('playRes/_soundssort.png');
  selector = loadImage('playRes/_selector.png');
  libmain = loadImage('playRes/lib/main.png');
  dat = loadStrings('playRes/lib/dat.txt');
  libbanner = loadImage('playRes/banner.png');
  codepanel = loadImage('playRes/_codewindow.png');
  // bkimg = loadImage('bkgimg.png');
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  textStyle(BOLD);
  for(let i = 0; i < 25; i++) notesounds[i] = loadSound('sounds/'+onv[i]+'.wav');
  songinput = createFileInput(getFile);
  songinput.position(6,6);
  songinput.size(96,30);
  songinput.id('file-input');
  songinput.hide();
  songbank = createImg('playRes/_library.png');
  songbank.position(12,10);
  songbank.mousePressed(openSongBank);
  play = createImg('playRes/_play.png');
  play.position(137,20);
  play.mousePressed(_play);
  stop = createImg('playRes/_stop.png');
  stop.position(182,20);
  stop.mousePressed(_stop);
  barinput = createInput();
  barinput.size(40,26);
  barinput.position(265,41);
  barinput.value(1);
  barM = createImg('playRes/_minus.png');
  barM.position(249,45);
  barM.mousePressed(_barM);
  barP = createImg('playRes/_plus.png');
  barP.position(306,46);
  barP.mousePressed(_barP);
  tempoinput = createInput();
  tempoinput.position(360,41);
  tempoinput.size(47,26);
  tempoinput.value(100);
  tempoM = createImg('playRes/_minus.png');
  tempoM.position(344,45);
  tempoM.mousePressed(_tempoM);
  tempoP = createImg('playRes/_plus.png');
  tempoP.position(409,46);
  tempoP.mousePressed(_tempoP);
  transposeinput = createInput();
  transposeinput.size(37,26);
  transposeinput.position(467,41);
  transposeinput.value(0);
  transposeinput.input(updatetranspose);
  transM = createImg('playRes/_minus.png');
  transM.position(450,45);
  transM.mousePressed(_transM);
  transP = createImg('playRes/_plus.png');
  transP.position(507,46);
  transP.mousePressed(_transP);
  playsounds = createImg('playRes/_toggleOn.png');
  playsounds.position(549,42);
  playsounds.mousePressed(soundscheck);
  viewmode = createSelect();
  viewmode.position(621, 39);
  viewmode.size(116,31);
  viewmode.option('High to Low');
  viewmode.option('Most Played');
  viewmode.changed(resort);
  colormode = createSelect();
  colormode.position(762, 39);
  colormode.size(116,31);
  colormode.option('Random');
  colormode.option('8 note set');
  colormode.option('No Colour');
  colormode.changed(colorchange);
  home = createImg('playRes/_home.png');
  home.position(windowWidth-67,14);
  home.parent('homeparent');
  libsearch = createInput();
  libsearch.input(searchEvent);
  libbells = createInput();
  libbells.input(searchBellEvent);
  libM = createImg('playRes/_minus.png');
  libP = createImg('playRes/_plus.png');
  libonoff = createImg('playRes/lib/off.png');
  libonoff.mousePressed(toggleDiatonic);
  left = createImg('playRes/lib/left.png');
  left.mousePressed(_left);
  right = createImg('playRes/lib/right.png');
  right.mousePressed(_right);
  entercode = createImg('playRes/lib/entercode.png');
  entercode.mousePressed(toggleCode);
  libcancel = createImg('playRes/_cancel.png');
  libcancel.mousePressed(hideLibrary);

  //enter code menu (incomplete)
  getcode = createImg('playRes/_getcode.png');
  getcode.parent('getcodeparent');
  ok = createImg('playRes/_ok.png');
  ok.mousePressed(okCode);
  cancel = createImg('playRes/_cancel.png');
  cancel.mousePressed(cancelCode);
  code = createInput();
  code.attribute('type','password');
  hideCode();
  for(let i = 0; i < dat.length-1; i++){
    let s = dat[i].split(',');
    formatdat[i] = {name:s[0],premium:(s[1]=='true'),bells:s[2],diatonic:s[3]};
  }
  hitx = windowWidth*0.83;
  currentsongdata = loadStrings('playRes/lib/songs/London_Bridge.txt', callbackloadfile);
  sorteddat = formatdat;
}
function draw() {
  background('#f9faeb');
  // if(!songinthehouse) for(let x = 0; x < windowWidth/bkimg.width; x++){
  //   for(let y = 0; y < windowHeight/bkimg.height; y++){
  //     image(bkimg,x*bkimg.width,y*bkimg.height);
  //   }
  // }
  noStroke();
  //playback
  if(paused){
    if(playback){
      if(tempoinput.value() == '' || isNaN(tempoinput.value()) || tempoinput.value() < 50) playbacktempotime = 600;
      else playbacktempotime = 60000/tempoinput.value();
      barinput.value(playbackbar+1);
      if(playbacktime >= 0){
        StartNotesAt(playbackbar,playbackbeat);
        playbackbeat+=0.5;
        if(!Number.isInteger(playbackbeat)) barlinepos.unshift(-100);
        playbacktime -= playbacktempotime/2;
        if(playbackbeat>=(playbackbar==0?timesig.pickup:timesig.top)){
          playbackbeat = 0;
          playbackbar++;
        }
      }
      playbacktime += (millis()-lasttime);
    }else{
      playbackbar = barinput.value()-1;
    }
  }
    lasttime = millis();

  if(songinthehouse){
    strokeWeight(3);
    stroke('#2a2a37');
    line(hitx,0,hitx,windowHeight);
  }

  noStroke();
  fill('#185162');
  rect(0,0,windowWidth,81);
  rect(0,windowHeight-13,windowWidth,13);
  image(barA,246,16);
  image(soundssort,551,18);
  image(selector,617,37);
  image(selector,758,37);
  //draw staves
  if(paused){
    stroke('#c5c56c');
    strokeWeight(3);
    for(let i = 0; i < barlinepos.length; i++){
      barlinepos[i]+=tickrate;
    }
    if(barlinepos[barlinepos.length-1] >= hitx){
      barlinepos.pop();
    }
    for(let i = 0; i < barlinepos.length; i++){
      line(barlinepos[i],82,barlinepos[i],windowHeight-13);
    }
    for(let i = 0; i < staves.length; i++){
      staves[i].tick();
      staves[i].display();
    }
  }
  else{
    strokeWeight(3);
    stroke('#c5c56c');
    for(let i = 0; i < barlinepos.length; i++){
      line(barlinepos[i],82,barlinepos[i],windowHeight-13);
    }
    for(let i = 0; i < staves.length; i++){
      staves[i].display();
    }
  }
  if(showlib){
    noStroke();
    fill('#185162');
    rect(windowWidth/2-336,130,672,361,9);
    fill('#1e6980');
    rect(windowWidth/2-317,200,634,254,4);
    image(libmain,windowWidth/2-317, 139);
    libsearch.position(windowWidth/2-314,159);
    libsearch.size(290,29);
    libbells.position(windowWidth/2+24,158);
    libbells.size(37,30);
    libP.position(windowWidth/2+62,166);
    libM.position(windowWidth/2+8,165);
    libonoff.position(windowWidth/2+173,158);
    left.position(windowWidth/2-33, 459);
    right.position(windowWidth/2+7, 459);
    entercode.position(windowWidth/2+88,459);
    libcancel.position(windowWidth/2+247,459);

    fill('#7edf27');
    switch(max(0,sorteddat.length-shiftElements)){
      default:
        drawSongTile(windowWidth/2+7,332,sorteddat[3+shiftElements]);
      case 3:
        drawSongTile(windowWidth/2+7,211,sorteddat[2+shiftElements]);
      case 2:
        drawSongTile(windowWidth/2-303,332,sorteddat[1+shiftElements]);
      case 1:
        drawSongTile(windowWidth/2-303,211,sorteddat[0+shiftElements]);
      case 0:
      break;
    }
  }
  if(mode == 2)showCodeMenu();
}
function mousePressed(){
  if(justwaitforoneclick) justwaitforoneclick = false;
  else if(showlib) switch(sorteddat.length-shiftElements){
    default:
      mouseOverTile(windowWidth/2+7,332,sorteddat[3+shiftElements]);
    case 3:
      mouseOverTile(windowWidth/2+7,211,sorteddat[2+shiftElements]);
    case 2:
      mouseOverTile(windowWidth/2-303,332,sorteddat[1+shiftElements]);
    case 1:
      mouseOverTile(windowWidth/2-303,211,sorteddat[0+shiftElements]);
    case 0:
    break;
  }
}
function callbackloadfile(){
  loadSong(currentsongdata);
}
function mouseOverTile(x,y,obj){
  if(mouseX > x && mouseX < x+296 && mouseY > y && mouseY < y+107 && !(obj.premium && !permited)){
    currentsongdata = loadStrings('playRes/lib/songs/'+(obj.name.replace(/ /g, '_'))+'.txt', callbackloadfile);
    hideLibrary();
  }
}
function drawSongTile(x,y,obj){
  if(mouseX > x && mouseX < x+296 && mouseY > y && mouseY < y+107){
    if(obj.premium && !permited){fill('#911db4');
    }else fill('#63b51a');
  }
  else{
    if(obj.premium && !permited){fill('#b327df');
    }else fill('#7edf27');
  }
  rect(x,y,296,107,4);
  if(obj.premium && !permited) image(libbanner,x+251,y);
  fill(255);
  textSize(16);
  textAlign(CENTER,CENTER);
  text(obj.name,x+148,y+45);
  textSize(12);
  text(obj.bells+' Bells '+(obj.diatonic=='true'?'Diatonic':'Chromatic'),x+148,y+70);
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  hitx = windowWidth*0.83;
  for(let i = 0; i < staves.length; i++){
    let y = getStafY(i);
    staves[i].y = y;
    staves[i].s = ((windowHeight-89)/(notesused.length))*0.9;
  }
  home.position(windowWidth-67,14);
}
function getFile(file){
  loadSong(file.data.split('\n'));
  showlib=false;
  hideLibrary();
}
function loadSong(data){
  notesused = [];
  notetostaff = [];
  timesig.pickup = Number(data[0]);
  timesig.top = Number(data[1]);
  timesig.tempo = Number(data[2]);
  tempoinput.value(timesig.tempo);
  barinput.value(1);
  transposeinput.value(0);
  timesig.name = data[3];
  notedata = [(data.length-9)/3];
  let index = 8;
  for(let i = 0; i < 25; i++) noteindex[i] = 0;
  for(let i = 0; i < (data.length-9)/3; i++){
    notedata[i] = {p:Number(data[index]),bar:Number(data[index+1]),beat:Number(data[index+2])};
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
  return ((windowHeight-100)/notesused.length)*(i+0.5)+85;
}
function StartNotesAt(bar, beat){
  for(let i = 0; i < notedata.length; i++){
    c = notedata[i];
    if(c.bar == bar && c.beat == beat){
      //add note to appropriate staff
      staves[notetostaff[c.p]].notes.unshift(-100);
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
  }
  display() {
    strokeWeight(3);
    fill('#134F94');
    noStroke();
    textAlign(LEFT, TOP);
    textSize(this.s/3);
    if(isNaN(transposeinput.value())) text(nv[this.p],hitx+this.s/2+5,this.y+5);
    else text(nv[this.p-Number(transposeinput.value())],hitx+this.s/2+5,this.y+5);
    stroke('#2a2a37');
    line(0,this.y,windowWidth,this.y);
    image(hitimg,hitx-this.s/2,this.y-this.s/2,this.s,this.s);
    fill('#134F94');
    noStroke();
    let length = this.notes.length;
    fill(this.c,66,35);
    for(let i = 0; i < length; i++){
      ellipse(this.notes[i], this.y, this.s-4, this.s-4);
    }
  }
  tick(){
    let n = this.p;
    let length = this.notes.length;
    for(let i = 0; i < length; i++){
      this.notes[i]+=tickrate;
    }
    if(this.notes[length-1] >= hitx){
      if(playsound){
        if(isNaN(transposeinput.value())) notesounds[n].play();
        else notesounds[n-Number(transposeinput.value())].play();
      }
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
    if(paused) play.attribute('src', 'playRes/_pause.png');
    else play.attribute('src', 'playRes/_play.png');
  }
}
function _stop(){
  for(let i = 0; i < staves.length; i++){
    staves[i].notes = [];
  }
  playback = false;
  playbackbar = 0;
  playbackbeat = 0;
  barinput.value(1);
  paused = false;
  play.attribute('src', 'playRes/_play.png');
  barlinepos = [];
}
function mouseInRect(a,b,c,d){
  if(mouseX < a+c && mouseX > a && mouseY > b && mouseY < b+d) return true;
  return false;
}
function soundscheck() {
  playsound = !playsound;
  if(playsound) playsounds.attribute('src', 'playRes/_toggleOn.png');
  else playsounds.attribute('src', 'playRes/_toggleOff.png');
}
function updatetranspose(){
  if(transposeinput.value() != '' && transposeinput.value() != '-'){
    let c = Number(transposeinput.value());
    let lowest = 25;
    let highest = -1;
    var tmp;
    for (var i=notesused.length-1; i>=0; i--) {
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
  switch(viewmode.value()){
    case 'High to Low':
      playback = false;
      barinput.value(1);
      playbackbeat = 0;
      paused = false;
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
      playback = false;
      barinput.value(1);
      playbackbeat = 0;
      paused = false;

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
  }
}
function openSongBank(){
  if(mode == 0) showLibrary();
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
function showLibrary(){
  mode = 1;
  showlib = true;
  libsearch.show();
  libP.show();
  libM.show();
  libonoff.show();
  libbells.show();
  left.show();
  right.show();
  entercode.show();
  libcancel.show();
  libsearch.elt.focus();
}
function hideLibrary(){
  mode = 0;
  showlib = false;
  libsearch.hide();
  libP.hide();
  libM.hide();
  libonoff.hide();
  libbells.hide();
  left.hide();
  right.hide();
  entercode.hide();
  libcancel.hide();
}
function _left(){
  if(shiftElements > 3) shiftElements-=4;
}
function _right(){
  if(sorteddat.length-shiftElements > 4) shiftElements+=4;
}
function toggleDiatonic(){
  searchdiatonic = !searchdiatonic;
  updateDlever();
  libsearch.value('');
  libbells.value('');
  diatonicsearch();
}
function updateDlever(){
  if(searchdiatonic) libonoff.attribute('src','playRes/lib/on.png');
  else libonoff.attribute('src','playRes/lib/off.png');
}
function toggleCode(){
  hideLibrary();
  mode = 2;
}
function showCodeMenu(){
  image(codepanel, windowWidth/2-155, 130);
  getcode.position(windowWidth/2-45,215);
  getcode.show();
  cancel.position(windowWidth/2+58,215);
  cancel.show();
  ok.position(windowWidth/2-127,215);
  ok.show();
  code.show();
  code.position(windowWidth/2-68,177);
  code.size(131,28);
  code.elt.focus()
}
function hideCode(){
  getcode.hide();
  ok.hide();
  cancel.hide();
  code.hide();
}
function okCode(){
  mode = 0;
  hideCode();
  if(code.value() == 'sudoadmin'){
    permited = true;
    showLibrary();
    showlib = true;
    mode = 1;
    justwaitforoneclick = true;
  }
}
function cancelCode(){
  mode = 0;
  hideCode();
}
function keyPressed(){
  if(key == ' ' && !showlib){
    _play();
  }
  if(keyCode == ENTER){
    switch(mode){
      case 0:
        showlib = true;
        showLibrary();
      break;
      case 2:
        okCode();
        justwaitforoneclick=false;
      break;
    }
  }
}
function searchEvent(){
  searchdiatonic = false;
  updateDlever();
  libbells.value('');
  search(libsearch.value());
}
function searchBellEvent(){
  searchdiatonic = false;
  updateDlever();
  libsearch.value('');
  searchBellLimit();
}
function diatonicsearch(){
  shiftElements = 0;
  if(searchdiatonic){
  let list = [];
  for(let i = 0; i < formatdat.length; i++){
    if(formatdat[i].diatonic == 'true') list.push(formatdat[i]);
  }
  sorteddat = list;
  }
  else sorteddat = [...formatdat];
}
function searchBellLimit(){
  shiftElements = 0;
  shiftElements = 0;
  if(Number(libbells.value()) > 0){
  let list = [];
  for(let i = 0; i < formatdat.length; i++){
    if(Number(formatdat[i].bells) <= Number(libbells.value())) list.push(formatdat[i]);
  }
  sorteddat = list;
  }
  else sorteddat = [...formatdat];
}
function search(keyterm){
  shiftElements = 0;
  const options = {includeScore: false,keys: ['name']};
  const fuse = new Fuse(formatdat, options);
  const result = fuse.search(libsearch.value());
  sorteddat = [];
  if(result.length > 0) for(let i = 0; i < result.length; i++){
    sorteddat.push(result[i].item);
  }
  else sorteddat = formatdat;
}
window.onblur = function() {
    if(paused) _play();
};
//disable right click
// document.addEventListener('contextmenu', function(e) {
//   e.preventDefault();
// });
