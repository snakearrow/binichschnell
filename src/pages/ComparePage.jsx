import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useComparisonStore from '../store/comparisonStore'

const formatPrice = (price) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)

function PowertrainTypeFilter({ value, onChange }) {
  const options = ['Alle', 'Verbrenner', 'Elektro', 'Hybrid']
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            value === opt
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function HeroStats({ car, stats, activeFilter, onFilterChange }) {
  const { faster, slower, comparable } = stats

  return (
    <div className="grid grid-cols-3 gap-4 mb-12">
      <button
        onClick={() => onFilterChange(activeFilter === 'faster' ? null : 'faster')}
        className={`rounded-xl p-6 text-center transition-all ${
          activeFilter === 'faster'
            ? 'bg-red-100 ring-2 ring-red-600'
            : 'bg-red-50 hover:bg-red-100'
        }`}
      >
        <p className="text-3xl font-bold text-red-600">{faster}</p>
        <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mt-2">Schneller</p>
      </button>
      <button
        onClick={() => onFilterChange(activeFilter === 'slower' ? null : 'slower')}
        className={`rounded-xl p-6 text-center transition-all ${
          activeFilter === 'slower'
            ? 'bg-blue-100 ring-2 ring-blue-600'
            : 'bg-blue-50 hover:bg-blue-100'
        }`}
      >
        <p className="text-3xl font-bold text-blue-600">{slower}</p>
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mt-2">Langsamer</p>
      </button>
      <button
        onClick={() => onFilterChange(activeFilter === 'similar' ? null : 'similar')}
        className={`rounded-xl p-6 text-center transition-all ${
          activeFilter === 'similar'
            ? 'bg-gray-200 ring-2 ring-zinc-600'
            : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <p className="text-3xl font-bold text-zinc-600">{comparable}</p>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-2">Ähnlich</p>
      </button>
    </div>
  )
}

function getPerformanceCategory(rating) {
  if (rating < 10) return { label: 'Niedrig', color: 'bg-red-100 text-red-700' }
  if (rating < 15) return { label: 'Mittel', color: 'bg-blue-100 text-blue-700' }
  if (rating < 21) return { label: 'Gut', color: 'bg-green-100 text-green-700' }
  return { label: 'Krass', color: 'bg-violet-100 text-violet-700' }
}

function AccelerationBars({ car }) {
  const times = [
    { label: '0–50 km/h', value: car.acceleration?.['0_50'] },
    { label: '0–100 km/h', value: car.acceleration?.['0_100'] },
    { label: '80–120 km/h', value: car.acceleration?.['80_120'] },
    { label: '0–200 km/h', value: car.acceleration?.['0_200'] },
    { label: '100–200 km/h', value: car.acceleration?.['100_200'] },
  ]

  const maxTime = Math.max(...times.map(t => t.value || 0), 5)

  return (
    <div className="mb-12">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-6">Beschleunigungszeiten</p>
      <div className="space-y-4">
        {times.map((t, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-900">{t.label}</span>
              <span className="text-sm font-bold text-zinc-900 tabular-nums">{t.value ? t.value.toFixed(2) : 'n/v'}s</span>
            </div>
            <div className="bg-zinc-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-zinc-900 h-full rounded-full transition-all"
                style={{ width: t.value ? `${(t.value / maxTime) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AutobahnPerformanceCard({ car }) {
  const category = getPerformanceCategory(car.autobahnPerformanceRating)

  return (
    <div className="mb-12">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Autobahn Performance Rating</p>
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold text-zinc-900 tabular-nums">{car.autobahnPerformanceRating.toFixed(2)}</div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${category.color}`}>{category.label}</span>
      </div>
    </div>
  )
}

function VerdictCard({ faster, slower }) {
  const getVerdict = () => {
    const total = faster + slower
    if (total === 0) return 'Geht so.'

    const slowerRatio = slower / total
    if (slowerRatio > 0.65) return 'Ja.'
    if (slowerRatio < 0.35) return 'Nein.'
    return 'Geht so.'
  }

  return (
    <div className="mb-12">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Bin ich schnell?</p>
      <div className="bg-zinc-900 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-white">{getVerdict()}</p>
      </div>
    </div>
  )
}

function ComparableList({ car, comparableCars, selectedPowertrain, onFilterChange, filterMode, onSelectCar }) {
  const filteredCars = selectedPowertrain === 'Alle'
    ? comparableCars
    : comparableCars.filter(c => c.car.powertrainType === (
        selectedPowertrain === 'Elektro' ? 'electric' :
        selectedPowertrain === 'Benzin' ? 'gasoline' :
        selectedPowertrain === 'Diesel' ? 'diesel' :
        selectedPowertrain === 'Hybrid' ? 'hybrid' : ''
      ))

  const getTitle = () => {
    if (filterMode === 'faster') return 'Schnellere Autos'
    if (filterMode === 'slower') return 'Langsamere Autos'
    return 'Ähnlich schnelle Autos'
  }

  const getEmptyMessage = () => {
    if (filterMode === 'faster') return 'Keine schnelleren Autos gefunden'
    if (filterMode === 'slower') return 'Keine langsameren Autos gefunden'
    return 'Keine ähnlich schnellen Autos gefunden'
  }

  return (
    <div>
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">{getTitle()}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {['Alle', 'Elektro', 'Benzin', 'Diesel', 'Hybrid'].map(f => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedPowertrain === f
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredCars.length > 0 ? (
        <div className="space-y-3">
          {filteredCars.map(({ car: c, delta }) => (
            <div key={c.id} onClick={() => onSelectCar(c)} className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer">
              <div className="flex-1">
                <p className="font-semibold text-zinc-900">{c.name}</p>
                <p className="text-xs text-zinc-500">{c.ps} PS · {c.productionYears}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-zinc-900 tabular-nums">{c.autobahnPerformanceRating?.toFixed(2)}</p>
                <p className={`text-xs font-semibold tabular-nums ${
                  delta < -0.05 ? 'text-red-600' :
                  delta > 0.05 ? 'text-blue-600' :
                  'text-zinc-400'
                }`}>
                  {delta < -0.05 ? '−' : delta > 0.05 ? '+' : '±'}{Math.abs(delta).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-zinc-400 text-sm">{getEmptyMessage()}</p>
      )}
    </div>
  )
}

export default function ComparePage() {
  const navigate = useNavigate()
  const { selectedCars, getComparableCars, getComparisonStats, allCars } = useComparisonStore()
  const [filterPowertrain, setFilterPowertrain] = useState('Alle')
  const [filterMode, setFilterMode] = useState(null) // 'faster', 'slower', 'similar', or null
  const [powertrainTypeFilter, setPowertrainTypeFilter] = useState('Alle')

  if (selectedCars.length === 0) {
    navigate('/')
    return null
  }

  const car = selectedCars[0]
  const reference = car.autobahnPerformanceRating

  // Display count in HeroStats cards (raw count)
  const statsCount = getComparisonStats(car)

  const getFilteredCarsByType = () => {
    if (powertrainTypeFilter === 'Alle') return allCars
    const mapping = {
      'Verbrenner': ['gasoline', 'diesel'],
      'Elektro': ['electric'],
      'Hybrid': ['hybrid']
    }
    return allCars.filter(c => mapping[powertrainTypeFilter]?.includes(c.powertrainType))
  }

  const filteredCars = getFilteredCarsByType()

  // Verdict calculation (weighted by commonality)
  const getStatsWeighted = () => {
    if (!reference) return { faster: 0, slower: 0, comparable: 0 }
    let faster = 0, slower = 0, comparable = 0
    filteredCars.forEach(c => {
      if (c.id === car.id) return
      const other = c.autobahnPerformanceRating
      if (!other) return
      const commonality = c.commonality ?? 50
      if (other > reference) faster += commonality
      else if (other < reference) slower += commonality
      else comparable += commonality
    })
    return { faster, slower, comparable }
  }

  const statsWeighted = getStatsWeighted()

  const getFasterCars = () => {
    if (!reference) return []
    return filteredCars
      .filter(c => {
        if (c.id === car.id) return false
        const other = c.autobahnPerformanceRating
        if (!other) return false
        return other - reference > 1.0
      })
      .map(c => ({
        car: c,
        delta: c.autobahnPerformanceRating - reference
      }))
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 5)
  }

  const getSlowerCars = () => {
    if (!reference) return []
    return filteredCars
      .filter(c => {
        if (c.id === car.id) return false
        const other = c.autobahnPerformanceRating
        if (!other) return false
        return reference - other > 1.0
      })
      .map(c => ({
        car: c,
        delta: c.autobahnPerformanceRating - reference
      }))
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 5)
  }

  const getSimilarCars = () => {
    if (!reference) return []
    const threshold = 1.0
    return filteredCars
      .filter(c => {
        if (c.id === car.id) return false
        const other = c.autobahnPerformanceRating
        if (!other) return false
        return Math.abs(other - reference) <= threshold
      })
      .map(c => ({ car: c, delta: (c.autobahnPerformanceRating || 0) - reference }))
      .sort((a, b) => a.delta - b.delta)
  }

  const getDisplayCars = () => {
    if (filterMode === 'faster') return getFasterCars()
    if (filterMode === 'slower') return getSlowerCars()
    return getSimilarCars()
  }

  const comparableCars = getDisplayCars()

  const selectCar = (selectedCar) => {
    const { clearCars, addCar } = useComparisonStore.getState()
    clearCars()
    addCar(selectedCar)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 pt-12 pb-16">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Zurück
        </button>

        <div className="mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 mb-1">{car.name}</h1>
          <p className="text-sm text-zinc-500">{car.engine} · {car.ps} PS · {car.productionYears} · {formatPrice(car.price)}</p>
        </div>

        <PowertrainTypeFilter value={powertrainTypeFilter} onChange={setPowertrainTypeFilter} />

        <HeroStats car={car} stats={statsCount} activeFilter={filterMode} onFilterChange={setFilterMode} />
        <AccelerationBars car={car} />
        <AutobahnPerformanceCard car={car} />
        <VerdictCard faster={statsWeighted.faster} slower={statsWeighted.slower} />
        <ComparableList car={car} comparableCars={comparableCars} selectedPowertrain={filterPowertrain} onFilterChange={setFilterPowertrain} filterMode={filterMode} onSelectCar={selectCar} />
      </div>
    </div>
  )
}
