
class Microphone {
  constructor (options) {
    this.evt = new Observable()
    this.playing = false
    this.recording = false
    this.audioBuffer = []

    // check for download link id
    let dl = ''
    if (options && options.downlLinkId){
      dl = document.getElementById(options.downlLinkId)
      if (!dl) {
        dl = document.createElement('a')
        dl.innerHTML = 'download'
      }
    } else {
      dl = document.createElement('a')
      dl.innerHTML = 'download'
    }

    // check for audio-container to insert <audio></audio>
    let container = ''
    let player = ''
    if(options && options.container) {
      container = document.getElementById(options.container)
      if(container) {
        player = document.createElement('audio')
        container.appendChild(player)
        container.appendChild(dl)
        this.downloadLink = dl
      } else throw(new Error(`container element ${options.container} does not exist`))
    } else throw(new Error(`Empty container element`))

    const that = this;
    that.player = player
    that.player.controls = false
    // get data from microphone
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then((stream) => {

      // ***** store raw audio data from microphone into buffer *****//
      const audioCtx = new AudioContext()
      const audioSrc = audioCtx.createMediaStreamSource(stream)
      // createScriptProcessor(bufferSize, n_input_channels, n_output_channels)
      const audioProcessor = audioCtx.createScriptProcessor(1024, 1, 1);

      audioSrc.connect(audioProcessor)
      audioProcessor.connect(audioCtx.destination)

      // add th process event
      audioProcessor.onaudioprocess = function(e) {
        // Do some cool stuff with the data, e.g. convert it to WAV
        /*that.audioBuffer.push(e.inputBuffer)
        console.log('AudioData:', e) */
      }
      // ******* End of storing audio data *******//

      // ****** store ********//
      const mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/webm'})
      mediaRecorder.ondataavailable = function(e) {
        if(e.data.size > 0) {
          that.audioBuffer.push(e.data)
          // console.log('eData:', e.data)
        }
      }

      mediaRecorder.onstop = function() {
        let blobData = new Blob(that.audioBuffer)
        // set blob type
        blobData = blobData.slice(0, blobData.size, 'audio/webm')
        that.downloadLink.href = URL.createObjectURL(blobData);
        console.log('eData:', blobData)
        that.downloadLink.download = 'acetest.wav';
        that.player.src = that.downloadLink.href

        // emit the end event here to signal that the recording has stopped
        // hence, data is available
        that.evt.emit('dataready', blobData)

        /*if (window.URL) {console.log('okURL;', stream)
          that.player.srcObject = stream;
        } else {
          that.player.src = stream;
        }*/
      }
      // ***** end store **** //

      // listen for play(), stop() start() and end() event
      that.evt.on('start', () => {
        mediaRecorder.start()
        console.log('Recording...')
        that.evt.emit('recording', that.recording)
      })
      that.evt.on('end', () => {
        mediaRecorder.stop()
        that.evt.emit('recording', that.recording)
        console.log('Recording paused...')
      })

      that.evt.on('play', ()=> {
        that.player.play()
        that.evt.emit('playing', that.playing)
      })
      that.evt.on('stop', ()=> {
        that.player.pause()
        that.evt.emit('playing', that.playing)
      })

      if(that.playing) {
        that.evt.emit('play')
      }

    }).catch((err)=>{
      console.log('Error:', err.message)
      throw(err)
    });
  }

  startRecording() {
    this.recording = true
    this.evt.emit('start')
  }

  stopRecording() {
    this.recording = false
    this.evt.emit('end')
  }

  restart() {
    that.audioBuffer = []
  }

  play() {
    this.playing = true
    this.evt.emit('play')
  }

  stop() {
    this.playing = false
    this.evt.emit('stop')
  }

  getDownloadLink() {
    return this.downloadLink
  }

  on(evtName, callback) {
    if(evtName && typeof evtName === 'string')
      if(callback && typeof callback === 'function')
        this.evt.on(evtName, callback)
  }
}
