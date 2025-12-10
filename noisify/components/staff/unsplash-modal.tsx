'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Search, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { FunctionsHttpError } from '@supabase/supabase-js'

interface UnsplashPhoto {
  id: string
  width: number
  height: number
  color: string | null
  blur_hash: string | null
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  links: {
    download_location: string
    html: string
  }
  alt_description: string | null
  user: {
    name: string
    username: string
    links: {
      html: string
    }
  }
}

interface UnsplashModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  orgId: string
}

export default function UnsplashModal({ isOpen, onClose, onSelect, orgId }: UnsplashModalProps) {
  const [query, setQuery] = useState('')
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && photos.length === 0) {
      searchUnsplash('youth', 1)
    }
  }, [isOpen])

  async function searchUnsplash(searchQuery: string, pageNum: number) {
    if (!searchQuery) return
    setLoading(true)
    try {
      // Construct target URL for the proxy
      const target = encodeURIComponent(`https://api.unsplash.com/search/photos?query=${searchQuery}&page=${pageNum}&per_page=20&orientation=landscape`)

      // Call the proxy function with target param
      const { data, error } = await supabase.functions.invoke(`unsplash-proxy-2?target=${target}`, {
        method: 'GET'
      })

      if (error) throw error

      let results: UnsplashPhoto[] = []
      if (Array.isArray(data)) {
        results = data
      } else if (data && Array.isArray(data.results)) {
        results = data.results
      }

      if (pageNum === 1) {
        setPhotos(results)
      } else {
        setPhotos(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const newPhotos = results.filter(p => !existingIds.has(p.id))
          return [...prev, ...newPhotos]
        })
      }
      setHasMore(results.length > 0)
    } catch (err) {
      console.error('Unsplash search error:', err)

      if (err instanceof FunctionsHttpError) {
        const errorMessage = await err.context.json()
        console.error('Function error details:', errorMessage)
        toast.error(`Sökfel: ${errorMessage.error || 'Okänt fel i funktionen'}`)
      } else {
        toast.error('Kunde inte söka efter bilder')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    searchUnsplash(query, 1)
  }

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    searchUnsplash(query || 'youth', nextPage)
  }

  async function handleSelect(photo: UnsplashPhoto) {
    setSelecting(photo.id)
    try {
      // Prepare payload for download-and-store-unsplash
      const payload = {
        id: photo.id,
        download_location: photo.links.download_location,
        urls: photo.urls,
        credit: {
          name: photo.user.name,
          username: photo.user.username,
          html: photo.user.links.html
        },
        meta: {
          width: photo.width,
          height: photo.height,
          color: photo.color,
          blur_hash: photo.blur_hash
        },
        org_id: orgId,
        bucket: 'aktiviteter' // Optional: specify bucket if needed, function defaults to 'unsplash' or env
      }

      const { data, error } = await supabase.functions.invoke('download-and-store-unsplash', {
        body: payload
      })

      if (error) throw error

      // The function returns 'public_url' in the response
      if (data?.public_url) {
        onSelect(data.public_url)
        onClose()
      } else if (data?.assets && data.assets.length > 0) {
        // Fallback: check assets array
        const asset = data.assets.find((a: any) => a.variant === 'small' || a.variant === 'regular') || data.assets[0]
        if (asset && asset.publicUrl) {
          onSelect(asset.publicUrl)
          onClose()
        } else {
          throw new Error('No public URL in response')
        }
      } else {
        console.error('No public url returned', data)
        alert('Kunde inte ladda ner bild. Försök igen.')
      }

    } catch (err) {
      console.error('Select error:', err)

      if (err instanceof FunctionsHttpError) {
        const errorMessage = await err.context.json()
        console.error('Function error details:', errorMessage)
        toast.error(`Nedladdningsfel: ${errorMessage.error || 'Okänt fel i funktionen'}`)
      } else {
        toast.error('Kunde inte ladda ner bild')
      }

      // Mock success for testing/dev if backend fails
      // Use the Unsplash URL directly as public URL
      // onSelect(photo.urls.regular)
      // onClose()
    } finally {
      setSelecting(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Välj bild</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    setPage(1)
                    searchUnsplash(query, 1)
                  }
                }}
                placeholder="Sök (testa engelska för bättre resultat)..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPage(1)
                searchUnsplash(query, 1)
              }}
              className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              Sök
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map(photo => (
              <div
                key={photo.id}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-slate-100 shadow-sm hover:shadow-md transition-all ${selecting === photo.id ? 'ring-4 ring-indigo-600 ring-offset-2' : ''}`}
                onClick={() => handleSelect(photo)}
              >
                <Image
                  src={photo.urls.small}
                  alt={photo.alt_description || 'Unsplash Image'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                {selecting === photo.id && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white font-medium truncate block">by {photo.user.name}</span>
                </div>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1 bg-white text-slate-900 text-xs font-bold rounded shadow-sm hover:bg-slate-100">
                    Välj
                  </button>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          )}

          {!loading && hasMore && photos.length > 0 && (
            <div className="py-8 flex justify-center">
              <button onClick={loadMore} className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium shadow-sm transition-colors">
                Ladda fler bilder
              </button>
            </div>
          )}

          {!loading && photos.length === 0 && (
            <div className="text-center py-12 flex flex-col items-center text-slate-500">
              <Search className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-medium">Inga bilder hittades.</p>
              <p className="text-sm mt-1">Prova att söka efter något annat, t.ex. "summer", "sports", "music".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
