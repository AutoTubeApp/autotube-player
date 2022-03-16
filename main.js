import './src/index.css'

const getBaseUrl = () => {
  return window.location.href.split('?', 1)[0].split('/').slice(0, -1).join('/')
}

// in dev mode we need to replace iframe.src from ##baseUrl## to p/
if (import.meta.env.DEV) {
  console.debug('development mode')
  window.addEventListener('load', () => {
    const iframe = document.querySelector('iframe')
    iframe.src =  '/p/'
  })
}

const hydrateHtml = () => {
  const baseUrl = getBaseUrl()
  document.getElementById('social-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${baseUrl}`
  document.getElementById('social-tw').href = `https://twitter.com/intent/tweet?url=${baseUrl}`
}

const logElm = document.getElementById('log')
const bwInElem = document.getElementById('bw-in')
const bwOutElem = document.getElementById('bw-out')

const updateMonitor = (data) => {
  logElm.innerHTML = `Connected to ${data.peersConnected} peers`
  bwInElem.innerHTML = `${data.deltaIn / 2}<span class="text-xl">&#8595;</span>`
  bwOutElem.innerHTML = `<span class="text-xl">&#8593;</span>${data.deltaOut / 2}`
}

const handleMessage = (event) => {
  console.debug('message received', event.data)
  switch (event.data.type) {
    case 'att-video-loaded':
      break
    case 'att-player-size':
      document.getElementById('iVideo').style.height = `${event.data.height}px`
      break
    case 'att-ipfs-available':
      document.getElementById('monitor').classList.remove('hidden')
      break
    case 'monitoring':
      updateMonitor(event.data.data)
      break
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


/**
 * String.prototype.replaceAll() polyfill
 * https://gomakethings.com/how-to-replace-a-section-of-a-string-with-another-one-with-vanilla-js/
 * @author Chris Ferdinandi
 * @license MIT
 */
/*if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (str, newStr) {
    // If a regex pattern
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
      return this.replace(str, newStr)
    }
    // If a string
    return this.replace(new RegExp(str, 'g'), newStr)
  }
}*/
