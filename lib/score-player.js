class ScorePlayer {
  constructor () {
    // internal setting
    this.DEBUG = false
    // internal var
    this.score = []
    this.isPlaying = false
    this.startTime = process.hrtime()
    this.playheadTime = 0 // miliseconds
    this.playheadNote = 0
    this.timeshift = 0
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

  PlayAtFirstNote (callback) {
    console.log(`PlayAtFirstNote @ ${this.score[0].t}`);
    return this.Play(callback, this.score[0].t)
  }

  Play (callback, time = 0) {
    return new Promise((resolve, reject) => {
      this.isPlaying = true
      this.startTime = process.hrtime()
      this.playheadTime = time

      this._playerInterval = setInterval(_onTick, 1)

      let ctx = this
      let lastTick = process.hrtime()
      function _onTick () {
        // move the playhead
        let now = process.hrtime();
        if (ctx.DEBUG) {
          // ctx.playheadTime += 1 / ctx.FPS;
          ctx.playheadTime += ((now[0] - lastTick[0]) * 1000 + (now[1] - lastTick[1]) * 0.000001) * 10; // relative
        } else {
          // ctx.playheadTime = ((now[0] - ctx.startTime[0]) * 1000 + (now[1] - ctx.startTime[1]) * 0.000001) + ctx.timeshift; // absolute
          ctx.playheadTime += ((now[0] - lastTick[0]) * 1000 + (now[1] - lastTick[1]) * 0.000001); // relative
          // console.log(ctx.playheadTime);
        }
        lastTick = now
        
        if (ctx.score[ctx.playheadNote].t <= ctx.playheadTime) {
          let note = ctx.score[ctx.playheadNote].p // payload

          let sameMsNotes = [note]
          for (let i = ctx.playheadNote + 1; i < ctx.score.length && ctx.score[i].t == ctx.score[ctx.playheadNote].t; i++) {
            sameMsNotes.push(ctx.score[i].p)
            ctx.playheadNote++
          }
          
          if (callback) {
            // group all notes on the same time to one callback
            callback({t: ctx.score[ctx.playheadNote].t, objects: sameMsNotes})
          }
    
          ctx.playheadNote++
        }

        if (ctx.playheadNote >= ctx.score.length) {
          console.log("EOF")
          
          ctx.Stop()
          clearInterval(ctx._playerInterval)
          resolve()
        }
      }
    })
    
  }

  Stop () {
    this.isPlaying = false
    this.startTime = process.hrtime()
    this.playheadTime = 0
    this.playheadNote = 0
    this.timeshift = 0

    clearInterval(this._playerInterval)
  }

  Shift (ms) {
    this.timeshift += ms
    this.playheadTime += ms
    return this.timeshift
  }
  

}



module.exports = ScorePlayer;