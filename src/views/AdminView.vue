<template>
  <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

    <!-- Header -->
    <header class="space-y-1 animate-fade-in">
      <p class="font-mono text-xs text-garden-dim uppercase tracking-widest">
        System · Admin Panel
      </p>
      <h1 class="font-display text-3xl sm:text-4xl font-semibold text-garden-text">
        User Management
      </h1>
      <p class="text-sm text-garden-dim max-w-xl">
        All registered users. Promote to admin, demote to viewer, or remove from system.
        Role changes take effect on the user's next page load.
      </p>
    </header>

    <!-- Stats -->
    <section class="grid grid-cols-3 gap-3 animate-fade-in" style="animation-delay:80ms">
      <div class="rounded-xl border border-garden-border bg-garden-surface px-4 py-3 space-y-0.5">
        <div class="text-[10px] font-mono text-garden-dim uppercase tracking-widest">Total Users</div>
        <div class="font-mono font-medium text-2xl text-garden-text">{{ users.length }}</div>
      </div>
      <div class="rounded-xl border border-garden-border bg-garden-surface px-4 py-3 space-y-0.5">
        <div class="text-[10px] font-mono text-garden-dim uppercase tracking-widest">Admins</div>
        <div class="font-mono font-medium text-2xl text-garden-tomato">
          {{ users.filter(u => u.role === 'admin').length }}
        </div>
      </div>
      <div class="rounded-xl border border-garden-border bg-garden-surface px-4 py-3 space-y-0.5">
        <div class="text-[10px] font-mono text-garden-dim uppercase tracking-widest">Viewers</div>
        <div class="font-mono font-medium text-2xl text-garden-okra">
          {{ users.filter(u => u.role === 'viewer').length }}
        </div>
      </div>
    </section>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex items-center gap-3 text-garden-dim font-mono text-sm py-12 justify-center"
    >
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
        <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Loading users…
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="text-garden-danger font-mono text-sm py-8 text-center">
      {{ fetchError }}
    </div>

    <!-- Empty -->
    <div v-else-if="!users.length" class="text-garden-dim font-mono text-sm py-8 text-center">
      No users found in /users.
    </div>

    <!-- User table -->
    <section
      v-else
      class="animate-slide-up rounded-2xl border border-garden-border overflow-hidden"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-garden-card border-b border-garden-border">
            <th class="text-left px-5 py-3 font-mono text-[10px] text-garden-dim uppercase tracking-widest">
              User
            </th>
            <th class="text-left px-5 py-3 font-mono text-[10px] text-garden-dim uppercase tracking-widest
                       hidden md:table-cell">
              Last Login
            </th>
            <th class="text-left px-5 py-3 font-mono text-[10px] text-garden-dim uppercase tracking-widest">
              Role
            </th>
            <th class="text-right px-5 py-3 font-mono text-[10px] text-garden-dim uppercase tracking-widest">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.uid"
            class="border-b border-garden-border last:border-0 bg-garden-surface
                   hover:bg-garden-card transition-colors"
            :class="{ 'opacity-60': user.uid === currentUser?.uid }"
          >
            <!-- User info -->
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-garden-base border border-garden-border
                            flex items-center justify-center text-sm font-medium font-mono
                            text-garden-dim flex-shrink-0">
                  {{ (user.displayName || user.email || '?')[0].toUpperCase() }}
                </div>
                <div>
                  <div class="font-sans font-medium text-garden-text text-sm">
                    {{ user.displayName || '—' }}
                    <span
                      v-if="user.uid === currentUser?.uid"
                      class="ml-1 font-mono text-[9px] text-garden-dim uppercase tracking-wider"
                    >
                      (you)
                    </span>
                  </div>
                  <div class="font-mono text-[11px] text-garden-dim">{{ user.email }}</div>
                </div>
              </div>
            </td>

            <!-- Last login -->
            <td class="px-5 py-4 hidden md:table-cell">
              <span class="font-mono text-xs text-garden-dim">
                {{ formatDate(user.lastLogin) }}
              </span>
            </td>

            <!-- Role badge -->
            <td class="px-5 py-4">
              <span
                class="inline-flex px-2.5 py-1 rounded-full font-mono text-[10px]
                       uppercase tracking-widest font-medium"
                :class="user.role === 'admin'
                  ? 'bg-garden-tomato/10 text-garden-tomato border border-garden-tomato/20'
                  : 'bg-garden-okra/10 text-garden-okra border border-garden-okra/20'"
              >
                {{ user.role ?? 'viewer' }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-5 py-4 text-right">
              <div class="flex items-center justify-end gap-2">

                <button
                  v-if="user.role !== 'admin'"
                  class="font-mono text-[11px] px-3 py-1.5 rounded-lg border
                         border-garden-tomato/40 text-garden-tomato
                         hover:bg-garden-tomato/10 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="actionTarget === user.uid || user.uid === currentUser?.uid"
                  @click="changeRole(user, 'admin')"
                >
                  <span v-if="actionTarget === user.uid">…</span>
                  <span v-else>Promote</span>
                </button>

                <button
                  v-else
                  class="font-mono text-[11px] px-3 py-1.5 rounded-lg border
                         border-garden-border text-garden-dim hover:bg-garden-card
                         transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="actionTarget === user.uid || user.uid === currentUser?.uid"
                  @click="changeRole(user, 'viewer')"
                >
                  <span v-if="actionTarget === user.uid">…</span>
                  <span v-else>Demote</span>
                </button>

                <button
                  class="font-mono text-[11px] px-3 py-1.5 rounded-lg border
                         border-garden-danger/40 text-garden-danger
                         hover:bg-garden-danger/10 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="actionTarget === user.uid || user.uid === currentUser?.uid"
                  @click="confirmDelete(user)"
                >
                  Remove
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
               justify-center z-50 p-4"
        @click.self="deleteTarget = null"
      >
        <div class="bg-garden-surface border border-garden-border rounded-2xl
                    shadow-card max-w-sm w-full p-6 space-y-4 animate-slide-up">
          <h3 class="font-display font-semibold text-lg text-garden-text">Remove User?</h3>
          <p class="text-sm text-garden-dim">
            This will remove
            <strong class="text-garden-text">
              {{ deleteTarget.displayName || deleteTarget.email }}
            </strong>
            from the system. They will lose access on their next page load.
            Their Firebase Auth account is not deleted.
          </p>
          <div class="flex gap-3 pt-2">
            <button
              class="flex-1 py-2.5 rounded-xl border border-garden-border font-sans text-sm
                     text-garden-dim hover:bg-garden-card transition-colors"
              @click="deleteTarget = null"
            >
              Cancel
            </button>
            <button
              class="flex-1 py-2.5 rounded-xl bg-garden-danger text-white font-sans
                     font-medium text-sm hover:opacity-90 transition-colors
                     disabled:opacity-50"
              :disabled="actionTarget === deleteTarget?.uid"
              @click="removeUser(deleteTarget)"
            >
              <span v-if="actionTarget === deleteTarget?.uid">Removing…</span>
              <span v-else>Yes, Remove</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted }           from 'vue'
import { db }                                     from '@/firebase'
import { useAuth }                                from '@/auth/useAuth'
import { ref as dbRef, onValue, off, set, remove } from 'firebase/database'

const { currentUser } = useAuth()

const users        = ref([])
const loading      = ref(true)
const fetchError   = ref('')
const actionTarget = ref(null)
const deleteTarget = ref(null)

let usersRef = null

onMounted(() => {
  usersRef = dbRef(db, 'users')
  onValue(
    usersRef,
    (snapshot) => {
      const raw = snapshot.val()
      if (!raw) { users.value = []; loading.value = false; return }

      users.value = Object.entries(raw)
        .map(([uid, data]) => ({ uid, ...data }))
        .filter(u => u.role === 'admin' || u.role === 'viewer')
        .sort((a, b) => {
          if (a.role === b.role) return (a.email ?? '').localeCompare(b.email ?? '')
          return a.role === 'admin' ? -1 : 1
        })

      loading.value  = false
      fetchError.value = ''
    },
    () => {
      loading.value    = false
      fetchError.value = 'Failed to load users. Ensure you are an admin and RTDB rules allow /users reads.'
    }
  )
})

onUnmounted(() => { if (usersRef) off(usersRef) })

async function changeRole(user, newRole) {
  if (user.uid === currentUser.value?.uid) return
  actionTarget.value = user.uid
  try {
    await set(dbRef(db, `users/${user.uid}/role`), newRole)
  } catch (err) {
    console.error('Role change failed:', err)
    alert('Role change failed. Check console.')
  } finally {
    actionTarget.value = null
  }
}

function confirmDelete(user) {
  deleteTarget.value = user
}

async function removeUser(user) {
  if (user.uid === currentUser.value?.uid) return
  actionTarget.value = user.uid
  try {
    await remove(dbRef(db, `users/${user.uid}`))
    deleteTarget.value = null
  } catch (err) {
    console.error('Remove user failed:', err)
    alert('Remove failed. Check console and RTDB rules.')
  } finally {
    actionTarget.value = null
  }
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>
