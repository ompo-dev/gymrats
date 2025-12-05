"use client"

import { useState } from "react"
import { mockFriends, searchUsers } from "@/lib/social-data"
import type { Friend } from "@/lib/types"
import { Search, UserPlus, MessageCircle, Trophy } from "lucide-react"

export function FriendsList() {
  const [friends] = useState(mockFriends.filter((f) => f.status === "mutual"))
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [showSearch, setShowSearch] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length > 0) {
      setSearchResults(searchUsers(query))
      setShowSearch(true)
    } else {
      setShowSearch(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Amigos</h1>
        <p className="text-sm text-duo-gray-dark">{friends.length} amigos conectados</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-duo-gray-dark" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar amigos..."
          className="w-full rounded-xl border-2 border-duo-gray-border py-3 pl-12 pr-4 font-bold text-duo-text placeholder:text-duo-gray-light focus:border-duo-blue focus:outline-none"
        />
      </div>

      {showSearch && searchResults.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-bold text-duo-gray-dark">Resultados da busca</div>
          {searchResults.map((user) => (
            <FriendCard key={user.id} friend={user} />
          ))}
        </div>
      )}

      {!showSearch && (
        <div className="space-y-2">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      )}
    </div>
  )
}

function FriendCard({ friend }: { friend: Friend }) {
  return (
    <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-4 transition-all hover:border-duo-blue hover:shadow-lg">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-duo-blue/20 text-2xl font-bold text-duo-blue">
            {friend.name[0]}
          </div>
          {friend.isOnline && (
            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-duo-green" />
          )}
        </div>

        <div className="flex-1">
          <div className="mb-1 font-bold text-duo-text">{friend.name}</div>
          <div className="text-xs text-duo-gray-dark">@{friend.username}</div>
        </div>

        {friend.status !== "mutual" && (
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-duo-green text-white transition-all hover:bg-duo-green/80">
            <UserPlus className="h-5 w-5" />
          </button>
        )}

        {friend.status === "mutual" && (
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-duo-blue text-white transition-all hover:bg-duo-blue/80">
            <MessageCircle className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 rounded-lg bg-duo-gray-light p-3 text-sm">
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-duo-yellow" />
          <span className="font-bold text-duo-text">Nível {friend.level}</span>
        </div>
        <div className="h-4 w-px bg-duo-gray-border" />
        <div className="flex items-center gap-1">
          <span className="text-xl">🔥</span>
          <span className="font-bold text-duo-text">{friend.currentStreak} dias</span>
        </div>
        <div className="h-4 w-px bg-duo-gray-border" />
        <div>
          <span className="font-bold text-duo-green">{friend.weeklyXP} XP</span>
          <span className="text-duo-gray-dark"> esta semana</span>
        </div>
      </div>
    </div>
  )
}
