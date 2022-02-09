import './index.css'

const embedTemplate = `<iframe  width="{{width}}" height="{{height}}" src="{{baseURL}}/embed.html" title="{{title}}" frameborder="0" 
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
</iframe>
`

const getIframe = () => {
    return window.document.querySelector('#iVideo')
}

const getMain = () => {
    return window.document.querySelector('main')
}

const getPlayerContainer = () => {
    return getIframe().contentWindow.document.querySelector('#player-container')
}

const getBaseUrl = () => {
    return window.location.href.split('?', 1)[0].split('/').slice(0, -1).join('/')
}

function handleIframeLoaded() {
    getPlayerContainer().setAttribute('style', 'max-height:700px;')
}

const resizeIframe = (playerSize) => {
    getIframe().style.height = `${playerSize.height}px`
}

const hydrateHtml = () => {
    const title = window.document.querySelector('title').innerText
    const width = getIframe().clientWidth.toString()
    const height = getIframe().clientHeight.toString()
    let embed = embedTemplate.replaceAll('{{baseURL}}', getBaseUrl())
    embed = embed.replaceAll('{{title}}', title)
    embed = embed.replaceAll('{{width}}', width)
    embed = embed.replaceAll('{{height}}', height)

    const dashLink = getBaseUrl() + '/dash.mpd'

    window.document.querySelector('#embed-code').innerHTML = embed.replaceAll('<', '&lt').replaceAll('>', '&gt')
    window.document.querySelector('#dash-link').innerHTML = dashLink

}

const handleMessage = (event) => {
    if (event.data.type === 'player-size') {
        resizeIframe(event.data)
    }
    if (event.data === 'att-video-loaded') {
        getMain().classList.remove('opacity-0')
    }
}

// main
window.addEventListener('message', handleMessage)

//dark mode
const selectElement = window.document.querySelector('#toggle-dark-mode')
selectElement.addEventListener('change', (evt) => {
    const result = document.querySelector('html')
    if (evt.target.checked) {
        result.classList.add('dark')
    } else {
        result.classList.remove('dark')
    }
})

// hydrate html
hydrateHtml()

// export (kind of)
window.handleIframeLoaded = handleIframeLoaded



