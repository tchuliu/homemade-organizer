import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const canInstall = ref(false)

let handlerSetUp = false

export function usePwaInstall() {
  function setup() {
    if (handlerSetUp) return
    handlerSetUp = true

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
    })

    window.addEventListener('appinstalled', () => {
      deferredPrompt.value = null
      canInstall.value = false
    })
  }

  async function install() {
    const prompt = deferredPrompt.value
    if (!prompt) return

    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      deferredPrompt.value = null
      canInstall.value = false
    }
  }

  onMounted(setup)

  return { canInstall, install }
}
