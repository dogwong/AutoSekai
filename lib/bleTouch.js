const dbus = require('dbus-next');
let bus = dbus.systemBus();

class bleTouch {
  async init() {
    let obj = await bus.getProxyObject('org.thanhle.btkbservice', '/org/thanhle/btkbservice');
    this.iface = obj.getInterface('org.thanhle.btkbservice');
  }

  async write(data) {
    data.pop();
    this.iface.send_touch(0, data);
  }
}

module.exports = bleTouch;
