class Observable {
  constructor (getLastUpdate = false) {
    this.events = {}
    this.getLastUpdate = getLastUpdate
  }

  removeListener (eventName, observer) {
    // console.log('removeEvent:', eventName, observer)
    if (this.events[eventName] && this.events[eventName].observers) {
      this.events[eventName].observers = this.events[eventName].observers.filter((obsvr) => obsvr !== observer)
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

  once (eventName, observer) {
    if (eventName && (typeof eventName === 'string' || typeof eventName === 'number')) {
      // Create a wrapper function that will remove itself after being called
      const onceWrapper = (data) => {
        if (typeof observer === 'function') {
          observer(data);
        } else if (typeof observer === 'object' && observer.update && typeof observer.update === 'function') {
          observer.update(data);
        }
        // Remove this wrapper from the observers list
        this.removeListener(eventName, onceWrapper);
      };

      // Add the wrapper to the observers list
      this.on(eventName, onceWrapper);
    }
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


// Export the Observable class as the default export
export default Observable;

// The main export logic for compatibility
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = Observable;
    }
    exports.Observable = Observable;
} else {
    // For AMD and global access
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return Observable;
        });
    } else {
        window.Observable = Observable;
    }
}
