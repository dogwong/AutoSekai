// import node native stuffs
const os = require('os')
// touch stuffs
const Touch = require('./touch')
let BleTouch;
let bleTouch;
const sleep = require('util').promisify(setTimeout)

// init bluetooth stuffs
if (os.platform() == "linux") {
  console.log("linux! init bluetooth");
  
  BleTouch = require('./bleTouch');
  bleTouch = new BleTouch();
} else {
  console.log("not linux!");
}

let touch = new Touch(bleTouch);

(async () => {
  if (os.platform() == "linux") {
    console.log("init bluetooth");
    await bleTouch.init();
  }
})();

touching = [false, false]
touchQueue = []

class Toucher {
  constructor () {
    // this.fingerLimit = 2
    
    
  }
  
 
  /**
  * 
  * @typedef Touch
  * @property {Number} x - x coordinate
  * @property {Number} y - y coordinate
  * @property {Number} t - milliseconds of touch down duration
  * 
  * @param {Touch[]} touches - An array of touch objects
  * @description Perform a series of action with a single touch
  */
  static SendTouch (touches) {
    
    // array of touch object: x, y, t
    // console.log(`sendTouch len = ${touch.length}`);
    touches.x = Math.round(touches.x + Math.random() * 5 - 2)
    touches.y = Math.round(touches.y + Math.random() * 5 - 2)
    touchQueue.push(touches)
    // setTimeout(() => {
    this._processTouchQueue()
    // }, 0)
  }
  
  static _processTouchQueue () {
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
            Toucher._processTouchQueue()
          }
        }
      }
    }
  }
  
}



module.exports = Toucher;