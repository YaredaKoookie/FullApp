import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Combobox, Listbox, Transition, Switch } from '@headlessui/react'
import { Search, Filter, MapPin, Star, Award, Clock, Languages, DollarSign, ChevronDown, ChevronUp, X } from 'lucide-react'
import apiClient from '@api/apiClient'
import DoctorCard from './DoctorCard'
import { useGetDoctorsStatistics } from '@api/patient'



const fetchDoctors = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiClient.get(`/patient/doctors?${queryString}`)
  return response;
}

const DoctorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState([])
  const [selectedLanguages, setSelectedLanguages] = useState([])
  const [experienceRange, setExperienceRange] = useState([0, 50])
  const [feeRange, setFeeRange] = useState([0, 5000])
  const [minRating, setMinRating] = useState(0);
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('rating:desc');
  const [page, setPage] = useState(1);
  const limit = 8;
  let specializations = ["General"];
  let languages = ["English", "Amharic"];

  const queryParams = {
    search: searchTerm,
    specialization: selectedSpecialization.join(','),
    languages: selectedLanguages.join(','),
    minExperience: experienceRange[0],
    maxExperience: experienceRange[1],
    minFee: feeRange[0],
    maxFee: feeRange[1],
    minRating,
    city: locationFilter,
    sort: sortOption,
    page,
    limit
  }


  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['doctors', queryParams],
    queryFn: () => fetchDoctors(queryParams),
    keepPreviousData: true
  })

  const {data: statistics, isLoading: staticsLoading} = useGetDoctorsStatistics();
  const doctors = data?.data?.doctors;


  if(statistics?.data){
    const statisticsData = statistics?.data;
    specializations = statisticsData?.specializations.map(s => s._id) || [];
    languages = statisticsData?.languageDistribution?.map(l => l.language) || [];
    console.log("stats", statisticsData);
  }




  const toggleSpecialization = (spec) => {
    setSelectedSpecialization(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    )
  }

  const toggleLanguage = (lang) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedSpecialization([])
    setSelectedLanguages([])
    setExperienceRange([0, 50])
    setFeeRange([0, 500])
    setMinRating(0)
    setLocationFilter('')
    setSortOption('rating:desc')
    setPage(1)
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect Doctor</h1>
          <p className="text-xl mb-8 max-w-2xl">
            Search from our network of verified healthcare professionals and book appointments with ease.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-3xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-4 border border-transparent rounded-lg bg-white/20 focus:bg-white focus:text-gray-900 placeholder-white focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
              placeholder="Search by name, specialty or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-2.5 top-2.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-md flex items-center text-sm transition-colors"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Collapsible on mobile */}
          <Transition
            show={showFilters}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="lg:w-72 bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:block">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  Reset all
                  <X className="h-4 w-4 ml-1" />
                </button>
              </div>

              {/* Specialization Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Specialization
                </h3>
                <div className="space-y-2">
                  {specializations.map((spec) => (
                    <div key={spec} className="flex items-center">
                      <Switch
                        checked={selectedSpecialization.includes(spec)}
                        onChange={() => toggleSpecialization(spec)}
                        className={`${selectedSpecialization.includes(spec) ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-5 w-9 items-center rounded-full transition-colors`}
                      >
                        <span
                          className={`${selectedSpecialization.includes(spec) ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                      <span className="ml-2 text-sm text-gray-700">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Experience: {experienceRange[0]} - {experienceRange[1]} years
                </h3>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={experienceRange[0]}
                    onChange={(e) => setExperienceRange([parseInt(e.target.value), experienceRange[1]])}
                    className="w-full mb-2 accent-blue-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={experienceRange[1]}
                    onChange={(e) => setExperienceRange([experienceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              {/* Languages Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Languages className="h-4 w-4 mr-2" />
                  Languages
                </h3>
                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div key={lang} className="flex items-center">
                      <Switch
                        checked={selectedLanguages.includes(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className={`${selectedLanguages.includes(lang) ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-5 w-9 items-center rounded-full transition-colors`}
                      >
                        <span
                          className={`${selectedLanguages.includes(lang) ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                      <span className="ml-2 text-sm text-gray-700">{lang}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Fee Range: ${feeRange[0]} - ${feeRange[1]}
                </h3>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={feeRange[0]}
                    onChange={(e) => setFeeRange([parseInt(e.target.value), feeRange[1]])}
                    className="w-full mb-2 accent-blue-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={feeRange[1]}
                    onChange={(e) => setFeeRange([feeRange[0], parseInt(e.target.value)])}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Minimum Rating: {minRating > 0 ? `${minRating}+` : 'Any'}
                </h3>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setMinRating(star === minRating ? 0 : star)}
                      className={`p-1 rounded-full ${minRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star
                        className="h-5 w-5"
                        fill={minRating >= star ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </h3>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="City or postal code"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
            </div>
          </Transition>

          {/* Doctors List */}
          <div className="flex-1">
            {/* Sort and Results Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                {isLoading ? (
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-gray-600">
                    Showing <span className="font-semibold">{data?.pagination?.limit}</span> of{' '}
                    <span className="font-semibold">{data?.pagination?.totalDoctors}</span> doctors
                  </p>
                )}
              </div>
              
              <Listbox value={sortOption} onChange={setSortOption}>
                <div className="relative w-48">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <span className="block truncate">
                      {sortOption === 'rating:desc' && 'Rating: High to Low'}
                      {sortOption === 'rating:asc' && 'Rating: Low to High'}
                      {sortOption === 'consultationFee:asc' && 'Price: Low to High'}
                      {sortOption === 'consultationFee:desc' && 'Price: High to Low'}
                      {sortOption === 'yearsOfExperience:desc' && 'Experience: High to Low'}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                      <Listbox.Option
                        value="rating:desc"
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-4 pr-4 ${
                            active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                          }`
                        }
                      >
                        Rating: High to Low
                      </Listbox.Option>
                      <Listbox.Option
                        value="rating:asc"
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-4 pr-4 ${
                            active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                          }`
                        }
                      >
                        Rating: Low to High
                      </Listbox.Option>
                      <Listbox.Option
                        value="consultationFee:asc"
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-4 pr-4 ${
                            active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                          }`
                        }
                      >
                        Price: Low to High
                      </Listbox.Option>
                      <Listbox.Option
                        value="consultationFee:desc"
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-4 pr-4 ${
                            active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                          }`
                        }
                      >
                        Price: High to Low
                      </Listbox.Option>
                      <Listbox.Option
                        value="yearsOfExperience:desc"
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-4 pr-4 ${
                            active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                          }`
                        }
                      >
                        Experience: High to Low
                      </Listbox.Option>
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-gray-200"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-red-500 font-medium">Error loading doctors</p>
                <p className="text-gray-600 mt-2">{error.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Success State */}
            {!isLoading && !isError && (
              <>
                {/* Doctors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data?.data?.doctors.map((doctor) => (
                    <DoctorCard className="" key={doctor._id} doctor={doctor} />
                  ))}
                </div>

                {/* Pagination */}
                {data?.total > limit && (
                  <div className="mt-8 flex items-center justify-between">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${page === 1 ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                    >
                      Previous
                    </button>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: Math.ceil(data.total / limit) }, (_, i) => {
                          const pageNumber = i + 1
                          // Show first page, last page, and pages around current page
                          if (
                            pageNumber === 1 ||
                            pageNumber === Math.ceil(data.total / limit) ||
                            (pageNumber >= page - 2 && pageNumber <= page + 2)
                          ) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => setPage(pageNumber)}
                                className={`px-3 py-1 rounded-md text-sm font-medium ${page === pageNumber ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                              >
                                {pageNumber}
                              </button>
                            )
                          }
                          // Show ellipsis for skipped pages
                          if (
                            (pageNumber === page - 3 && page > 4) ||
                            (pageNumber === page + 3 && page < Math.ceil(data.total / limit) - 3)
                          ) {
                            return (
                              <span key={pageNumber} className="px-3 py-1 text-gray-500">
                                ...
                              </span>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(Math.ceil(data.total / limit), p + 1))}
                      disabled={page === Math.ceil(data.total / limit)}
                      className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${page === Math.ceil(data.total / limit) ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorsPage