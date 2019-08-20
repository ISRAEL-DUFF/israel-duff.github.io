class Observable {
  constructor (getLastUpdate = false) {
    this.events = {}
    this.getLastUpdate = getLastUpdate
  }

  removeListener (eventName, observer) {
    console.log('removeEvent:', eventName, observer)
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter((obsvr) => obsrv !== observer)
    }
  }

  on (eventName, observer) {
    if (eventName && (typeof eventName === 'string' || typeof eventName === 'number')) {
      if (!this.events[eventName]) {
        this.events[eventName] = { observers: [] }
      }
      if (typeof observer === 'function'){
        this.events[eventName].observers.push(observer)
        if (this.getLastUpdate) observer(this.events[eventName].latestData)
      } else if (typeof observer === 'object' && observer.update && typeof observer.update === 'function') {
        this.events[eventName].observers.push(observer)
        if (this.getLastUpdate) observer.update(this.events[eventName].latestData)
      }

    }
  }

  once () {

  }

  emit (eventName, data) {
    if (this.events[eventName]) {
      for (let observer of this.events[eventName].observers) {
        if(typeof observer === 'function') {
          observer(data)
        } else {
          observer.update(data)
        }
      }

      // store the last data as latest
      this.events[eventName].latestData = data
    }
  }

  getEventObj () {
    return this.events
  }
}

module.exports = Observable
