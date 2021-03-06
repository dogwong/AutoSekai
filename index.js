// imports
const os = require('os')
const fs = require('fs')
const SusAnalyzer = require('sus-analyzer')
const ScorePlayer = require('./lib/score-player')
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'AutoPlay> '
});
// touch stuffs
const Touch = require('./lib/touch')
let BleTouch;
let bleTouch;
const sleep = require('util').promisify(setTimeout)

// init
if (os.platform() == "linux") {
  console.log("linux! init bluetooth");
  
  BleTouch = require('./lib/bleTouch');
  bleTouch = new BleTouch();
} else {
  console.log("not linux!");
}
let touch = new Touch(bleTouch);

// config
const FLICK_EARLY = 20; // ms earlier to preform flick
const SLIDE_UPDATE_FREQUENCY = 30; // ms touch update interval during slide

// https://pjsek.ai/assets/startapp/music/music_score

(async () => {
  // init stuffs
const player = new ScorePlayer()

  // rl.on('line', (line) => {
  //   switch (line.trim()) {
  //     case 'hello':
  //       readline.cursorTo(process.stdout, 0, 0)
  //       console.log('world!');
  //       break;
  //     case '':
  //       player.Play(playCallback)

  //       console.log(`Enter`);
  //       break;
  //     default:
  //       console.log(`Say what? I might have heard '${line.trim()}'`);
  //       break;
  //   }
  //   rl.prompt();
  // });

  process.stdin.on('keypress', async function(s, key) {
    console.log(key);
    if (key.name == "return" && !player.isPlaying) {
      player.Play(playCallback)
      console.log("Play!")
    } else if (key.sequence == "'" && !player.isPlaying) {
      player.PlayAtFirstNote(playCallback)
      console.log("PlayAtFirstNote!")
    } else if (key.name == "down") {
      player.Shift(-5)
      console.log(`shift -5  => ${player.timeshift}`);
    } else if (key.name == "up") {
      player.Shift(5)
      console.log(`shift +5  => ${player.timeshift}`);
    } else if (key.name == "s" && player.isPlaying) {
      player.Stop(playCallback)
      console.log("Stop!")
    } else if (key.sequence == "[") {
      // 2000, 980
      let touch = {
        x: Math.round((1080 - 980) / 1080 * 10000),
        y: Math.round(2000 / 2340 * 10000),
        t: 50
      }
      let i = 0
      function loopTouch () {
        sendTouch([touch])
        i += 1
        if (i < 26)
          setTimeout(loopTouch, 100)
      }
      loopTouch()
    } else if (key.sequence == "]") {
      let touch = {
        x: Math.round((1080 - 1000) / 1080 * 10000),
        y: Math.round(1650 / 2340 * 10000),
        t: 50
      }
      sendTouch([touch])
    } else if (key.sequence == "t") {
      sendTouch([{
        x: Math.round((1080 - 850) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 2000
      }])
      sendTouch([{
        x: Math.round((1080 - 850) / 1080 * 10000),
        y: Math.round(1340 / 2340 * 10000),
        t: 2000
      }])
    } else if (key.sequence == "y") {
      sendTouch([{
        x: Math.round((1080 - 850) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 200
      }, {
        x: Math.round((1080 - 830) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 200
      }, {
        x: Math.round((1080 - 810) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 200
      }, {
        x: Math.round((1080 - 790) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 200
      }, {
        x: Math.round((1080 - 770) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 200
      }, {
        x: Math.round((1080 - 750) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 200
      }, {
        x: Math.round((1080 - 730) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 200
      }, {
        x: Math.round((1080 - 710) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 200
      }])
      await sleep(100)
      sendTouch([{
        x: Math.round((1080 - 850) / 1080 * 10000),
        y: Math.round(1340 / 2340 * 10000),
        t: 2000
      }])
    } else if (key.sequence == "p") {
      console.log("Start Song!");
      clickTillNextSong();
    } else if (key.sequence == "o") {
      console.log("Start Song! (Loop)");
      clickTillNextSong(true);
    }
  });

  async function clickTillNextSong (loop = false) {
    sendTouch([{
      t: 50,
      x: Math.round((1080 - 1000) / 1080 * 10000),
      y: Math.round(2000 / 2340 * 10000),
    }]) // click start
    console.log("Click Start!");
    await sleep(8000);
    // for (let i = 0; i < 60; i++) {
    //   sendTouch([{
    //     t: 30,
    //     x: Math.round((100 - 1000) / 1080 * 10000),
    //     y: Math.round(2250 / 2340 * 10000),
    //   }]) // click pause
    //   await sleep(50)
    // }
    let i = 0;
    console.log("Loop click pause!");
    async function loopTouch () {
      sendTouch([{
        t: 1,
        x: Math.round((1080 - 100) / 1080 * 10000),
        y: Math.round(2250 / 2340 * 10000),
      }]);
      i += 1;
      if (i < 200)
        setTimeout(loopTouch, 20);
      else {
        await sleep(100);
        console.log("Click resume!");
        sendTouch([{
          t: 50,
          x: Math.round((1080 - 680) / 1080 * 10000),
          y: Math.round(1550 / 2340 * 10000),
        }]); // click resume
        await sleep(6025); // get from screen record
        player.Play(playCallback).then(async () => {
          if (loop) {
            console.log("Loop! wait end screen");
            await sleep(10000)
            
            // click end screen next
            // 2000, 980
            let touch = {
              x: Math.round((1080 - 980) / 1080 * 10000),
              y: Math.round(2000 / 2340 * 10000),
              t: 50
            }
            // let i = 0
            // function loopTouch () {
            //   sendTouch([touch])
            //   i += 1
            //   if (i < 26)
            //     setTimeout(loopTouch, 100)
            // }
            // loopTouch()
            for (let i = 0; i < 28; i++) {
              sendTouch([touch])
              await sleep(100)
            }
            // await sleep(2600)
            // ------------- click song selection screen
            await sleep(1000)
            sendTouch([{
              x: Math.round((1080 - 1000) / 1080 * 10000),
              y: Math.round(1650 / 2340 * 10000),
              t: 50
            }])
            await sleep(500)
            // click select song
            sendTouch([{
              x: Math.round((1080 - 980) / 1080 * 10000),
              y: Math.round(2000 / 2340 * 10000),
              t: 50
            }])
            await sleep(500)
            // loop
            clickTillNextSong(true);
          }
        });
        console.log("Play!");
      }
    }
    loopTouch();
  }


  if (os.platform() == "linux") {
    console.log("init bluetooth");
    await bleTouch.init();
  }

  // "fillerSec": 9
  // const sus = fs.readFileSync('music_score/0047_normal.sus', 'utf8') // メルト
  // const sus = fs.readFileSync('music_score/0047_hard.sus', 'utf8') // メルト
  // const sus = fs.readFileSync('music_score/0047_expert.sus', 'utf8') // メルト
  // const sus = fs.readFileSync('music_score/0047_01/expert.sus', 'utf8') // メルト
  const sus = fs.readFileSync('music_score/0047_01/master.sus', 'utf8') // メルト

  // "fillerSec": 9
  // const sus = fs.readFileSync('music_score/0074_easy.sus', 'utf8') // 独りんぼエンヴィー
  // const sus = fs.readFileSync('music_score/0074_normal.sus', 'utf8')
  // const sus = fs.readFileSync('music_score/0074_hard.sus', 'utf8')
  // const sus = fs.readFileSync('music_score/0074_expert.sus', 'utf8')
  // const sus = fs.readFileSync('music_score/0074_master.sus', 'utf8')

  // const sus = fs.readFileSync('music_score/0083_master.sus', 'utf8') // Gimme X Gimme

  // "fillerSec": 9.324299812316895
  // const sus = fs.readFileSync('music_score/0128_01/expert.sus', 'utf8') // Brand New Day
  // const sus = fs.readFileSync('music_score/0128_01/master.sus', 'utf8') // Brand New Day

  // "fillerSec": 9
  // const sus = fs.readFileSync('music_score/0049_01/expert.sus', 'utf8') // 初音ミクの消失
  // const sus = fs.readFileSync('music_score/0049_01/master.sus', 'utf8') // 初音ミクの消失

  // const sus = fs.readFileSync('music_score/0028_01/expert.sus', 'utf8') // ドクター=ファンクビート
  // const sus = fs.readFileSync('music_score/0028_01/master.sus', 'utf8') // ドクター=ファンクビート

  // "fillerSec": 9
  // const sus = fs.readFileSync('music_score/0006_01/expert.sus', 'utf8') // ヒバナ -Reloaded-
  // const sus = fs.readFileSync('music_score/0006_01/master.sus', 'utf8') // ヒバナ -Reloaded-


  const susValidate = SusAnalyzer.validate(sus)
  const susMeta = SusAnalyzer.getMeta(sus)
  const susData = SusAnalyzer.getScore(sus, 480)
  global.susData = susData

  console.log(susValidate)
  console.log(susMeta)
  console.log(susData)
  
  // const Sus2Image = require('./sus-2-image/dist/index')
  // Sus2Image.getPNG(sus).then(image => {
  //   fs.writeFileSync(`score_0074_expert.png` , image)
  // })

  let processedSus = readSusFile(sus)
  let susMsNotes = processedSus.timestampNotes
  let susMsSlides = processedSus.slides


  console.log("susMsNotes", susMsNotes)
  console.log("susSlides", susMsSlides)
  global.noteObj = susMsNotes

  susMsNotes.forEach(x => {
    if (x.type.indexOf("flick") >= 0) {
      player.Add(x.t - FLICK_EARLY, x)
    } else {
      player.Add(x.t, x)
    }
  })
  player.Sort()

  

  console.log("score", player.score)

  if (os.platform() != "linux") {
    player.Play(playCallback)
  }

  // landscape position
  let laneXPositions = [
    Math.round(470 / 2340 * 10000), // left side
    Math.round(600 / 2340 * 10000),
    Math.round(730 / 2340 * 10000),
    Math.round(850 / 2340 * 10000),
    Math.round(980 / 2340 * 10000),
    Math.round(1105 / 2340 * 10000),
    Math.round((2340 - 1105) / 2340 * 10000), // right side, by flip left side values
    Math.round((2340 - 980) / 2340 * 10000),
    Math.round((2340 - 850) / 2340 * 10000),
    Math.round((2340 - 730) / 2340 * 10000),
    Math.round((2340 - 600) / 2340 * 10000),
    Math.round((2340 - 470) / 2340 * 10000),
  ]
  // = [2009, 2564, 3120, 3632, 4188, 4722, 5278, 5812, 6368, 6880, 7436, 7991]

  let laneYPosition = Math.round(850 / 1080 * 10000)
  // let laneYPosition = Math.round(950 / 1080 * 10000)
  let screenXPositions = 10000 - laneYPosition

  async function playCallback (payload) {
    // console.log(1);
    console.log(payload.t, payload.objects.map(x => {
      return `${x.type} ${x.lane}`
    }));

    let touch_i = 0;
    payload.objects.forEach(note => {
      let this_touch_i = touch_i;
      /// console.log(`forEach! type = ${note.type}`);
      if (note.type.indexOf("tap") >= 0) {
        /// console.log(`tap lane ${note.lane}`)

        // ignore touch if a waypoint exist on same lane
        let waypoints = payload.objects.filter(x => (
          x.lane == note.lane && x.type.indexOf("waypoint") >= 0
        ))

        if (waypoints.length === 0) {
          sendTouch([{
            x: screenXPositions, 
            y: Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2),
            t: 10
          }])
        }

        touch_i += 1
      } else if (note.type.indexOf("flick") >= 0) {
        /// console.log(`flick lane ${note.lane}`)

        let touchesToSend = []
        for (let j = 0; j < 7; j++) {
          touchesToSend.push({
            x: screenXPositions + 200 * j,
            y: Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2),
            t: 8
          })
        }
        sendTouch(touchesToSend)

        touch_i += 1
      } else if (note.type == "slide head") {
        // console.log(`slide lane ${note.lane}`)

        let slideRaw = susMsSlides[note.slideId]
        // remove nocombo node first
        // for (let i = slide.length - 1; i >= 0; i--) {
        //   const node = slide[i];
        //   if (node.type.indexOf("nocombo") >= 0) {
        //     slide.splice(i, 1)
        //   }
        // }

        let touchesToSend = []
        // loop through each node on the slide
        // if diamond + waypoint hvcombo on same place, lane value will be ignored
        // filter out them first
        slide = slideRaw.filter(x => {
          return !(x.type.indexOf("hvcombo") && x.diamondNote)
        })
        // console.log("slide filter", slide, slideRaw);

        for (let i = 0; i < slide.length - 1; i++) {
          const node = slide[i]
          const nextNode = slide[i + 1]

          const intervalToNextNode = nextNode.t - node.t
          const nodeXPositions = (laneXPositions[node.lane - 2] + laneXPositions[node.lane + node.width - 2 - 1]) / 2
          const xDiffToNextNode = (laneXPositions[nextNode.lane - 2] + laneXPositions[nextNode.lane + nextNode.width - 2 - 1]) / 2 - 
          (laneXPositions[node.lane - 2] + laneXPositions[node.lane + node.width - 2 - 1]) / 2;

          
          for (let j = 0; j < intervalToNextNode; j += SLIDE_UPDATE_FREQUENCY) {
            let intervalTime = (j + SLIDE_UPDATE_FREQUENCY < intervalToNextNode) ? SLIDE_UPDATE_FREQUENCY : intervalToNextNode - j
            let pathPercentage = j / intervalToNextNode

            // calculate x position
            let resultXPosition = nodeXPositions;
            if (node.airNote && node.airNote.type.indexOf("bend") >= 0) {
              if (node.airNote.type.indexOf("middle") >= 0) {
                resultXPosition += xDiffToNextNode * (1 - Math.sin(pathPercentage * Math.PI * 0.5 + Math.PI * 0.5))
                // console.log("1 - sin", resultXPosition)
              } else {
                resultXPosition += xDiffToNextNode * Math.sin(pathPercentage * Math.PI * 0.5)
                // console.log("sin", resultXPosition)
              }
            } else {
              resultXPosition += xDiffToNextNode * pathPercentage
            }
            
            touchesToSend.push({
              x: screenXPositions,
              // y: Math.round(nodeXPositions + xDiffToNextNode * pathPercentage),
              y: Math.round(resultXPosition),
              t: intervalTime
            })
          }
          // console.log("1")
        }

        // append slide tail
        let lastNode = slide[slide.length - 1]
        // check if tail note is a flick
        if (lastNode.airNote && lastNode.airNote.type.indexOf("flick") >= 0) {
          // make the slide finish earlier for early flick
          let lastNodeInterval = touchesToSend[touchesToSend.length - 1].t
          
          touchesToSend[touchesToSend.length - 1].t = lastNodeInterval > FLICK_EARLY + 10 ? lastNodeInterval - FLICK_EARLY : lastNodeInterval
          
          for (let j = 0; j < 3; j++) {
            touchesToSend.push({
              x: screenXPositions + 200 * j,
              y: Math.round((laneXPositions[lastNode.lane - 2] + laneXPositions[lastNode.lane + lastNode.width - 2 - 1]) / 2),
              t: 8
            })
          }
        }

        sendTouch(touchesToSend)

        touch_i += 1
      }
    })
    

    // await touch.moveFingerTo(0, 5000, 5000)
    // await touch.releaseFinger(0)
  }
})();
setInterval(() => {}, 1000);

let touching = [false, false]
let touchQueue = []
/**
 * 
 * @param {Array} touch 
 */
function sendTouch (touch) {
  // array of touch object: x, y, t
  // console.log(`sendTouch len = ${touch.length}`);
  touch.x = Math.round(touch.x + Math.random() * 5 - 2)
  touch.y = Math.round(touch.y + Math.random() * 5 - 2)
  touchQueue.push(touch)
  // setTimeout(() => {
    processTouchQueue()
  // }, 0)
}

function processTouchQueue () {
  if (touchQueue.length > 0) {
    let freeSlot = touching[0] ? (touching[1] ? -1 : 1) : 0 //touching.indexOf(false)
    // console.log(`freeSlot = ${freeSlot} - ${touching}`);
    if (freeSlot >= 0) {
      let actions = touchQueue.shift()
      touching[freeSlot] = actions
      

      processTouch(touching[freeSlot])
      async function processTouch (actions) {
        touch.moveFingerTo(freeSlot, actions[0].x, actions[0].y)
        // console.log("process touch " + freeSlot);
        await sleep(actions[0].t)
        actions.shift() // put shift at last to make sure moveFingerTo is executed first
        if (actions.length > 0) {
          processTouch(actions)
        } else {
          touch.releaseFinger(freeSlot)
          touching[freeSlot] = false
          processTouchQueue()
        }
      }
    }
  }
}


  // console.log(susMeta.getNotes(955, ))

  // sus2img code

  // const height = absMeasure[absMeasure.length - 1] + 32

  // //                SusAnalyzer.ISusNotes   
  // const shortAbs = (note) => ({
  //   absMeasure: absMeasure[note.measure],
  //   absY:
  //     height -
  //     (absMeasure[note.measure] +
  //       note.tick * (susData.BPMs[0] / susData.BPMs[note.measure])) -
  //     8,
  //   ...note,
  //   tick: note.tick + 8
  // })
  // //               SusAnalyzer.ISusNotes[]
  // const longAbs = (ln) =>
  //   ln.map(note => ({
  //     absMeasure: absMeasure[note.measure],
  //     absY:
  //       height -
  //       (absMeasure[note.measure] +
  //         note.tick * (susData.BPMs[0] / susData.BPMs[note.measure])) -
  //       8,
  //     ...note,
  //     tick: note.tick + 8
  // }))

  // //    ISusNotesAbs[]
  // const short = susData.shortNotes.map(shortAbs)
  // console.log("short", short);


// 0 1 (2 3 4 5) 5 6 7 8 (9 10 11 12) 13 14 15
// slideNotes[0] = [{"lane":2,"laneType":3,"measure":0,"noteType":1,"tick": 0,"width":4,"channel":48},
//                  {"lane":2,"laneType":3,"measure":0,"noteType":2,"tick":96,"width":4,"channel":48}]

// shortNotes[0] = {"lane":5,"laneType":1,"measure":0,"noteType":1,"tick":144,"width":3}
// shortNotes[1] = {"lane":5,"laneType":1,"measure":0,"noteType":1,"tick":384,"width":2}

function readSusFile (sus) {
  // ref: https://github.com/PurplePalette/pjsekai-score-doc/wiki/%E4%BD%9C%E6%88%90%E6%96%B9%E6%B3%95
    
  const data = SusAnalyzer.getScore(sus, 480)
  //    number[]
  const absMeasure = []
  const absMs = []
  // measure # -> tick count
  {
    // calculate escaped time by measure id
    let prevTick = 0
    let prevMs = 0
    for (let i = 0; i <= data.measure; i++) {
      let tick = prevTick + 480 * data.BEATs[i - 1] * (data.BPMs[0] / data.BPMs[i - 1])
      let ms = prevMs + 60 / data.BPMs[i - 1] * 1000 * data.BEATs[i - 1] * (data.BPMs[0] / data.BPMs[i - 1])
      if (i === 0) {
        tick = 0
        ms = 0
      }
      absMeasure.push(tick)
      absMs.push(Math.floor(ms))
      prevTick = tick
      prevMs = ms
    }
  }
  // console.log("absMeasure", absMeasure);
  // console.log("absMs", absMs);

  let result = []

  // use to remove overlaping tap + flick or tap + slide head
  let shortNotesMap = {}

  data.shortNotes.forEach(note => {
    let type = "unknown"
    if (note.lane == 0 && note.noteType == 4) {
      type = "skill"
    } else if (note.lane == 15 && note.noteType == 2) {
      type = "fever chance"
    } else if (note.lane == 15 && note.noteType == 1) {
      type = "fever"
    } else if (note.lane >= 2 && note.lane <= 13 && note.noteType == 1) {
      type = "tap"
    } else if (note.lane >= 2 && note.lane <= 13 && note.noteType == 2) {
      type = "yellow tap"
    } else if (note.lane >= 2 && note.lane <= 13 && note.noteType == 3) {
      type = "diamond" // combo point on slide, will not affect slide path
      //  chunithm = flick note
      // When the flick notes of Chunithm are placed on the relay point or invisible relay point of the slide, the shape of the slide at the placed relay point is ignored and the relay points before and after are interpolated and connected.
      // In the case of an image, a relay point is placed on the refracting slide, and flick notes are placed on it.
      // Therefore, refraction is ignored and it is linear.
      // If flick notes are placed above an invisible relay point, the relay point will not be drawn.
    }
    
    let resultObject = {
      t: Math.floor(absMs[note.measure] + note.tick / 480 * 60 / data.BPMs[note.measure] * 1000 * (data.BPMs[0] / data.BPMs[note.measure])),
      // (absMeasure[note.measure] +
        //       note.tick * (susData.BPMs[0] / susData.BPMs[note.measure]))
      // ...note,
      type: type,
      lane: note.lane,
      raw: note,
      measure: note.measure,
      width: note.width,
      r: "short", // raw type
    }

    shortNotesMap[`${resultObject.measure}_${resultObject.raw.tick}_${resultObject.lane}`] = resultObject
    // will push to result after filtering out slide only
  })

  // use to map airNote to slideNote
  let airNotesMap = {}

  data.airNotes.forEach(note => {
    let type = "unknown"
    if (note.noteType == 5) { // air down (left)
      type = "slide bend left"
    } else if (note.noteType == 6) { // air down (right)
      type = "slide bend right"
    } else if (note.noteType == 2) { // air down (middle)
      type = "slide bend middle"
    } else if (note.noteType == 1) { // air up (middle)
      type = "flick"
    } else if (note.noteType == 4) { // air up (right)
      type = "flick right"
    } else if (note.noteType == 3) { // air up (left)
      type = "flick left"
    }

    // for remove overlapping taps
    let shortNote = shortNotesMap[`${note.measure}_${note.tick}_${note.lane}`]
    if (shortNote) {
      // console.log("remove shortNote", shortNote, "overlapping airNote", note);
      delete shortNotesMap[`${note.measure}_${note.tick}_${note.lane}`]
    } else {
      shortNote = false
    }

    let resultObject = {
      t: Math.floor(absMs[note.measure] + note.tick / 480 * 60 / data.BPMs[note.measure] * 1000 * (data.BPMs[0] / data.BPMs[note.measure])),
      // ...note,
      type: type,
      lane: note.lane,
      raw: note,
      measure: note.measure,
      width: note.width,
      r: "air",
      shortNote: shortNote,
    }

    airNotesMap[`${resultObject.measure}_${resultObject.raw.tick}_${resultObject.lane}`] = resultObject
    // will push to result after filtering out slide only
  })

  let prevSlideId = 1
  let slides = []

  data.slideNotes.forEach(notes => {
    let type = "unknown"
    slides[prevSlideId] = []
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (i == 0 && note.noteType == 1) {
        type = "slide head"
      } else if (i == notes.length - 1 && note.noteType == 2) {
        type = "slide tail"
      } else if (note.noteType == 3) {
        type = "slide waypoint hvcombo" // have diamond
      } else if (note.noteType == 5) {
        type = "slide waypoint nocombo"
      }

      // for merge overlaying airNotes to slide
      let airNote = airNotesMap[`${note.measure}_${note.tick}_${note.lane}`]
      if (airNote) {
        delete airNotesMap[`${note.measure}_${note.tick}_${note.lane}`]
      } else {
        airNote = false
      }

      // check overlapping taps
      // expected taps type: yellow tap, diamond
      let shortNote = shortNotesMap[`${note.measure}_${note.tick}_${note.lane}`]
      let diamondNote = false;
      if (shortNote) {
        // console.log("remove shortNote", shortNote, "overlapping slideNote", note);
        if (shortNote.type == "diamond") {
          diamondNote = shortNote
        } else {
          delete shortNotesMap[`${note.measure}_${note.tick}_${note.lane}`]
        }
      } else {
        shortNote = false
      }

      let resultObject = {
        t: Math.floor(absMs[note.measure] + note.tick / 480 * 60 / data.BPMs[note.measure] * 1000 * (data.BPMs[0] / data.BPMs[note.measure])),
        // ...note,
        type: type,
        lane: note.lane,
        raw: notes,
        measure: note.measure,
        width: note.width,
        r: "slide",
        slideId: prevSlideId,
        shortNote: shortNote,
        airNote: airNote,
        diamondNote: diamondNote,
      }
      slides[prevSlideId].push(resultObject)
      result.push(resultObject)
    }
    slides[prevSlideId].sort((a, b) => {
      return a.t - b.t
    })

    prevSlideId += 1
  })
  
  // add remaining shortNotes to result
  for (const key in shortNotesMap) {
    if (Object.hasOwnProperty.call(shortNotesMap, key)) {
      const note = shortNotesMap[key];
      // console.log("push shortNotes", note);
      result.push(note)
    }
  }
  
  // add remaining airNotes to result
  // console.log("lonely airNotes", airNotesMap);
  for (const key in airNotesMap) {
    if (Object.hasOwnProperty.call(airNotesMap, key)) {
      const note = airNotesMap[key];
      // console.log("push airNote", note);
      result.push(note)
    }
  }
  

  result = result.sort((a, b) => {
    if (a.t == b.t)
      return a.lane - b.lane
    return a.t - b.t
  })

  return {
    timestampNotes: result,
    slides: slides,
  }
}


console.log("Ready!");
rl.prompt();