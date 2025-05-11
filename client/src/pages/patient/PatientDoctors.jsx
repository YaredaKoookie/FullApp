import { useState } from 'react';
import { SearchIcon, FilterIcon, StarIcon, LocateIcon, CalendarIcon, ChevronRightIcon } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import useGetApprovedDoctors from '@/hooks/useGetApprovedDoctors';
import Loading from '@/components/Loading';

const DoctorsSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const {data: response, isLoading} = useGetApprovedDoctors();


  const doctors = response?.data?.doctors || [];

  if(isLoading)
    return <Loading />


  const locations = doctors.map(doc => doc.location.city);

  const specialties = doctors.map(doctor => doctor.specialization)

  // Filter doctors
  const filteredDoctors = (doctors || []).filter(doctor => {
    const matchesSearch = doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = !specialtyFilter || doctor.specialization === specialtyFilter;
    const matchesLocation = !locationFilter || doctor.location.city === locationFilter;
    
    return matchesSearch && matchesSpecialty && matchesLocation;
  });
  console.log(specialtyFilter)
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-gray-500 mt-1">Search and book appointments with specialists</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or specialty..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Specialty Filter Dropdown */}
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="inline-flex justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <div className="flex items-center">
                  <FilterIcon className="w-4 h-4 mr-2 text-gray-400" />
                  {specialtyFilter || 'Specialty'}
                </div>
                <ChevronRightIcon className="w-5 h-5 ml-2 -mr-1 text-gray-400 transform rotate-90" />
              </Menu.Button>
            </div>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 w-full mt-1 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setSpecialtyFilter('')}
                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                      >
                        All Specialties
                      </button>
                    )}
                  </Menu.Item>
                  {specialties.map((spec) => (
                    <Menu.Item key={spec}>
                      {({ active }) => (
                        <button
                          onClick={() => setSpecialtyFilter(spec)}
                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                        >
                          {spec}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Location Filter Dropdown */}
          <Menu as="div" className="relative">
            <div>
              <Menu.Button className="inline-flex justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <div className="flex items-center">
                  <LocateIcon className="w-4 h-4 mr-2 text-gray-400" />
                  {locationFilter || 'Location'}
                </div>
                <ChevronRightIcon className="w-5 h-5 ml-2 -mr-1 text-gray-400 transform rotate-90" />
              </Menu.Button>
            </div>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 w-full mt-1 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setLocationFilter('')}
                        className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                      >
                        All Locations
                      </button>
                    )}
                  </Menu.Item>
                  {locations.map((loc) => (
                    <Menu.Item key={loc}>
                      {({ active }) => (
                        <button
                          onClick={() => setLocationFilter(loc)}
                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                        >
                          {loc}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Results Count and Sort */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-500">
          Showing {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'}
        </p>
        <Menu as="div" className="relative">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <Menu.Button className="inline-flex justify-between w-[120px] px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Relevance
              <ChevronRightIcon className="w-5 h-5 ml-2 -mr-1 text-gray-400 transform rotate-90" />
            </Menu.Button>
          </div>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                    >
                      Relevance
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                    >
                      Highest Rating
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                    >
                      Earliest Available
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Doctors List */}
      <div className="space-y-4">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map(doctor => (
            <div key={doctor._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row">
                {/* Doctor Avatar */}
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                    {doctor.fullName.slice(0, 2)}
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{doctor.fullName}</h2>
                      <p className="text-indigo-600">{doctor.specialization}</p>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center">
                      <StarIcon className="w-5 h-5 text-yellow-400" />
                      <span className="ml-1 font-medium">{doctor.rating}</span>
                      <span className="ml-1 text-gray-500">({doctor.totalReviews} reviews)</span>
                    </div>
                  </div>

                  <p className="mt-2 text-gray-600">{doctor.bio || "This doctor doesn't set a biography."}</p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center text-gray-600">
                      <LocateIcon className="w-5 h-5 mr-2 text-gray-400" />
                      <span>{doctor.location.city}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                      <span>Available {doctor.weeklyAvailability[0]?.day || "Unknown"}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">Experience</span>
                      <span>{doctor.experience}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                  <button className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    View Profile
                  </button>
                  <button className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
            <button 
              onClick={() => {
                setSearchQuery("");
                setSpecialtyFilter("");
                setLocationFilter("");
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsSection;