
(function() {
  "user strict";

  var root = this
  var previouse_Observable = root.Observable

  //************* main library class *******************//
  var Observable = function (getLastUpdate = false) {
    this.events = {}
    this.getLastUpdate = getLastUpdate

    this.removeListener = function(eventName, observer) {
      console.log('removeEvent:', eventName, observer)
      if (this.events[eventName]) {
        this.events[eventName] = this.events[eventName].filter((obsvr) => obsrv !== observer)
      }
    }

    this.on = function (eventName, observer) {
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

    this.emit = function (eventName, data) {
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

    this.getEventObj = function () {
      return this.events
    }
  }
  //******** end of main library class Observable ************/


  // provide noConflict method to avoid name conflict
  Observable.noConflict = function() {
    root.Observable = previouse_Observable
    return Observable
  }



  // the main export...
  if( typeof exports !== 'undefined' ) {
    if( typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Observable
    }
    exports.Observable = Observable
  } else {
    root.Observable = Observable
  }
}).call(this)
