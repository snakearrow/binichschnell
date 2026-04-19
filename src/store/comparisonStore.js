import { create } from 'zustand'

const useComparisonStore = create((set, get) => ({
  allCars: [],
  selectedCars: [],

  loadCars: async () => {
    try {
      const res = await fetch('/cars.json')
      const data = await res.json()
      set({ allCars: data.cars })
    } catch (e) {
      console.error('Failed to load cars:', e)
    }
  },

  addCar: (car) => {
    const { selectedCars } = get()
    if (!selectedCars.find(c => c.id === car.id)) {
      set({ selectedCars: [...selectedCars, car] })
    }
  },

  removeCar: (id) => {
    set(state => ({ selectedCars: state.selectedCars.filter(c => c.id !== id) }))
  },

  clearCars: () => set({ selectedCars: [] }),

  getComparisonMode: () => {
    const { selectedCars } = get()
    if (selectedCars.length === 0) return 'none'
    if (selectedCars.length === 1) return 'single'
    return 'multi'
  },

  getComparisonStats: (car) => {
    const { allCars } = get()
    const reference = car.autobahnPerformanceRating
    if (!reference) return { faster: 0, slower: 0, comparable: 0 }
    const threshold = 1.0
    let faster = 0, slower = 0, comparable = 0
    allCars.forEach(c => {
      if (c.id === car.id) return
      const other = c.autobahnPerformanceRating
      if (!other) return
      const diff = other - reference
      if (Math.abs(diff) <= threshold) comparable++
      else if (diff > 0) faster++
      else slower++
    })
    return { faster, slower, comparable }
  },

  getComparisonStatsWeighted: (car) => {
    const { allCars } = get()
    const reference = car.acceleration?.['0_100']
    if (!reference) return { faster: 0, slower: 0, comparable: 0 }
    const threshold = 0.5
    let faster = 0, slower = 0, comparable = 0
    allCars.forEach(c => {
      if (c.id === car.id) return
      const other = c.acceleration?.['0_100']
      if (!other) return
      const commonality = c.commonality ?? 50
      const diff = other - reference
      if (diff < -threshold) faster += commonality
      else if (diff > threshold) slower += commonality
      else comparable += commonality
    })
    return { faster, slower, comparable }
  },

  getComparableCars: (car) => {
    const { allCars } = get()
    const reference = car.autobahnPerformanceRating
    if (!reference) return []
    const threshold = 1.0
    return allCars
      .filter(c => {
        if (c.id === car.id) return false
        const other = c.autobahnPerformanceRating
        if (!other) return false
        return Math.abs(other - reference) <= threshold
      })
      .map(c => ({ car: c, delta: (c.autobahnPerformanceRating || 0) - reference }))
      .sort((a, b) => a.delta - b.delta)
  },
}))

export default useComparisonStore
