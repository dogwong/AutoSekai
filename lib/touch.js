
const os = require('os')
const max_hid_value = 32767.0;
const step_pixel = 86;
const _ = require('lodash')

let CONTACT_COUNT_MAXIMUM = 10;

class Finger {
  constructor() {
    this.contact = 0; // int
    this.x = 0; // int16_t
    this.y = 0; // int16_t
  }
}

let fingers = [];// = Finger[CONTACT_COUNT_MAXIMUM];

class Touch {
  constructor(device) {
    this.self = device;
    this.enabled = false;
    if (os.platform == "linux") {
      this.enabled = true;
    }
    // this.current = 5;

    for (let i = 0; i < CONTACT_COUNT_MAXIMUM; i++) {
      fingers[i] = new Finger();
    }
  }

  _LSB(v) {
    return (v >> 8) & 0xff;
  }

  _MSB(v) {
    return v & 0xff;
  }

  send(identifier = 0, touch = 0, x = 0, y = 0) {
    // calculate current contact count
    let contact = 0;

    for (let i = 0; i < CONTACT_COUNT_MAXIMUM; i++) {
      if (fingers[i].contact) {
        contact += 1;
      }
    }

    // create data array
    let data = [
      contact,          // contact count
      identifier,       // contact identifier
      touch,            // finger touches display
      this._MSB(x), this._LSB(x), // x
      this._MSB(y), this._LSB(y), // y
      0x00,
    ];

    // send update
    if (this.enabled)
      return this.self.write(data);
    else
      return new Promise((resolve, reject) => {
        resolve()
      })
  }

  moveFingerTo (identifier = 0, x = 0, y = 0) {
    // change finger record
    fingers[identifier].contact = 1;
    fingers[identifier].x = x;
    fingers[identifier].y = y;

    if (!this.enabled)
      console.log(` - move finger ${identifier} to ${x}, ${y}`);
    // send update
    return this.send(identifier, 1, x, y);
  }
  
  releaseFinger (identifier = 0) {
    // change finger record
    fingers[identifier].contact = 0;
    fingers[identifier].x = 0;
    fingers[identifier].y = 0;

    if (!this.enabled)
      console.log(` - lift finger ${identifier}`);
    // send update
    return this.send(identifier, 0, 0, 0);
  }
}

module.exports = Touch;
