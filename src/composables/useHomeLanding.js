import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { loadRecentHomes, parseHomeId, saveRecentHome } from '../lib/recentHomes'
import { usePwaInstall } from './usePwaInstall'

export function useHomeLanding() {
  const router = useRouter()
  const createForm = ref({ name: '', totalBudget: '' })
  const joinId = ref('')
  const loading = ref(false)
  const error = ref('')
  const mode = ref('create')
  const recentHomes = ref([])
  const { canInstall, install: installPwa } = usePwaInstall()

  function refreshRecentHomes() {
    recentHomes.value = loadRecentHomes()
  }

  function openRecentHome(homeId) {
    if (!homeId) return
    saveRecentHome(recentHomes.value.find((home) => home.id === homeId) || { id: homeId })
    router.push(`/home/${homeId}`)
  }

  async function createHome() {
    if (!createForm.value.name.trim()) return
    loading.value = true
    error.value = ''

    const { data, error: err } = await supabase
      .from('homes')
      .insert({
        name: createForm.value.name.trim(),
        total_budget: parseFloat(createForm.value.totalBudget) || 0,
      })
      .select()
      .single()

    loading.value = false
    if (err) {
      error.value = err.message
      return
    }

    saveRecentHome(data)
    refreshRecentHomes()
    router.push(`/home/${data.id}`)
  }

  function joinHome() {
    if (!joinId.value.trim()) return
    const id = parseHomeId(joinId.value)
    if (!id) return
    saveRecentHome({ id })
    refreshRecentHomes()
    router.push(`/home/${id}`)
  }

  onMounted(refreshRecentHomes)

  return {
    createForm,
    joinId,
    loading,
    error,
    mode,
    recentHomes,
    canInstall,
    installPwa,
    openRecentHome,
    createHome,
    joinHome,
  }
}
