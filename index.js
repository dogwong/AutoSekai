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

if (os.platform() == "linux") {
  console.log("linux! init bluetooth");
  
  BleTouch = require('./lib/bleTouch');
  bleTouch = new BleTouch();
} else {
  console.log("not linux!");
}
let touch = new Touch(bleTouch);


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

  process.stdin.on('keypress', function(s, key) {
    // console.log(key);
    if (key.name == "return" && !player.isPlaying) {
      player.Play(playCallback)
      console.log("Play!")
    } else if (key.name == "down") {
      player.Shift(-5)
      console.log(`shift -5  => ${player.timeshift}`);
    } else if (key.name == "up") {
      player.Shift(5)
      console.log(`shift +5  => ${player.timeshift}`);
    } else if (key.name == "s" && player.isPlaying) {
      player.Stop(playCallback)
      console.log("Stop!")
    }
  });


  if (os.platform() == "linux") {
    console.log("init bluetooth");
    await bleTouch.init();
  }

  // const sus = fs.readFileSync('music_score/0074_easy.sus', 'utf8')
  const sus = fs.readFileSync('music_score/0074_normal.sus', 'utf8')
  // const sus = fs.readFileSync('music_score/0074_master.sus', 'utf8')
  // const sus = fs.readFileSync('music_score/0083_master.sus', 'utf8')

  const susValidate = SusAnalyzer.validate(sus)
  const susMeta = SusAnalyzer.getMeta(sus)
  const susData = SusAnalyzer.getScore(sus, 480)
  global.susData = susData

  console.log(susValidate)
  console.log(susMeta)
  console.log(susData)
  
  // const Sus2Image = require('./sus-2-image/dist/index')
  // Sus2Image.getPNG(sus).then(image => {
  //   fs.writeFileSync(`score_0083_normal.png` , image)
  // })


  let noteObj = susNotesToTimestamp(sus)
  console.log(noteObj)
  global.noteObj = noteObj

  noteObj.forEach(x => {
    if (x.type.indexOf("flick") >= 0) {
      player.Add(x.t - 20, x)
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
    // console.log(payload.t, payload.objects);

    let touch_i = 0;
    payload.objects.forEach(note => {
      let this_touch_i = touch_i;
      /// console.log(`forEach! type = ${note.type}`);
      if (note.type.indexOf("tap") >= 0) {
        /// console.log(`tap lane ${note.lane}`)

        sendTouch([{
          x: screenXPositions, 
          y: Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2),
          t: 10
        }])

        // touch.moveFingerTo(this_touch_i, screenXPositions, Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2)).then(async () => {
        //   await sleep(30)
        //   touch.releaseFinger(this_touch_i)
        // });

        touch_i += 1
      } else if (note.type.indexOf("flick") >= 0) {
        /// console.log(`flick lane ${note.lane}`)

        let touchesToSend = []
        for (let j = 0; j < 6; j++) {
          touchesToSend.push({
            x: screenXPositions + 200 * j,
            y: Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2),
            t: 8
          })
        }
        sendTouch(touchesToSend)
        
        // touch.moveFingerTo(this_touch_i + 2, screenXPositions, Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2)).then(async () => {
        //   await sleep(10)
        //   for (let j = 0; j < 4; j++) {
        //     touch.moveFingerTo(this_touch_i + 2, screenXPositions + 200 * j, Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2))

        //     await sleep(10)
        //   };
        //   touch.releaseFinger(this_touch_i + 2)
        // })

        touch_i += 1
      } else if (note.type == "slide head") {
        /// console.log(`flick lane ${note.lane}`)

        let touchesToSend = []

        sendTouch([{
          x: screenXPositions, 
          y: Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2),
          t: 10
        }])

        for (let j = 0; j < 6; j++) {
          touchesToSend.push({
            x: screenXPositions + 200 * j,
            y: Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2),
            t: 8
          })
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
  touchQueue.push(touch)
  // setTimeout(() => {
    processTouchQueue()
  // }, 0)
}

function processTouchQueue () {
  if (touchQueue.length > 0) {
    let freeSlot = touching[0] ? (touching[1] ? -1 : 1) : 0 //touching.indexOf(false)
    // console.log(`freeSlot = ${touching}`);
    if (freeSlot >= 0) {
      let actions = touchQueue.shift()
      touching[freeSlot] = actions
      
      processTouch(touching[freeSlot])
      async function processTouch (actions) {
        touch.moveFingerTo(freeSlot, actions[0].x, actions[0].y)
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

function susNotesToTimestamp (sus) {
    
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
  console.log("absMs", absMs);

  let result = []

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
    }
    result.push({
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
    })
  })

  let prevSlideId = 1

  data.slideNotes.forEach(notes => {
    let type = "unknown"
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      if (i == 0 && note.noteType == 1) {
        type = "slide head"
      } else if (i == notes.length - 1 && note.noteType == 2) {
        type = "slide tail"
      } else if (note.noteType == 3) {
        type = "slide waypoint combo" // have diamond
      } else if (note.noteType == 5) {
        type = "slide waypoint nocombo"
      }

      result.push({
        t: Math.floor(absMs[note.measure] + note.tick / 480 * 60 / data.BPMs[note.measure] * 1000 * (data.BPMs[0] / data.BPMs[note.measure])),
        // ...note,
        type: type,
        lane: note.lane,
        raw: notes,
        measure: note.measure,
        width: note.width,
        r: "slide",
        slideId: prevSlideId,
      })
    }
    prevSlideId += 1
  })

  data.airNotes.forEach(note => {
    let type = "unknown"
    if (note.noteType == 5) { // air down (left)
      type = "slide bend_head"
    } else if (note.noteType == 6) { // air down (right)
      type = "slide bend_head"
    } else if (note.noteType == 2) { // air down (middle)
      type = "slide bend_middle"
    } else if (note.noteType == 1) { // air up (middle)
      type = "flick"
    } else if (note.noteType == 4) { // air up (right)
      type = "flick right"
    } else if (note.noteType == 3) { // air up (left)
      type = "flick left"
    }

    result.push({
      t: Math.floor(absMs[note.measure] + note.tick / 480 * 60 / data.BPMs[note.measure] * 1000 * (data.BPMs[0] / data.BPMs[note.measure])),
      // ...note,
      type: type,
      lane: note.lane,
      raw: note,
      measure: note.measure,
      width: note.width,
      r: "air",
    })
  })
  

  result = result.sort((a, b) => {
    if (a.t == b.t)
      return a.lane - b.lane
    return a.t - b.t
  })

  return result
}


console.log("Ready!");
rl.prompt();