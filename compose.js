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
let nameinput, bars, pickups, opensettings, smok, smcancel;
let settingsimg, cancelmenu = false;
let notesplayed = 0;
let permited = false;
//entercodemenu
let code, ok, cancel, getcode;
let codepanel, prompt, showprompt = false;

var nv = ['G5','F5S','F5','E5','D5S','D5','C5S','C5','B4','A4S','A4','G4S','G4','F4S','F4','E4','D4S','D4','C4S','C4','B3','A3S','A3','G3S','G3'];
function preload(){
  panel = loadImage('composeRes/_panel.png');
  codepanel = loadImage('composeRes/_codewindow.png');
  playhead=loadImage('composeRes/arrow.png');
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  for(let i = 0; i < 25; i++) notesounds[i] = loadSound('sounds/'+nv[i]+'.wav');
  settingsimg = loadImage('composeRes/_settings.png');
  nameinput = createInput();
  nameinput.position(313,354);
  nameinput.size(216,31);
  nameinput.hide();
  tempoinput = createInput();
  tempoinput.position(377,36);
  tempoinput.size(40,26);
  nameinput.size(195,31);
  tempoinput.value(100);
  tempoM = createImg('composeRes/_minus.png');
  tempoM.position(363,41);
  tempoM.mousePressed(_tempoM);
  tempoP = createImg('composeRes/_plus.png');
  tempoP.position(417,42);
  tempoP.mousePressed(_tempoP);
  backbar = createInput();
  backbar.position(291,36);
  backbar.size(36,25);
  backbar.value(1);
  barM = createImg('composeRes/_minus.png');
  barM.position(275,41);
  barM.mousePressed(_barM);
  barP = createImg('composeRes/_plus.png');
  barP.position(328,42);
  barP.mousePressed(_barP);
  upload = createFileInput(BigU);
  upload.position(11, 41);
  upload.id('file-input');
  upload.hide();
  download = createImg('composeRes/_savefile.png');
  download.position(12,10);
  download.mousePressed(BigD);
  play = createImg('composeRes/_play.png');
  play.position(122,21);
  play.mousePressed(_play);
  left = createImg('composeRes/_left.png');
  left.position(170,21);
  left.mousePressed(shiftleft);
  right = createImg('composeRes/_right.png');
  right.position(215,21);
  right.mousePressed(shiftright);
  up = createImg('composeRes/_up.png');
  up.position(459,35);
  up.mousePressed(transposeUp);
  down = createImg('composeRes/_down.png');
  down.position(502,35);
  down.mousePressed(transposeDown);
  opensettings = createImg('composeRes/_opensettings.png');
  opensettings.position(580,42);
  opensettings.mousePressed(toggleSettings);
  smok = createImg('composeRes/_apply.png');
  smok.mousePressed(_smok);
  smcancel = createImg('composeRes/_cancel.png');
  smcancel.mousePressed(_smcancel);
  bars = createInput();
  pickups = createInput();
  bars.size(39,29);
  pickups.size(39,29);
  barsM = createImg('composeRes/_minus.png');
  barsM.mousePressed(_pickupsM);
  barsP = createImg('composeRes/_plus.png');
  barsP.mousePressed(_pickupsP);
  bars.value(4);
  pickupsM = createImg('composeRes/_minus.png');
  pickupsM.mousePressed(_barsM);
  pickupsP = createImg('composeRes/_plus.png');
  pickupsP.mousePressed(_barsP);
  pickups.value(4);
  nameinput.value("new song");
  clear = createImg('composeRes/_clear.png');
  clear.position(746,42);
  clear.mousePressed(deleteAllNotes);

  faketimesig = Object.assign({}, timesig);

  code = createImg('composeRes/_entercode.png');
  code.position(580, 8);
  code.mousePressed(toggleCode);
  home = createImg('composeRes/_home.png');
  home.position(windowWidth-67,14);
  home.parent('homeparent');

  ok = createImg('composeRes/_ok.png');
  ok.mousePressed(okCode);
  cancel = createImg('composeRes/_cancel.png');
  cancel.mousePressed(cancelCode);
  getcode = createImg('composeRes/_getcode.png');
  getcode.parent('getcodeparent');
  entercode = createInput();
  entercode.attribute('type','password');
  prompt = loadImage('composeRes/removelimit.png');
  hideSettings();
  hideCode();
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

  background('#FFF3c5');
  noStroke();
  fill('#185162');
  rect(0,0,windowWidth,81);
  rect(0,height-15,windowWidth,15);
  image(panel,272,10);

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
  if(mousenote != -1 && mode == 0){
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
  else if(mode == 2) showCodeMenu();
  if(showprompt) image(prompt,745+Math.sin(millis()/200)*6,5);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  home.position(windowWidth-67,14);
}

function mousePressed(){
  if(mode == 0){
  if(mouseY > 100 && mouseY < windowHeight-15){//roll
    if(playback) _play();
    let ok = true;
      for(let i = 0; i < notedata.length; i++){
        let foo = notedata[i];
        if(foo.p == mousenote && foo.bar == mousebar && foo.beat == mousebeat){
          notedata.splice(i,1);
          ok = false;
        }
      }
      if(ok){
        if(mousebar < 8 || permited){
          notedata.push({p:mousenote,bar:mousebar,beat:mousebeat});
          if(notesounds[mousenote]) notesounds[mousenote].play();
          notesplayed = 0;
        }else{
          showprompt = true;
        }
      }
    }
  }
  if(cancelmenu){cancelmenu = false; mode = 0}
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
  let xport = [];
  let index = 8;
  let expfile = '';
  xport[0] = timesig.pickup;
  xport[1] = timesig.top;
  xport[2] = timesig.tempo;
  xport[3] = timesig.name;
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
  save(xport,timesig.name.replace(/ /g, "_")+'.txt');
}
function BigU(file) {
  let arr = file.data.split('\n');
  timesig.pickup = Number(arr[0]);
  timesig.top = Number(arr[1]);
  timesig.tempo = Number(arr[2]);
  timesig.name = arr[3];
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
      play.attribute('src', 'composeRes/_play.png');
    }
    else{
      playback = true;
      playbackbar = backbar.value()-1;
      playbackbeat = 0;
      play.attribute('src', 'composeRes/_stop.png');
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
function hideSettings(){
  bars.hide();
  pickups.hide();
  smok.hide();
  smcancel.hide();
  nameinput.hide();
  barsM.hide();
  barsP.hide();
  pickupsM.hide();
  pickupsP.hide();
}
//song menu OK/apply and cancel
function _smok(){
  timesig.name = nameinput.value();
  timesig.top = Number(pickups.value());
  timesig.pickup = Number(bars.value());
  hideSettings();
  cancelmenu = true;
}
function _smcancel(){
  faketimesig = Object.assign({}, timesig);
  hideSettings();
  cancelmenu = true;
}

function drawSettings(){
  barsM.show();
  barsP.show();
  pickupsM.show();
  pickupsP.show();
  smok.show();
  smcancel.show();
  bars.show();
  pickups.show();
  image(settingsimg, windowWidth/2-130, 130);
  smok.position(windowWidth/2-112,323);
  smcancel.position(windowWidth/2+40,323);
  nameinput.show();
  nameinput.position(windowWidth/2-100,279);
  bars.position(windowWidth/2-22,221);
  pickups.position(windowWidth/2-22,161);
  barsM.position(windowWidth/2-37,167);  barsP.position(windowWidth/2+17,169);
  pickupsM.position(windowWidth/2-37,228);  pickupsP.position(windowWidth/2+17,228);
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
function gohome(){
  //return to home page
}
function deleteAllNotes(){
  if(mode == 0){
    notedata = [];
    cm = 1;
  }
}
function toggleCode(){
  if(mode == 0) mode = 2;
}
function cancelCode(){
  cancelmenu = true;
  hideCode();
}
function okCode(){
  cancelmenu = true;
  if(entercode.value() == 'sudoadmin') permited = true;
  hideCode();
}
function showCodeMenu(){
  image(codepanel, windowWidth/2-155, 130);
  cancel.show();
  ok.show();
  getcode.show();
  entercode.show();
  entercode.position(windowWidth/2-68,177);
  entercode.size(131,28);
  ok.position(windowWidth/2-127,215);
  getcode.position(windowWidth/2-45,215);
  cancel.position(windowWidth/2+58,215);
  showprompt = false;
}
function hideCode(){
  cancel.hide();
  ok.hide();
  getcode.hide();
  entercode.hide();
}
window.addEventListener("beforeunload", function (e) {
    var confirmationMessage = 'If you leave before saving, your composition will be lost';

    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
});
