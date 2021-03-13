const SusAnalyzer = require('sus-analyzer')


class SekaiSusReader {
  
  /**
   * 
   * @param {String} sus - Strings from .sus file
   * @returns {{timestampNotes: Object[], slides: Object[]}} - Result
   */
  static Read (sus) {
    // score files source: https://pjsek.ai/assets/startapp/music/music_score
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
        // chunithm = flick note
        // When the flick notes of Chunithm are placed on the relay point or invisible relay point of the slide, the shape of the slide at the placed relay point is ignored and the relay points before and after are interpolated and connected.
        // In the case of an image, a relay point is placed on the refracting slide, and flick notes are placed on it.
        // Therefore, refraction is ignored and it is linear.
        // If flick notes are placed above an invisible relay point, the relay point will not be drawn.
      }
      
      let resultObject = {
        t: Math.floor(absMs[note.measure] + note.tick / 480 * 60 / data.BPMs[note.measure] * 1000 * (data.BPMs[0] / data.BPMs[note.measure])),
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
  
}

module.exports = SekaiSusReader;