import './index.css'

// head
const scripts = [
  ['https://cdnjs.cloudflare.com/ajax/libs/shaka-player/3.3.1/shaka-player.compiled.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/shaka-player/3.3.1/shaka-player.ui.min.js'],
  ['https://www.gstatic.com/cv/js/sender/v1/cast_sender.js']
]

const css = [
  ['https://cdnjs.cloudflare.com/ajax/libs/shaka-player/3.3.1/controls.min.css']
]

// add scripts
scripts.forEach(script => {
  const scriptTag = document.createElement('script')
  scriptTag.src = script[0]
  document.head.appendChild(scriptTag)
})

// add css
css.forEach(css => {
  const cssTag = document.createElement('link')
  cssTag.href = css[0]
  cssTag.rel = 'stylesheet'
  document.head.appendChild(cssTag)
})

// body
const body = `
<!-- The data-shaka-player-container tag will make the UI library place the controls in this div.
     The data-shaka-player-cast-receiver-id tag allows you to provide a Cast Application ID that
     the cast button will cast to; the value provided here is the sample cast receiver. -->
<div id="player-container"
    class="justify-center"
         data-shaka-player-container
         data-shaka-player-cast-receiver-id="930DEB06">
        <!-- The data-shaka-player tag will make the UI library use this video element.
             If no video is provided, the UI will automatically make one inside the container div. -->
        <video data-shaka-player  id="video"  poster=""></video>
</div>
`
document.querySelector('#app').innerHTML = body

const posterUrl = "thumbnail.jpg"
let video

const isIOSDevice = () => {
  return !!navigator.userAgent && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// if MediaSource is not supported, switch to HLS
const getVideoManifest = () => {
  return window['MediaSource'] ? 'dash.mpd' : 'master.m3u8'
}

// shaka player
const initShakaPlayer = async () => {

  //console.log('Shake UI loaded')
  // When using the UI, the player is made automatically by the UI object.
  video = document.getElementById('video')
  // set poster
  video.setAttribute('poster', posterUrl)
  //video.setAttribute('style', "background-color: black;")

  const ui = video.ui
  const controls = ui.getControls()
  const player = controls.getPlayer()

  // Attach player and ui to the window to make it easy to access in the JS console.
  window.player = player
  window.ui = ui

  // config
  player.configure({
    abr: { // let it load a 3500 kbps version first
      defaultBandwidthEstimate: 10000000
    },
    streaming: {
      bufferingGoal: 4, // small buffers to enable quick quality switch
      rebufferingGoal: 2,
      bufferBehind: 20
    },
    manifest: {
      defaultPresentationDelay: 30
    }
  })

  // Listen for error events.
  player.addEventListener('error', onPlayerErrorEvent)
  player.addEventListener('buffering', (evt) => {
    if (!evt.buffering) {
      parent.postMessage('att-video-loaded', '*')
    }
  })
  controls.addEventListener('error', onUIErrorEvent)


  // Try to load a manifest.
  // This is an asynchronous process.
  try {
    //this.player.src = getVideoManifest()
    await player.load(getVideoManifest())
    // This runs if the asynchronous load is successful.
    //console.log('The video has now been loaded!')
    isIOSDevice() && video.play()

    //parent.postMessage('att-video-loaded', '*')
    // send player size
    resizePlayer()
    // init api
    initApi()
  } catch (error) {
    onPlayerError(error)
  }
}

const initFailed = (evt) => {
  // Handle the failure to load; errorEvent.detail.reasonCode has a
  // shaka.ui.FailReasonCode describing why.
  console.error('Unable to load the UI library!' + evt.detail)
  //console.log(evt)
}

const onPlayerErrorEvent = (evt) => {
  // Extract the shaka.util.Error object from the event.
  onPlayerError(evt.detail)
}

function onPlayerError(error) {
  // Handle player error
  console.error('Error code', error.code, 'object', error)
}

function onUIErrorEvent(evt) {
  // Extract the shaka.util.Error object from the event.
  onPlayerError(evt.detail)
}

const resizePlayer = () => {
  const videoContainer = window.document.querySelector('.shaka-video-container')
  videoContainer.style.height = `${window.innerHeight}px`
}

const getVideoSize = () => {
  const videoContainer = window.document.querySelector('.shaka-video-container')
  return {
    width: videoContainer.offsetWidth,
    height: videoContainer.offsetHeight,
    ratio: videoContainer.offsetWidth / videoContainer.offsetHeight
  }
}

const displayControls = (display) => {
  const controls = window.document.querySelector('.shaka-controls-container')
  if (display) {
    controls.setAttribute('shown', 'true')
  } else {
    controls.removeAttribute('shown')
  }
}

window.displayControls = displayControls
const initApi = () => {

  // listen for player size changes
  window.addEventListener('resize', resizePlayer)
  // listen from parent
  window.addEventListener('message', (event) => {
    console.log('message from parent', event.data)
    switch (event.data) {
      case 'att-video-play':
        video.play()
        break
      case 'att-video-size':
        parent.postMessage(getVideoSize(), '*')
        break
      case 'att-controls-display':
        displayControls(true)
        break
      case 'att-controls-hide':
        displayControls(false)
        break
      default:
        break
    }
  })
}

// shaka player events
// Listen to the custom shaka-ui-loaded event, to wait until the UI is loaded.
document.addEventListener('shaka-ui-loaded', initShakaPlayer)
// Listen to the custom shaka-ui-load-failed event, in case Shaka Player fails
// to load (e.g. due to lack of browser support).
document.addEventListener('shaka-ui-load-failed', initFailed)


