import { create } from 'zustand'

export interface Account {
  id: string
  name: string
  color: string
  order: number
}

interface AccountStore {
  accounts:     Account[]
  activeId:     string | null
  badges:       Record<string, number>
  setAccounts:  (accounts: Account[]) => void
  setActiveId:  (id: string | null) => void
  setBadge:     (id: string, count: number) => void
  addAccount:   (account: Account) => void
  removeAccount:(id: string) => void
}

export const useAccountStore = create<AccountStore>((set) => ({
  accounts:  [],
  activeId:  null,
  badges:    {},

  setAccounts:   (accounts) => set({ accounts }),
  setActiveId:   (id)       => set({ activeId: id }),
  setBadge:      (id, count)=> set((s) => ({ badges: { ...s.badges, [id]: count } })),
  addAccount:    (account)  => set((s) => ({ accounts: [...s.accounts, account] })),
  removeAccount: (id)       => set((s) => ({ accounts: s.accounts.filter(a => a.id !== id) })),
}))
