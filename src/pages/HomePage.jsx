import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import useComparisonStore from '../store/comparisonStore'

const POWERTRAIN_FILTERS = ['Alle', 'Elektro', 'Benzin', 'Diesel', 'Hybrid']
const POWERTRAIN_MAP = {
  Alle: '',
  Elektro: 'electric',
  Benzin: 'gasoline',
  Diesel: 'diesel',
  Hybrid: 'hybrid',
}

const formatPrice = (price) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)

export default function HomePage() {
  const navigate = useNavigate()
  const { allCars, loadCars, addCar, clearCars } = useComparisonStore()

  const [selectedPowertrain, setSelectedPowertrain] = useState('Alle')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [sortBy, setSortBy] = useState('commonality')
  const [sortDir, setSortDir] = useState('desc')
  const inputRef = useRef(null)

  useEffect(() => {
    loadCars()
  }, [])

  const fuse = useMemo(
    () => new Fuse(allCars, { keys: ['name'], threshold: 0.3 }),
    [allCars]
  )

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.length > 0) {
      setSearchResults(fuse.search(query).map(r => r.item))
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const selectCar = (car) => {
    clearCars()
    addCar(car)
    navigate('/compare')
  }

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  const sortIndicator = (column) => sortBy === column ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const getPerformanceCategory = (rating) => {
    if (rating < 10) return { label: 'Niedrig', color: 'bg-red-100 text-red-700' }
    if (rating < 15) return { label: 'Mittel', color: 'bg-blue-100 text-blue-700' }
    if (rating < 21) return { label: 'Gut', color: 'bg-green-100 text-green-700' }
    return { label: 'Krass', color: 'bg-violet-100 text-violet-700' }
  }

  const filteredCars = useMemo(() => {
    let cars = allCars
    if (selectedPowertrain !== 'Alle') {
      const type = POWERTRAIN_MAP[selectedPowertrain]
      cars = cars.filter(c => c.powertrainType === type)
    }
    return [...cars].sort((a, b) => {
      let aVal, bVal
      if (sortBy === 'name') { aVal = a.name; bVal = b.name }
      else if (sortBy === 'ps') { aVal = a.ps; bVal = b.ps }
      else if (sortBy === '0-100') { aVal = a.acceleration?.['0_100'] ?? 999; bVal = b.acceleration?.['0_100'] ?? 999 }
      else if (sortBy === 'autobahnPerformanceRating') { aVal = a.autobahnPerformanceRating; bVal = b.autobahnPerformanceRating }
      else if (sortBy === 'price') { aVal = a.price; bVal = b.price }
      else if (sortBy === 'commonality') { aVal = a.commonality; bVal = b.commonality }
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [allCars, selectedPowertrain, sortBy, sortDir])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16">

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight mb-2">
            Bin ich schnell?
          </h1>
          <p className="text-base text-zinc-500">
            Du willst wissen, wie schnell du auf der Autobahn bist. Wir sagen es dir.<br/>
            Realistisch. Keine 0-100 Drag Race Vergleiche unter Idealbedingungen.<br/>
            Brutal ehrlich.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onFocus={() => searchQuery && setShowDropdown(true)}
              placeholder="Dein Auto suchen... z.B. BMW 3er"
              className="w-full pl-12 pr-5 py-4 border-2 border-zinc-200 rounded-xl text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-600 transition-colors bg-white"
            />
          </div>

          {/* Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl z-10 overflow-hidden">
              {searchResults.map(car => (
                <button
                  key={car.id}
                  onMouseDown={() => selectCar(car)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0 text-left"
                >
                  <span className="font-semibold text-zinc-900">{car.name}</span>
                  <span className="text-sm text-zinc-400 tabular-nums">
                    {car.ps} PS &nbsp;·&nbsp; {car.acceleration?.['0_100']}s 0–100
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Powertrain Filters */}
        <div className="flex flex-wrap gap-2 mb-12">
          {POWERTRAIN_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setSelectedPowertrain(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedPowertrain === f
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Section Label */}
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Beliebte Autos
        </p>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-zinc-100">
              {[
                { key: 'name', label: 'Auto', align: 'text-left' },
                { key: 'productionYears', label: 'Bauzeitraum', align: 'text-left' },
                { key: 'ps', label: 'PS', align: 'text-right' },
                { key: '0-100', label: '0–100', align: 'text-right' },
                { key: 'autobahnPerformanceRating', label: 'Autobahn Performance', align: 'text-center' },
                { key: 'price', label: 'Preis', align: 'text-right' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`${col.align} pb-3 px-3 first:pl-0 last:pr-0 text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-600 select-none whitespace-nowrap`}
                >
                  {col.label}{sortIndicator(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCars.slice(0, 10).map(car => (
              <tr
                key={car.id}
                onClick={() => selectCar(car)}
                className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors group"
              >
                <td className="py-4 pr-3 font-semibold text-zinc-900 group-hover:text-zinc-700">
                  {car.name}
                </td>
                <td className="py-4 px-3 text-left text-sm text-zinc-500">
                  {car.productionYears}
                </td>
                <td className="py-4 px-3 text-right text-sm text-zinc-500 tabular-nums">
                  {car.ps}
                </td>
                <td className="py-4 px-3 text-right font-bold text-zinc-900 tabular-nums">
                  {car.acceleration?.['0_100'] ? `${car.acceleration['0_100'].toFixed(1)} s` : 'n/v'}
                </td>
                <td className="py-4 px-3 text-center">
                  {(() => {
                    const { label, color } = getPerformanceCategory(car.autobahnPerformanceRating)
                    return <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>
                  })()}
                </td>
                <td className="py-4 pl-3 text-right text-sm text-zinc-400 tabular-nums">
                  {formatPrice(car.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCars.length === 0 && (
          <p className="text-center py-12 text-zinc-400">Keine Autos gefunden</p>
        )}

      </div>
    </div>
  )
}
