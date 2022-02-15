import './index.css'

const embedTemplate = `<iframe  width="560" height="315" src="{{baseURL}}/embed.html" title="{{title}}" frameborder="0" 
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
</iframe>
`

const getIframe = () => {
  return window.document.querySelector('#iVideo')
}

const getMain = () => {
  return window.document.querySelector('main')
}

const getBaseUrl = () => {
  return window.location.href.split('?', 1)[0].split('/').slice(0, -1).join('/')
}

/**
 * String.prototype.replaceAll() polyfill
 * https://gomakethings.com/how-to-replace-a-section-of-a-string-with-another-one-with-vanilla-js/
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (str, newStr) {
    // If a regex pattern
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
      return this.replace(str, newStr)
    }
    // If a string
    return this.replace(new RegExp(str, 'g'), newStr)
  }
}

const hydrateHtml = () => {
  const title = window.document.querySelector('title').innerText
  let embed = embedTemplate.replaceAll('{{baseURL}}', getBaseUrl())
  embed = embed.replaceAll('{{title}}', title)
  const dashLink = getBaseUrl() + '/dash.mpd'
  window.document.querySelector('#embed-code').innerHTML = embed.replaceAll('<', '&lt').replaceAll('>', '&gt')
  window.document.querySelector('#dash-link').innerHTML = dashLink
}

const handleMessage = (event) => {
  if (event.data === 'att-video-loaded') {
    //getMain().classList.remove('opacity-0')
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


