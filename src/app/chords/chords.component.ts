import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { MetronomeWebWorker } from './metronomeWebWorker.service';

import { IMultiSelectOption } from 'angular-2-dropdown-multiselect';
import { IMultiSelectSettings } from 'angular-2-dropdown-multiselect';

import { ChordCalculatorService } from './chordCalculator.service';
import { WindowRefService } from './windowRefService.service';

var noSleep = new NoSleep();
function enableNoSleep() {
  noSleep.enable();
  document.removeEventListener('click', enableNoSleep, false);
}

interface MetronomeLightObject {
  active: boolean;
}
interface NoteObject {
  time: number;
  note: number;
}
interface Chord {
  halfStepsFromRoot: number,
  quality: string,
  name: {
    romanNumeral: string
  }
}

/* This version of typescript doesn't recognize these components on the Window, so stub
 * them in for now so that it compiles. */
declare global {
  interface Window {
    webkitAudioContext: any,
    AudioContext: any
  }
  interface HTMLElement {
    animate: any
  }
}

@Component({
  selector: 'app-chords',
  templateUrl: './chords.component.html',
  styleUrls: ['./chords.component.css'],
  providers: [MetronomeWebWorker]
})
export class ChordsComponent implements OnInit {
  private _window: Window;

  chordOptionsModel: number[];
  selectedChords: IMultiSelectOption[];

  qualityOptionsModel: string[];
  selectedQuality: IMultiSelectOption[];

  chordPatternsModel: string[];
  userChordPatterns: string[];
  selectedChordPattern: IMultiSelectOption[];

  beatOptionsModel: number[];
  selectedBeat: IMultiSelectOption[];

  measureIntervalOptionsModel: number[];
  selectedMeasureInterval: IMultiSelectOption[];

  // Settings configuration
  multiAnswerSettings: IMultiSelectSettings = {
    displayAllSelectedText: true,
    showCheckAll: true,
    showUncheckAll: true,
    dynamicTitleMaxItems: 8
  };

  multiAnswerSettingsLongNames: IMultiSelectSettings = {
    displayAllSelectedText: true,
    showCheckAll: true,
    showUncheckAll: true,
    dynamicTitleMaxItems: 1
  };

  singleAnswerSettings: IMultiSelectSettings = {
    selectionLimit: 1,
    autoUnselect: true,
    closeOnSelect: true
  };

  selectedBeatDict = {
    0: '16th notes',
    1: '8th notes',
    2: 'Quarter notes',
    3: 'Half notes',
    4: 'Whole notes'
  };

  selectedMeasureIntervalDict = {
    1: '1',
    2: '2',
    3: '4',
    4: '8'
  };

  setLocalStorageOption(key: string): void {
    localStorage.setItem(key, JSON.stringify(this[key]));
  };

  getLocalStorageOption(key: string, defaultItem : any): any {
    let localStorageVal = JSON.parse(localStorage.getItem(key));
    return (typeof localStorageVal !== "undefined" && localStorageVal !== null) ? localStorageVal : defaultItem;
  };

  ngOnInit() {
    this.chordOptionsModel = this.getLocalStorageOption('chordOptionsModel', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    this.qualityOptionsModel = this.getLocalStorageOption('qualityOptionsModel', ['dim7', 'mi7', 'mi7b5', 'ma7', '7']);
    this.chordPatternsModel = this.getLocalStorageOption('chordPatternsModel', ['singleChord', 'major25', 'minor25', 'major251', 'minor251']);
    this.userChordPatterns = []; // TODO add local storage

    this.selectedChords = [
      {id: 0, name: this.chordCalculator.noteInfo[0].menuName},
      {id: 1, name: this.chordCalculator.noteInfo[1].menuName},
      {id: 2, name: this.chordCalculator.noteInfo[2].menuName},
      {id: 3, name: this.chordCalculator.noteInfo[3].menuName},
      {id: 4, name: this.chordCalculator.noteInfo[4].menuName},
      {id: 5, name: this.chordCalculator.noteInfo[5].menuName},
      {id: 6, name: this.chordCalculator.noteInfo[6].menuName},
      {id: 7, name: this.chordCalculator.noteInfo[7].menuName},
      {id: 8, name: this.chordCalculator.noteInfo[8].menuName},
      {id: 9, name: this.chordCalculator.noteInfo[9].menuName},
      {id: 10, name: this.chordCalculator.noteInfo[10].menuName},
      {id: 11, name: this.chordCalculator.noteInfo[11].menuName}
    ];

    this.selectedQuality = [
      {id: 'dim7', name: this.chordCalculator.chordQuality['dim7'].name},
      {id: 'mi7', name: this.chordCalculator.chordQuality['mi7'].name},
      {id: 'mi7b5', name: this.chordCalculator.chordQuality['mi7b5'].name},
      {id: 'ma7', name: this.chordCalculator.chordQuality['ma7'].name},
      {id: '7', name: this.chordCalculator.chordQuality['7'].name}
    ];

    this.selectedChordPattern = [
      {id: 'singleChord', name: this.chordCalculator.chordPattern['singleChord'].name},
      {id: 'major25', name: this.chordCalculator.chordPattern['major25'].name},
      {id: 'minor25', name: this.chordCalculator.chordPattern['minor25'].name},
      {id: 'major251', name: this.chordCalculator.chordPattern['major251'].name},
      {id: 'minor251', name: this.chordCalculator.chordPattern['minor251'].name},
      {id: 'diatonic1625', name: this.chordCalculator.chordPattern['diatonic1625'].name},
      {id: 'nondiatonic1625_1', name: this.chordCalculator.chordPattern['nondiatonic1625_1'].name},
      {id: 'nondiatonic1625_2', name: this.chordCalculator.chordPattern['nondiatonic1625_2'].name},
      {id: 'chordcycle_1', name: this.chordCalculator.chordPattern['chordcycle_1'].name},
      {id: 'chordcycle_2', name: this.chordCalculator.chordPattern['chordcycle_2'].name}
    ];

    this.selectedBeat = [
      {id: 0, name: this.selectedBeatDict[0]},
      {id: 1, name: this.selectedBeatDict[1]},
      {id: 2, name: this.selectedBeatDict[2]},
      {id: 3, name: this.selectedBeatDict[3]},
      {id: 4, name: this.selectedBeatDict[4]}
    ];

    this.selectedMeasureInterval = [
      {id: 1, name: this.selectedMeasureIntervalDict[1]},
      {id: 2, name: this.selectedMeasureIntervalDict[2]},
      {id: 3, name: this.selectedMeasureIntervalDict[3]},
      {id: 4, name: this.selectedMeasureIntervalDict[4]}
    ];
  }

  chordOptionsModelChanged(event: any) {
    this.setLocalStorageOption('chordOptionsModel');
    console.log(this.chordOptionsModel);
  }

  qualityOptionsModelChanged(event: any) {
    this.setLocalStorageOption('qualityOptionsModel');
    console.log(this.qualityOptionsModel);
  }

  chordPatternsModelChanged(event: any) {
    this.setLocalStorageOption('chordPatternsModel');
    console.log(this.chordPatternsModel);
  }

  chordPreviewCountChanged(event: any) {
    this.setLocalStorageOption('chordPreviewCount');
    console.log(this.chordPreviewCount);
  }

  tempoChanged(event: any) {
    this.setLocalStorageOption('tempo');
    console.log(this.tempo);
  }

  beatOptionsModelChanged(event: any) {
    this.setLocalStorageOption('beatOptionsModel');
    this.noteResolution = Number(this.beatOptionsModel[0]);
    console.log(this.beatOptionsModel);
  }

  measureIntervalOptionsModelChanged(event: any) {
    this.setLocalStorageOption('measureIntervalOptionsModel');
    this.measureInterval = Number(this.selectedMeasureIntervalDict[this.measureIntervalOptionsModel[0]]);
    console.log(this.measureIntervalOptionsModel);
  }

  showMetronomeChanged(event: any) {
    this.setLocalStorageOption('showMetronome');
    console.log(this.showMetronome);
  }

  regenerateChordsOnLoopChanged(event: any) {
    this.setLocalStorageOption('regenerateChordsOnLoop');
    console.log(this.regenerateChordsOnLoop);
  }

  scrollToActiveRowChanged(event: any) {
    this.setLocalStorageOption('scrollToActiveRow');
    console.log(this.scrollToActiveRow);
  }

  // --------------------------------------------
  startStopMessage: string;
  chordQueue: Array<Object>;
  notesInQueue: NoteObject[];//Array<Object>;

  // --------------------------------------------
  activeCustomPattern: Array<Chord>;
  customPatternChordsOptions: Array<Object>;

  // --------------------------------------------
  isPlaying: boolean;
  currentBeat: number;
  audioContext;
  nextNoteTime: number;
  tempo: number;
  chordPreviewCount: number;
  lookahead: number;
  /* How far ahead to schedule audio (sec). This is calculated from lookahead, and overlaps
   * with next interval (in case the timer is late) */
  scheduleAheadTime: number;
  noteResolution: number;
  noteLength: number;
  last16thNoteDrawn: number;
  current16thNote: number;
  timerWorker; // The Web Worker used to fire timer messages
  chordCalculator;

  measureInterval: number;
  measureIntervalCounter: number;
  latestChordKey: string;

  currentChordIndex: number;
  showInfoAlert: boolean;
  metronomeLights: MetronomeLightObject[];
  showMetronome: boolean;

  regenerateChordsOnLoop: boolean;
  scrollToActiveRow: boolean;

  constructor(public fb: FormBuilder, private _metronomeWebWorker: MetronomeWebWorker, windowRef: WindowRefService, private _chordCalculator: ChordCalculatorService) {

    this._window = windowRef.nativeWindow;

    this._window.onkeydown = function (e) {
      if (e.keyCode === 32) {
        e.preventDefault();
        let element: HTMLElement = document.getElementById('startstop-button') as HTMLElement;
        element.click();
      }
    };

    //document.getElementById("startstop-button").addEventListener('click', enableNoSleep, false);
    document.addEventListener('click', enableNoSleep, false);
    //debugger;

    let AudioContext = this._window.AudioContext || this._window.webkitAudioContext;
    if (!AudioContext) {
      alert("Sorry, but the Web Audio API is not supported by your browser. Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox");
      return;
    }
    this.audioContext = new AudioContext();

    // User options
    this.tempo = this.getLocalStorageOption('tempo', 120);          // tempo (in beats per minute)
    this.chordPreviewCount = this.getLocalStorageOption('chordPreviewCount', 40);
    this.beatOptionsModel = this.getLocalStorageOption('beatOptionsModel', [2]);
    this.measureIntervalOptionsModel = this.getLocalStorageOption('measureIntervalOptionsModel', [1]);
    this.showMetronome = this.getLocalStorageOption('showMetronome', false);
    this.regenerateChordsOnLoop = this.getLocalStorageOption('regenerateChordsOnLoop', true);
    this.scrollToActiveRow = this.getLocalStorageOption('scrollToActiveRow', false);

    // Constants
    this.currentBeat = 0;        // What note is currently last scheduled?
    this.lookahead = 25.0;       // How frequently to call scheduling function (in milliseconds)
    this.startStopMessage = "Play";
    this.scheduleAheadTime = 0.1;
    this.nextNoteTime = 0.0;     // when the next note is due.
    this.noteResolution = Number(this.beatOptionsModel[0]); // 0 == 16th, 1 == 8th, 2 == quarter note
    this.measureInterval = Number(this.selectedMeasureIntervalDict[this.measureIntervalOptionsModel[0]]);
    this.measureIntervalCounter = 0;
    this.noteLength = 0.05;      // length of "beep" (in seconds)
    this.current16thNote = 0;
    this.last16thNoteDrawn = -1; // the last "box" we drew on the screen

    this.timerWorker = _metronomeWebWorker;
    this.chordCalculator = _chordCalculator;

    this.initializeMetronomeLights();

    this.chordQueue = [];
    this.activeCustomPattern = [];
    // this.customPatternChordsOptions = [{name:"A"}, {name:"Bb"}, {name:"B"}, {name:"C"}, {name:"Db"}, {name:"D"}, {name:"Eb"}, {name:"E"}, {name:"F"}, {name:"Gb"}, {name:"G"}, {name:"Ab"}];
    this.customPatternChordsOptions = this.chordCalculator.getScalePattern("major");
    this.notesInQueue = [];      // the notes that have been put into the web audio and may or may not have played yet. {note, time}

    this.currentChordIndex = 0;
    this.showInfoAlert = true;

    let self = this;
    this.timerWorker.setOnMessageCallback(function (message) {
      if (message === "tick") {
        self.scheduler();
      }
      else {
        console.error("Unexpected message: " + message);
      }
    });

    this.timerWorker.postMessage({"interval": this.lookahead});

    // Stop metronome when leaving this page
    // Is there a better way to do this?...
    window.onbeforeunload = function(e) {
      console.log("unloading");
      self.isPlaying = false;
      self.timerWorker.postMessage("stop");
      noSleep.disable();
      return null;
    };
  }

  // this could be better
  initializeMetronomeLights(): void {
    this.metronomeLights = [{active: true}, {active: false}, {active: false}, {active: false}];
  }

  getRandomPattern(): string {
    let totalLength = this.chordPatternsModel.length + this.userChordPatterns.length;
    let randomNumber = Math.floor((Math.random() * totalLength - 1) + 1);

    if (randomNumber < this.chordPatternsModel.length) {
      return this.chordPatternsModel[randomNumber];
    } else {
      return this.userChordPatterns[randomNumber - this.chordPatternsModel.length]
    }
  }

  /**
   * 1. Get random pattern from available selection
   * 2. If Single Chord, get random quality from available selection
   * 3. If the result isn't the same as the last random chord, try again
   * 4. Get the Chords from the chord calculator and add to the queue
   * 5. Update the latest random chord
   * @returns {string}
   */
  addRandomChordsFromSelections(): void {
    let retryMax = 1;
    let retryCount = 0;
    let newChordKey = this.latestChordKey;
    let patternKey;
    let rootKey;
    let qualityKey;

    if (!this.chordOptionsModel || !this.qualityOptionsModel || !this.chordPatternsModel) {
      console.log("Requested random chord before options were set");
      return;
    }

    if (this.chordQueue.length >= this.chordPreviewCount) {
      return;
    }

    // loop until we find a different random chord than th latest or our retries exceed max retries
    while (newChordKey === this.latestChordKey && retryCount < retryMax) {
      patternKey = this.getRandomPattern();
      rootKey = this.chordOptionsModel[Math.floor((Math.random() * this.chordOptionsModel.length - 1) + 1)];
      qualityKey = "";
      if (patternKey === 'singleChord') {
        qualityKey = this.qualityOptionsModel[Math.floor((Math.random() * this.qualityOptionsModel.length - 1) + 1)];
      }
      newChordKey = rootKey + qualityKey + patternKey;
      retryCount++;
    }

    this.chordCalculator.appendChords(this.chordQueue, patternKey, rootKey, qualityKey);
    this.latestChordKey = newChordKey;
  }

  clearChordQueue() {
    this.currentChordIndex = 0;
    this.chordQueue = [];
  }

  populateChordQueue() {
    this.addRandomChordsFromSelections();
    while(this.chordQueue.length < this.chordPreviewCount) {
      this.addRandomChordsFromSelections();
    }
  }

  playpause(): void {
    this.showInfoAlert = false;

    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) { // Start
      noSleep.enable();
      this.populateChordQueue();
      let self = this;
      setTimeout(function() {self.scrollToCurrentChord();},1); // let digest cycle populate the DOM
      requestAnimationFrame(this.draw.bind(this));
      this.currentBeat = 0;
      this.nextNoteTime = this.audioContext.currentTime;
      this.startStopMessage = "Pause";
      this.timerWorker.postMessage("start");
    } else { // Stop
      noSleep.disable();
      this.startStopMessage = "Play";
      this.timerWorker.postMessage("stop");
      this.scrollToTop();
    }
  }

  // --------------------------------------------
  removeCustomPattern(customPatternKey: string): void {
    console.log("Removing: " + JSON.stringify(customPatternKey));
    for (let pattern of this.userChordPatterns) {
      let counter = 0;
      if (pattern === customPatternKey) {
        this.userChordPatterns.splice(counter, 1);
        break;
      }
      counter++;
    }
    this.chordCalculator.removeUserChordPattern(customPatternKey)
  }

  getCustomPatternName(key: string): string {
    return this.chordCalculator.userChordPattern[key] ? this.chordCalculator.userChordPattern[key].name : "";
  }

  getUserPatternName(): string {
    let name = "";
    for (let chord of this.activeCustomPattern) {
      name = name + " " + chord.name.romanNumeral;
    }
    return name;
  }

  addActiveCustomPattern(): void {
    let userPatternName = this.getUserPatternName();
    let userPatternKey = "UP_" + Math.floor((Math.random() * 100) + 1);
    let userPattern = {
      id: userPatternKey,
      name: userPatternName,
      source: "user",
      scaleQuality: "major",
      pattern: this.activeCustomPattern
    }

    this.chordCalculator.addUserChordPattern(userPatternKey, userPattern);
    this.userChordPatterns.push(userPatternKey);

    this.activeCustomPattern = [];
  }

  addChordToActiveCustomPattern(chordVal: Chord): void {
    console.log("adding: " + JSON.stringify(chordVal));
    this.activeCustomPattern.push(chordVal);
  }

  removeChordFromActiveCustomPattern(chordVal: String): void {
    console.log("removing: " + JSON.stringify(chordVal))
  }

  // --------------------------------------------
  scramble(): void {
    this.clearChordQueue();
    this.populateChordQueue();
  }

  /**
   * Advance current note and time by a 16th note...
   */
  nextNote(): void {
    var secondsPerBeat = 60.0 / this.tempo;    // Notice this picks up the CURRENT tempo value to calculate beat length.
    this.nextNoteTime += 0.25 * secondsPerBeat;    // Add beat length to last beat time

    this.current16thNote++;    // Advance the beat number, wrap to zero
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
    }
  }

  scrollToCurrentChord(): void {
    // https://stackoverflow.com/questions/6942785/window-innerwidth-vs-document-documentelement-clientwidth
    function getBottomPosition() {
      // or $(window).height()?
      return window.innerHeight && document.documentElement.clientHeight ?
        Math.min(window.innerHeight, document.documentElement.clientHeight) : window.innerHeight || document.documentElement.clientHeight;
    }

    function getYValToScrollTo (el, activeAlwaysAtTop) {
      var rect = el.getBoundingClientRect();

      //top nav is 53px and footer is 50px
      if (activeAlwaysAtTop || !(rect.top >= 53 && rect.bottom <= getBottomPosition() - 50)){
        return el.offsetTop - 60;
      } else {
        // in view
        return null;
      }
    }

    let currentElement = document.getElementById("chord-" + this.currentChordIndex);
    if (currentElement) { // if the page is unloading, this can be null
      let yValToScrollTo = getYValToScrollTo(currentElement, this.scrollToActiveRow);
      if (yValToScrollTo != null) { // if not already in view
        // chrome mobile seems to need timeout and doesn't support behavior:smooth
        setTimeout(function() {window.scrollTo(0, yValToScrollTo);},10);
      }
    } else {
      console.log("currentElement not found for: " + "chord-" + this.currentChordIndex);
    }
  }

  scrollToTop(): void {
    window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  }

  /**
   * push the note on the queue, even if we're not playing.
   */
  scheduleNote(beatNumber: number, time: number): void {
    this.notesInQueue.push({note: beatNumber, time: time});

    if (beatNumber % 4 === 0) {
      // add next metronome light, regardless of what the note resolution is
      this.metronomeLights[beatNumber / 4].active = true;
    }

    if ((this.noteResolution === 1) && (beatNumber % 2))
      return; // we're not playing non-8th 16th notes
    if ((this.noteResolution === 2) && (beatNumber % 4))
      return; // we're not playing non-quarter 8th notes
    if ((this.noteResolution === 3) && (beatNumber % 8))
      return; // we're not playing non-half notes
    if ((this.noteResolution === 4) && (beatNumber % 16))
      return; // we're not playing non-whole notes

    // create an oscillator
    var osc = this.audioContext.createOscillator();
    osc.connect(this.audioContext.destination);
    if (beatNumber % 16 === 0) {
      // beat 0 == high pitch
      osc.frequency.value = 880.0;
      osc.frequency.duration = 1.0;

      // just set the first metronome light
      this.initializeMetronomeLights();

      if (this.measureIntervalCounter >= this.measureInterval) {
        //this.chordQueue.shift(); // Toss the first chord
        if (this.currentChordIndex === (this.chordQueue.length-1)) {
          // we've ran out of chords...
          if (this.regenerateChordsOnLoop) {
            this.scramble();
          } else {
            this.currentChordIndex = 0;
          }
          let self = this;
          setTimeout(function() {self.scrollToCurrentChord();},1); // let digest cycle populate the DOM
        } else {
          this.currentChordIndex++;
          this.scrollToCurrentChord();
        }

        this.addRandomChordsFromSelections();
        this.measureIntervalCounter = 0;
      }
      this.measureIntervalCounter += 1;
    } else if (beatNumber % 4 === 0) {
      // quarter notes = medium pitch
      osc.frequency.value = 440.0;
      osc.frequency.duration = .2;
    } else {
      // other 16th notes = low pitch
      osc.frequency.value = 220.0;
      osc.frequency.duration = .2;
    }

    osc.start(time);
    osc.stop(time + this.noteLength);
  }

  /**
   * while there are notes that will need to play before the next interval,
   * schedule them and advance the pointer.
   */
  scheduler(): void {
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime); // add note to queue
      this.nextNote(); // advance to the next note
    }
  }

  /**
   *  Using requestAnimationFrame recursively should allow us to reduce jitter by doing UI changes once the graphics is ready
   *  https://medium.com/@heatherbooker/how-to-auto-scroll-to-the-bottom-of-a-div-415e967e7a24
   */
  draw(): void {
    if (!this.isPlaying) {
      return; // stop
    }

    var currentNote = this.last16thNoteDrawn;
    var currentTime = this.audioContext.currentTime;

    while (this.notesInQueue.length && this.notesInQueue[0].time < currentTime) {
      currentNote = this.notesInQueue[0].note;
      this.notesInQueue.splice(0, 1);   // remove note from queue
    }

    // We only need to draw if the note has moved.
    if (this.last16thNoteDrawn !== currentNote) {
      this.last16thNoteDrawn = currentNote;
    }

    // TODO: use ES6 optimization: https://stackoverflow.com/questions/6065169/requestanimationframe-with-this-keyword
    requestAnimationFrame(this.draw.bind(this));
  }
}


