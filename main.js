import 'normalize.css'

// head
const scripts = [
    ['https://cdnjs.cloudflare.com/ajax/libs/shaka-player/3.0.10/shaka-player.compiled.js'],
    ['https://cdnjs.cloudflare.com/ajax/libs/shaka-player/3.0.10/shaka-player.ui.min.js'],
    ['https://www.gstatic.com/cv/js/sender/v1/cast_sender.js']
]

const css = [
    ['https://cdnjs.cloudflare.com/ajax/libs/shaka-player/3.0.10/controls.min.css']
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
const body= `
<!-- The data-shaka-player-container tag will make the UI library place the controls in this div.
     The data-shaka-player-cast-receiver-id tag allows you to provide a Cast Application ID that
     the cast button will cast to; the value provided here is the sample cast receiver. -->
<div id="player-container"
         data-shaka-player-container
         data-shaka-player-cast-receiver-id="930DEB06">
        <!-- The data-shaka-player tag will make the UI library use this video element.
             If no video is provided, the UI will automatically make one inside the container div. -->
        <video data-shaka-player  id="video"  poster=""></video>
</div>
`

document.querySelector('#app').innerHTML = body

// shaka player
const initShakaPlayer = (evt) => {
    console.log('Shake UI loaded')
    console.log(evt)
}

const initFailed = (evt) => {
    // Handle the failure to load; errorEvent.detail.reasonCode has a
    // shaka.ui.FailReasonCode describing why.
    console.error('Unable to load the UI library!')
    console.log(evt)
}

// shaka player events
// Listen to the custom shaka-ui-loaded event, to wait until the UI is loaded.
document.addEventListener('shaka-ui-loaded', initShakaPlayer)
// Listen to the custom shaka-ui-load-failed event, in case Shaka Player fails
// to load (e.g. due to lack of browser support).
document.addEventListener('shaka-ui-load-failed', initFailed)
