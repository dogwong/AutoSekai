class ScorePlayer {
  constructor () {
    // internal setting
    this.FPS = 30
    this.SCALE = 1
    this.DEBUG = false
    // internal var
    this.score = []
    this.isPlaying = false
    this.startTime = process.hrtime()
    this.playheadTime = 0 // miliseconds
    this.playheadNote = 0
    this.timeshift = 0
    this.travelingSlide = []
    this.combo = 0
    this.prevNote = {}
    // private var
    this._callback
    this._playerInterval
    // 
  }

  Add (ms, payload) {
    if (isNaN(ms * 1) || ms < 0)
      throw new Error(">= 0 int")
    this.score.push({t: ms, p: payload})
  }

  Sort () {
    this.score = this.score.sort((a, b) => {
      return a.t - b.t
    })
  }

  Play (callback) {
    this.isPlaying = true
    this.startTime = process.hrtime()

    // this._playerInterval = setInterval(_onTick, this.DEBUG ? 1 : 1000 / this.FPS / this.SCALE)
    this._playerInterval = setInterval(_onTick, 10)

    let ctx = this
    let lastTick = process.hrtime()
    function _onTick () {
      // move the playhead
      let now = process.hrtime();
      if (ctx.DEBUG) {
        // ctx.playheadTime += 1 / ctx.FPS;
        ctx.playheadTime += ((now[0] - lastTick[0]) * 1000 + (now[1] - lastTick[1]) * 0.000001) * 10; // relative
      } else {
        ctx.playheadTime = ((now[0] - ctx.startTime[0]) * 1000 + (now[1] - ctx.startTime[1]) * 0.000001) + ctx.timeshift; // absolute
        // ctx.playheadTime += ((now[0] - lastTick[0]) * 1000 + (now[1] - lastTick[1]) * 0.000001); // relative
        // console.log(ctx.playheadTime);
      }
      lastTick = now
      // 
      let result = Array(12).fill("   "); // 12 lane
      
      if (ctx.score[ctx.playheadNote].t <= ctx.playheadTime) {
        let note = ctx.score[ctx.playheadNote].p

        let sameMsNotes = [note]
        for (let i = ctx.playheadNote + 1; i < ctx.score.length && ctx.score[i].t == ctx.score[ctx.playheadNote].t; i++) {
          sameMsNotes.push(ctx.score[i].p)
          ctx.playheadNote++
        }
        // if (sameMsNotes.length > 1)
        //   console.log("same time note = " + sameMsNotes.length);
        
        if (callback) {
          // group all notes on the same time to one callback
          callback({t: ctx.score[ctx.playheadNote].t, objects: sameMsNotes})

          // for (let callback_i = 0; callback_i < sameMsNotes.length; callback_i++) {
          //   const cb = sameMsNotes[callback_i];
          //   callback({object: note, together: sameMsNotes, callId: callback_i})
          // }
        }

        // console.log(`note ${ctx.playheadNote} - ${note.raw.lane}\t${note.type}`);
        result[note.lane - 1] = "(O)"
  
        ctx.playheadNote++
      }
      
      // string to print to console
      let noteString = result.join(" ")
      let resultString = "";

      // console.log(`${noteString}        {ctx.combo}\t${ctx.playheadTime.toFixed(2)}\t${ctx.playheadNote}`);

      if (ctx.playheadNote >= ctx.score.length) {
        console.log("EOF")
        
        ctx.Stop()
        clearInterval(ctx._playerInterval)
      }
    }
  }

  Stop () {
    this.isPlaying = false
    this.startTime = process.hrtime()
    this.playheadTime = 0
    this.playheadNote = 0
    this.travelingSlide = []
    this.combo = 0
    this.prevNote = {}

    clearInterval(this._playerInterval)
  }

  Shift (ms) {
    this.timeshift += ms
    return this.timeshift
  }
  

}



module.exports = ScorePlayer;