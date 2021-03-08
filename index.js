// import node native stuffs
const os = require('os')
const fs = require('fs')
const readline = require('readline');

// import npm and ./lib stuffs
const SusAnalyzer = require('sus-analyzer')
const SekaiSusReader = require('./lib/sekai-sus-reader')
const Toucher = require('./lib/toucher')
const ScorePlayer = require('./lib/score-player')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'AutoPlay> '
});
const sleep = require('util').promisify(setTimeout)




// config
const FLICK_EARLY = 20; // ms earlier to preform flick
const SLIDE_UPDATE_FREQUENCY = 30; // ms touch update interval during slide

// score files source: https://pjsek.ai/assets/startapp/music/music_score

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
        Toucher.SendTouch([touch])
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
      Toucher.SendTouch([touch])
    } else if (key.sequence == "t") {
      Toucher.SendTouch([{
        x: Math.round((1080 - 850) / 1080 * 10000),
        y: Math.round(1000 / 2340 * 10000),
        t: 2000
      }])
      Toucher.SendTouch([{
        x: Math.round((1080 - 850) / 1080 * 10000),
        y: Math.round(1340 / 2340 * 10000),
        t: 2000
      }])
    } else if (key.sequence == "y") {
      Toucher.SendTouch([{
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
      Toucher.SendTouch([{
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
    Toucher.SendTouch([{
      t: 50,
      x: Math.round((1080 - 1000) / 1080 * 10000),
      y: Math.round(2000 / 2340 * 10000),
    }]) // click start
    console.log("Click Start!");
    await sleep(8000);
    // for (let i = 0; i < 60; i++) {
    //   Toucher.SendTouch([{
    //     t: 30,
    //     x: Math.round((100 - 1000) / 1080 * 10000),
    //     y: Math.round(2250 / 2340 * 10000),
    //   }]) // click pause
    //   await sleep(50)
    // }
    let i = 0;
    console.log("Loop click pause!");
    async function loopTouch () {
      Toucher.SendTouch([{
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
        Toucher.SendTouch([{
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
            //   Toucher.SendTouch([touch])
            //   i += 1
            //   if (i < 26)
            //     setTimeout(loopTouch, 100)
            // }
            // loopTouch()
            for (let i = 0; i < 28; i++) {
              Toucher.SendTouch([touch])
              await sleep(100)
            }
            // await sleep(2600)
            // ------------- click song selection screen
            await sleep(1000)
            Toucher.SendTouch([{
              x: Math.round((1080 - 1000) / 1080 * 10000),
              y: Math.round(1650 / 2340 * 10000),
              t: 50
            }])
            await sleep(500)
            // click select song
            Toucher.SendTouch([{
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
  global.susData = susData // for vscode debug console

  console.log(susValidate)
  console.log(susMeta)
  console.log(susData)
  
  // const Sus2Image = require('./sus-2-image/dist/index')
  // Sus2Image.getPNG(sus).then(image => {
  //   fs.writeFileSync(`score_0074_expert.png` , image)
  // })

  let processedSus = SekaiSusReader.Read(sus)
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
  let screenXPositions = 10000 - laneYPosition

  async function playCallback (payload) {
    
    payload.objects.forEach(note => {
      /// console.log(`forEach! type = ${note.type}`);
      if (note.type.indexOf("tap") >= 0) {
        /// console.log(`tap lane ${note.lane}`)

        // ignore touch if a waypoint exist on same lane
        let waypoints = payload.objects.filter(x => (
          x.lane == note.lane && x.type.indexOf("waypoint") >= 0
        ))

        if (waypoints.length === 0) {
          Toucher.SendTouch([{
            x: screenXPositions, 
            y: Math.round((laneXPositions[note.lane - 2] + laneXPositions[note.lane + note.width - 2 - 1]) / 2),
            t: 10
          }])
        }
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
        Toucher.SendTouch(touchesToSend)
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
              y: Math.round(resultXPosition),
              t: intervalTime
            })
          }
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

        Toucher.SendTouch(touchesToSend)
      }
    })

    console.log(payload.t, payload.objects.map(x => {
      return `${x.type} ${x.lane}`
    }));
  }
})();
setInterval(() => {}, 1000); // keep this script running



console.log("Ready!");
rl.prompt();