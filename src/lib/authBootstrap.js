import { supabase } from './supabaseClient'
import { setAuth } from '../store/slices/authSlice'

export async function authBootstrap({ dispatch, email, password }) {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError || !signInData?.session || !signInData?.user) {
    console.log(signInError)
    return { ok: false, error: 'Invalid credentials' }
  }

  const user = signInData.user
  const session = signInData.session

  const { data: labs, error: labsError } = await supabase
    .from('labs')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (labsError || !labs) {
    return { ok: false, error: 'No lab profile found' }
  }

  const { data: availability, error: availError } = await supabase
    .from('lab_availability')
    .select('*')
    .eq('lab_id', labs.id)
    .order('day_of_week', { ascending: true })
    .order('open_time', { ascending: true })

  if (availError) {
    return { ok: false, error: 'Failed to fetch availability' }
  }

  const { data: services, error: servicesError } = await supabase
    .from('lab_services')
    .select('*')
    .eq('lab_id', labs.id)
    .order('created_at', { ascending: false })

  if (servicesError) {
    return { ok: false, error: 'Failed to fetch services' }
  }

  dispatch(
    setAuth({
      session,
      user,
      labProfile: labs,
      labAvailability: availability || [],
      labServices: services || [],
    })
  )

  return { ok: true }
}

export async function authBootstrapFromSession({ dispatch }) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const session = sessionData?.session || null
  if (sessionError || !session?.user) {
    return { ok: false, error: 'No active session' }
  }

  const user = session.user

  const { data: labs, error: labsError } = await supabase
    .from('labs')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (labsError || !labs) {
    await supabase.auth.signOut()
    return { ok: false, error: 'No lab profile found' }
  }

  const { data: availability, error: availError } = await supabase
    .from('lab_availability')
    .select('*')
    .eq('lab_id', labs.id)
    .order('day_of_week', { ascending: true })
    .order('open_time', { ascending: true })

  if (availError) {
    await supabase.auth.signOut()
    return { ok: false, error: 'Failed to fetch availability' }
  }

  const { data: services, error: servicesError } = await supabase
    .from('lab_services')
    .select('*')
    .eq('lab_id', labs.id)
    .order('created_at', { ascending: false })

  if (servicesError) {
    await supabase.auth.signOut()
    return { ok: false, error: 'Failed to fetch services' }
  }

  dispatch(
    setAuth({
      session,
      user,
      labProfile: labs,
      labAvailability: availability || [],
      labServices: services || [],
    })
  )

  return { ok: true }
}
