VF = Vex.Flow;

var WorkspaceInformation = {
    // The <canvas> element in which you're going to work
    canvas: document.getElementById("canvas1"),
    // Vex creates a canvas with specific dimensions
    canvasWidth: 1275,
    canvasHeight: 1650
};

// Create a renderer with Canvas
var renderer = new VF.Renderer(
    WorkspaceInformation.canvas,
    VF.Renderer.Backends.CANVAS
);
const nv = ['G5', 'F#5', 'F5', 'E5', 'D#5', 'D5', 'C#5', 'C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4', 'B3', 'A#3', 'A3', 'G#3', 'G3'];

function windowLoaded() {
    if(new URLSearchParams(window.location.search).get('s')){
      if(new URLSearchParams(window.location.search).get('name')) document.getElementById('songname').value = new URLSearchParams(window.location.search).get('name');
      generateFromSongString(new URLSearchParams(window.location.search).get('s').replace(/i/g,','));
    }
}
window.onload = windowLoaded;

var barWidth = 300;
var barSpacing = 125;
let beatsPerBar = 4;
let documentWidth = 1275
  , documentHeight = 1650;
var numberOfMeasures = 10;
var bardata = {};

var measureCount = 0;
var lastMeasureWidth = 0;
var lastMeasureHeight = 0;
var pickupBeats = 0;
var notedata = []
  , timesig = {};
var accidentalStatus = {};
var highlightNote = {};
var masterSongString;
var highlightsBeenGenerated = false;

var context = renderer.getContext();
var showOnlyHighlighted = false,
colorHighlighted = true;
function Sohn(e){
  showOnlyHighlighted = e.checked;
  redraw();
}
function Chn(e){
  colorHighlighted = e.checked;
  redraw();
}

// Create a stave at position 10, 40 of width 200 on the canvas.
function addMeasure(bar) {
    accidentalStatus = {};
    if (numberOfMeasures < 1)
        return;
    var stave = new VF.Stave(10 + lastMeasureWidth,40 + lastMeasureHeight,barWidth);

    if (lastMeasureWidth < barWidth) {
        stave.addClef("treble");
    }
    if(measureCount == 0) stave.addTimeSignature(beatsPerBar + "/4");
    if (measureCount == numberOfMeasures - 1) {
        stave.setEndBarType(Vex.Flow.Barline.type.END);
    }

    stave.setContext(context).draw();

    var notes = createNotes(bar);

    var voice = new VF.Voice({
        num_beats: bardata[bar].length / 2,
        beat_value: 4
    });
    voice.addTickables(notes);

    if (lastMeasureWidth < barWidth) {
        new VF.Formatter().joinVoices([voice]).format([voice], barWidth - 60);
    } else {
        new VF.Formatter().joinVoices([voice]).format([voice], barWidth-20);
    }
    var beams = VF.Beam.generateBeams(notes, {
      groups: [new Vex.Flow.Fraction(2, 8)]
    });
    voice.draw(context, stave);
    beams.forEach(function(b) {b.setContext(context).draw()});


    lastMeasureWidth += barWidth;
    if (lastMeasureWidth + barWidth >= documentWidth) {
        lastMeasureWidth = 20;
        lastMeasureHeight += barSpacing;
    }
    measureCount++;
}

function writeChord(pitches, duration, rest) {
    pitches.sort(function(a, b) {
        return b - a
    });
    let durs = {
        0.5: '8',
        1: 'q',
        1.5: 'qd',
        2: 'h',
        3: 'hd',
        4: 'w',
        6: 'wd'
    };
    let nn = [];
    for (let i = 0; i < pitches.length; i++){
        let rawNote = nv[pitches[i]][0] + '/' + nv[pitches[i]][nv[pitches[i]].length - 1];
        let realNoteIsSharp = nv[i].includes('#');
        nn.push(rawNote);
    }
    let note = new VF.StaveNote({
        clef: "treble",
        keys: nn,
        duration: durs[duration] + (rest ? 'r' : '')
    });
    for (let i = 0; i < pitches.length; i++) {
        if (nv[pitches[i]].includes('#') && !accidentalStatus[pitches[i]]){
          note.addAccidental(i, new VF.Accidental("#"));
          accidentalStatus[pitches[i]] = true;
        }
        if (!nv[pitches[i]].includes('#') && accidentalStatus[pitches[i]-1]){
          note.addAccidental(i, new VF.Accidental("n"));
          accidentalStatus[pitches[i]-1] = false;
        }
        if(highlightNote[pitches[i]]?.highlight && colorHighlighted) note.setKeyStyle(i,{fillStyle: highlightNote[pitches[i]].color, strokeStyle: highlightNote[pitches[i]].color})
    }
    if (durs[duration].includes('d'))
        note.addDotToAll();
    return note;
}
function setSongString(file) {

  barWidth = 300;
  beatsPerBar = 4;
  numberOfMeasures = 10;
  bardata = {};


  measureCount = 0;
  lastMeasureWidth = 20;
  lastMeasureHeight = 100;
  pickupBeats = 0;
  notedata = []
    , timesig = {};
  accidentalStatus = {};
  context = renderer.getContext();


    notedata = [];
    bardata = [];
    let arr = file.split(',');
    timesig.pickup = Number(arr[0]);
    pickupBeats = timesig.pickup;
    timesig.top = Number(arr[1]);
    beatsPerBar = timesig.top;
    timesig.tempo = Number(arr[2]);
    notedata = [];
    let index = 8;
    for (let i = 0; i < (arr.length - 9) / 3; i++) {
        let note = Number(arr[index]);
          notedata.push({
              p: note,
              bar: Number(arr[index + 1]),
              beat: Number(arr[index + 2])
          });
        index += 3;
    }

    if(!highlightsBeenGenerated) generateHighlights();

    numberOfMeasures = notedata.reduce(function(a, b) {
        return Math.max(a, b.bar);
    }, 0) + 1;

    for (let i = 0; i < numberOfMeasures; i++) {
        bardata[i] = [];
        if (i != 0) {
            for (let j = 0; j < beatsPerBar; j++) {
                bardata[i].push([]);
                bardata[i].push([]);
            }
        } else {
            for (let j = 0; j < pickupBeats; j++) {
                bardata[i].push([]);
                bardata[i].push([]);
            }
        }
    }

    for (let j = 0; j < notedata.length; j++) {
        let bar = parseInt(Number(notedata[j].bar));
        let beat = Number(notedata[j].beat);
        let note = Number(notedata[j].p);
        if(noteInHighlighted(note)) bardata[bar][parseInt(beat * 2)].push(parseInt(note));
    }

    for (let i = 0; i < numberOfMeasures; i++) {
        addMeasure(i);
    }
}
function noteInHighlighted(n){
  return showOnlyHighlighted?highlightNote[n]?.highlight:true;
}
function createNotes(bar) {
    let stack = [];

    let durbar = [];
    for (let i = 0; i < (bar==0?pickupBeats:beatsPerBar) * 2; i++) {
        if (i == 0)
            durbar.push({
                notes: bardata[bar][i],
                duration: 0.5,
                beat: i
            });
        else {
            if (bardata[bar][i].length == 0 && durbar[durbar.length - 1].beat % 2 == 0) {
                durbar[durbar.length - 1].duration += 0.5;
            } else {
                durbar.push({
                    notes: bardata[bar][i],
                    duration: 0.5,
                    beat: i
                });
            }
        }
    }

    for (let i = 0; i < durbar.length; i++) {
        let isRest = durbar[i].notes.length == 0;
        let staveNote = writeChord(durbar[i].notes.length != 0 ? durbar[i].notes : [8], durbar[i].duration, isRest);
        stack.push(staveNote);
    }
    return stack;
}
function generateFromSongString(songString){
  var canvas = document.getElementById("canvas1");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  masterSongString = songString;
  setSongString(songString);
  let songname = document.getElementById('songname').value || '';
  ctx.font = "50px Arial";
  ctx.textAlign = "center";
  ctx.fillText(songname, canvas.width/2, 80);
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  let noteF = getUsedBells();
  let bellsAndTimes = '';
  let sortedArray = [];
  let j = 0;
  Object.keys(noteF).forEach((item, i) => {
    sortedArray[j] = {note:item, count:noteF[item]};
    j++;
  });
  sortedArray.sort((a, b) => (a.count < b.count) ? 1 : -1);
  bellsAndTimes = sortedArray.map(a => a.note);
  let fmt = [];
  for(let i = 0; i < bellsAndTimes.length; i++){
    fmt.push({
      text : nv[bellsAndTimes[i]] + (i == bellsAndTimes.length-1 ? '': ', '),
      fillStyle : (highlightNote[bellsAndTimes[i]]?.highlight && colorHighlighted)?highlightNote[bellsAndTimes[i]].color:'#000'
    });
  }
  fillMixedText(ctx,fmt, 25, 130);

  ctx.font = "20px Arial";
  ctx.textAlign = "right";
  let credit = document.getElementById('credit').value || '';
  ctx.fillText(credit, canvas.width-25, 130);
}
//thank you https://mrcoles.com/multi-colored-text-canvas/
const fillMixedText = (ctx, args, x, y) => {
  let defaultFillStyle = ctx.fillStyle;
  let defaultFont = ctx.font;

  ctx.save();
  args.forEach(({ text, fillStyle, font }) => {
    ctx.fillStyle = fillStyle || defaultFillStyle;
    ctx.font = font || defaultFont;
    ctx.fillText(text, x, y);
    x += ctx.measureText(text).width;
  });
  ctx.restore();
};
function redraw(){
  // document.getElementById('').innerHTML = '';
  generateFromSongString(masterSongString);
}
function generateHighlights(){
  let noteF = getUsedBells();
  let sortedArray = [];
  let j = 0;
  Object.keys(noteF).forEach((item, i) => {
    sortedArray[j] = {note:item, count:noteF[item]};
    j++;
  });
  sortedArray.sort((a, b) => (a.count < b.count) ? 1 : -1);
  for(let i = 0; i < sortedArray.length; i++){
    addHighlight(sortedArray[i].note,sortedArray[i].count);
  }
  highlightsBeenGenerated = true;
}
function getUsedBells(){
  let noteF = {};
  for(let i = 0; i < notedata.length; i++){
    if(!noteF[notedata[i].p]) noteF[notedata[i].p] = 0;
    noteF[notedata[i].p]++;
  }
  return noteF;
}
function addHighlight(index, count){
  let h = document.createElement('div');
  h.className = 'highlight';
  h.insertAdjacentHTML('beforeend',`<p class='noteText'>${nv[index] + ' x ' + count}</p>`);

  let c = document.createElement('input');
  c.className = 'colorSelector';
  c.type = 'color';
  switch(nv[index][0]){
    case 'A':
      c.value = '#25579c';
    break;
    case 'B':
      c.value = '#761c78';
    break;
    case 'C':
      c.value = '#9c0c0c';
    break;
    case 'D':
      c.value = '#9e4009';
    break;
    case 'E':
      c.value = '#989c09';
    break;
    case 'F':
      c.value = '#17910a';
    break;
    case 'G':
      c.value = '#2d7596';
    break;
  }
  h.appendChild(c);

  h.onclick = (e) => {
    e.stopPropagation();
    if(h === e.target || e.target.className == 'noteText') {
      h.setAttribute('data-checked',h.getAttribute('data-checked') != 'true');
      if(!highlightNote[index]) highlightNote[index] = {};
      highlightNote[index].highlight = h.getAttribute('data-checked') == 'true';
      highlightNote[index].color = c.value;
      redraw();
    }
  }
  c.onchange = (e) => {
    e.stopPropagation();
    if(!highlightNote[index]) highlightNote[index] = {};
    highlightNote[index].color = c.value;
    redraw();
  }
  document.getElementById('highlights').appendChild(h);
}
function print_canvas(){
  let canvas = document.getElementById("canvas1");
  let url = canvas.toDataURL();
   var win1 = window.open();
   let style = `img {
     position:fixed;
     left:0px;
     top:0px;
     width:100%;
     }`;
  win1.document.write("<head><title>Print</title><style>"+style+"</style><script>function pr(){print();close();}</script></head>");
   win1.document.write("<img onload='pr()'src = '"+url+"'/>");
   // win1.print();
   // win1.close();
}
