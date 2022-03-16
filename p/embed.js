import '../src/index.css'

import addPlugin from "../src/ipfs_plugin"

const posterUrl = "thumbnail.jpg"
let nbScriptLoaded = 0
let videoRatio = null
let video

// load scripts dynamically ?
const dynamicLoading = new URLSearchParams(window.location.search).get('dyn')
if (dynamicLoading === null) {
  console.debug('loading static scripts')
} else {
  console.debug('loading dynamic')
}
// scripts to load
let scriptsToLoad = [
  'shaka-player.compiled.js',
  'shaka-player.ui.min.js',
  'cast_sender.js',
  'options.js',
]

// if this video is served from IPFS gateway, we need to add IPFS scripts
const location = window.location.href
//const location = "https://ipfs.autotube.app/ipfs/bafybeibnkk2kwafzvwiuxckhn7wtrui27pbijx33mmgfed3x2nqe27qnma/embed.html"
//const location = "https://ipfs.autotube.app/ipfs/QmbyaCE68VeYgmiyB7SqPm3GKiatAMzhP4oBHZGj4mD5ue/embed.html"
const isAvailableThroughIPFS = () => {
  return location.includes('/ipfs/')
}
if (isAvailableThroughIPFS()) {
  // Add IPFS scripts
  scriptsToLoad.push('ipfs.min.js')
}

// loader watcher: wait for all scripts to be loaded before launching init
window.addEventListener('att-script-loaded', async () => {
  nbScriptLoaded++
  console.debug('script loaded: ', nbScriptLoaded)
  // if all scripts are loaded, we can launch init()
  const nbScriptsToLoad = scriptsToLoad.length
  if (nbScriptLoaded === nbScriptsToLoad) {
    console.debug('all scripts loaded, launching init()')
    await init()
  }
})

// add scripts tags to the page
scriptsToLoad.forEach(script => {
  const scriptTag = document.createElement('script')
  scriptTag.addEventListener('load', () => {
    console.debug('script loaded: ', script)
    window.dispatchEvent(new Event('att-script-loaded'))
  })
  scriptTag.async = false
  scriptsToLoad.crossOrigin = true
  // ! options.js must be loaded from the same origin as the page
  if (script === 'options.js') {
    scriptTag.src = script
  } else {
    scriptTag.src = dynamicLoading === null ? script : `https://player.autotube.app/p/${script}`
  }
  document.head.appendChild(scriptTag)
})

// add css tags
const css = [
  'index.css',
  'controls.min.css'
]
css.forEach(css => {
  const cssTag = document.createElement('link')
  cssTag.href = dynamicLoading === null ? css : `//player.autotube.app/p/${css}`
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


// init launched when all scripts are loaded
const init = async () => {
  // IPFS
  if (isAvailableThroughIPFS()) {
    // Send message to parent
    parent.postMessage({type: 'att-ipfs-available'}, '*')
    try {
      await initIpfs()
    } catch (e) {
      console.error("ipfs initialization failed", e)
    }
  }

  // add IPFS plugin to shaka player if available
  if (isAvailableThroughIPFS()) {
    addPlugin(window.shaka)
    console.debug('Shaka Ipfs plugin loaded')
  }

  // wait for shaka player UI to be loaded
  /*  console.debug("wait for shaka player to be loaded")
    await waitForShakaPlayerUiToBeLoaded()
    console.debug('shaka player ui loaded')*/


  // Install built-in polyfills to patch browser incompatibilities.
  // await window.shaka.polyfill.installAll()
  /*console.debug('sleep for 1 seconds')
  await sleep(1000)*/

  // Check to see if the browser supports the basic APIs Shaka needs.
  if (window.shaka.Player.isBrowserSupported()) {
    // Everything looks good!
    await initPlayer();
  } else {
    // This browser does not have the minimum set of APIs we need.
    console.error('Browser not supported!')
    alert('Browsers not supported!')
  }
}

const initIpfs = async () => {
  console.debug('Init IPFS')
  // drop indexDB randomly
  /*  const rand = Math.floor(Math.random() * (10))
    if (rand === 1) {
      window.indexedDB.databases().then(async (r) => {
        for (let i = 0; i < r.length; i++) await window.indexedDB.deleteDatabase(r[i].name)
      })
    }*/

  const node = await window.Ipfs.create({
    config: {
      Addresses: {
        Swarm: [
          // This is a public webrtc-star server
          //'/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
          //'/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
          '/dns4/murmuring-beach-38638.herokuapp.com/tcp/443/wss/p2p-webrtc-star',
          '/dns4/autotubegforvqyq-webrtcstarsignaling.functions.fnc.fr-par.scw.cloud/tcp/443/wss/p2p-webrtc-star',
          //'/dns4/wrtc-star1.autotube.app/tcp/443/wss/p2p-webrtc-star',
          //'/dns4/wrtc-star2.autotube.app/tcp/443/wss/p2p-webrtc-star',
          '/ip4/149.202.186.124/tcp/4001/p2p/Qmap4PMiDfaGuPgnoQD4qADd9g4UD1Uvb2vKewNdQGtUrW'
        ]
      }
    }
  })

  console.debug('IPFS node created')

  const info = await node.id()
  console.debug('IPFS node id', info.id)

  // Connect to peer separately to handle connection errors
  try {
    console.debug('Connecting to AutoTube peer')
    await node.swarm.connect('/dns4/ipfs.autotube.app/tcp/443/wss/p2p/Qmap4PMiDfaGuPgnoQD4qADd9g4UD1Uvb2vKewNdQGtUrW')
    console.debug('Connected to AutoTube peer')
    await node.swarm.connect(`/dns4/${options.hostname}/tcp/443/wss/p2p/${options.peerId}`)
    console.debug(`Connected to ${options.hostname} ${options.peerId} peer`)
  } catch (e) {
    console.error('Failed to connect to peer', e)
  }
  sendMonitoring(node)
  window.node = node
}

const initPlayer = async () => {
  // init shaka
  //console.log('Shake UI loaded')
  // When using the UI, the player is made automatically by the UI object.
  video = document.getElementById('video')
  // set poster
  video.setAttribute('poster', posterUrl)

  const ui = video.ui
  const controls = ui.getControls()
  const player = controls.getPlayer()

  // Attach player and ui to the window to make it easy to access in the JS console.
  window.player = player
  window.ui = ui

  // config
  // https://shaka-player-demo.appspot.com/docs/api/shaka.extern.html#.RetryParameters
  const retryParameters = {
    "maxAttempts": 4,
    "baseDelay": 6000,
    "backoffFactor": 2,
    "fuzzFactor": 0.5,
    "timeout": 150000,
    "stallTimeout": 10000,
    "connectionTimeout": 40000
  }
  player.configure({
    abr: { // let it load a 3500 kbps version first
      defaultBandwidthEstimate: 10000000
    },
    streaming: {
      bufferingGoal: 4, // small buffers to enable quick quality switch
      rebufferingGoal: 2,
      bufferBehind: 20,
      retryParameters
    },
    manifest: {
      defaultPresentationDelay: 30,
      retryParameters
    }
  })

  // Listen for error events.
  //player.addEventListener('error', onPlayerErrorEvent)
  player.addEventListener('buffering', (evt) => {
    if (!evt.buffering) {
      parent.postMessage({type: 'att-video-loaded'}, '*')
    }
  })
  controls.addEventListener('error', onUIErrorEvent)


  // Try to load a manifest.
  // This is an asynchronous process.
  try {
    const manifest = getVideoManifest()
    //console.debug('manifest', manifest)
    await player.load(manifest)
    // This runs if the asynchronous load is successful.
    //console.log('The video has now been loaded!')
    isIOSDevice() && video.play()
    // resize && send player size
    await resizePlayer()
    initApi()
  } catch (error) {
    onPlayerError(error)
  }
}

function onPlayerError(error) {
  // Handle player error
  console.error('Error code', error.code, 'object', error)
  // bad solution, but it works
  //window.location.reload()
}

function onUIErrorEvent(evt) {
  // Extract the shaka.util.Error object from the event.
  onPlayerError(evt.detail)
}

const isIOSDevice = () => {
  return !!navigator.userAgent && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// if MediaSource is not supported, switch to HLS
const getVideoManifest = () => {
  if (isAvailableThroughIPFS()) {
    // get cid
    const cid = location.split('/ipfs/')[1].split('/')[0]
    return window['MediaSource'] ? `ipfs://${cid}/dash.mpd` : `ipfs://${cid}/master.m3u8`
  }
  return window['MediaSource'] ? 'dash.mpd' : 'master.m3u8'
}

const getVideoRatio = () => {
  if (typeof (videoRatio) === 'number') {
    return videoRatio
  }
  const stats = document.getElementById('video').ui.getControls().getPlayer().getStats()
  videoRatio = stats.width / stats.height
  return videoRatio
}

const resizePlayer = async () => {

  const ratio = getVideoRatio()
  const videoContainer = document.getElementById('player-container')
  videoContainer.style.height = `${window.innerWidth / ratio}px`
  // send player size to parent to resize iframe
  parent.postMessage({type: 'att-player-size', width: videoContainer.offsetWidth , height: videoContainer.offsetHeight}, '*')
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

// send monitor event to parent
const sendMonitoring = (node) => {
  let prevBwStats = null
  let deltaIn = 0, deltaOut = 0
  setInterval(async () => {
    const peersConnected = await node.swarm.peers()
    for await (const bwStats of node.stats.bw()) {
      console.debug(`Total in: ${bwStats.totalIn} bytes - out: ${bwStats.totalOut} bytes`)
      if (prevBwStats !== null) {
        // eslint-disable-next-line no-undef
        deltaIn = (bwStats.totalIn - prevBwStats.totalIn) / BigInt(1000)
        // eslint-disable-next-line no-undef
        deltaOut = (bwStats.totalOut - prevBwStats.totalOut) / BigInt(1000)
      }
      prevBwStats = bwStats
    }
    const message = {
      type: 'monitoring',
      data: {
        peersConnected: peersConnected.length,
        deltaIn: Number(deltaIn),
        deltaOut: Number(deltaOut)
      }
    }
    parent.postMessage(message, '*')
  }, 2000)
}

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
