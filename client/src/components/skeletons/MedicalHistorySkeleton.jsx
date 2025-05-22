import { Tab } from '@headlessui/react';
import { Activity, Heart, Pill, AlertTriangle, Calendar } from 'lucide-react';

const MedicalHistorySkeleton = () => {
  const tabs = [
    { name: 'Overview', icon: Activity },
    { name: 'Conditions', icon: Heart },
    { name: 'Medications', icon: Pill },
    { name: 'Allergies', icon: AlertTriangle },
    { name: 'Timeline', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="mt-2 h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Main Content Skeleton */}
        <div className="bg-white rounded-lg shadow">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-t-lg bg-gray-100 p-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-md text-gray-600"
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="p-6">
              {/* Overview Panel Skeleton */}
              <Tab.Panel>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-6 animate-pulse">
                      <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="flex justify-between">
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Tab.Panel>

              {/* Conditions Panel Skeleton */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
                        <div className="space-y-4">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="p-3 bg-gray-50 rounded-md animate-pulse">
                              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                              <div className="h-4 w-24 bg-gray-200 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Tab.Panel>

              {/* Medications Panel Skeleton */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
                        <div className="space-y-4">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="p-3 bg-gray-50 rounded-md animate-pulse">
                              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                              <div className="h-4 w-24 bg-gray-200 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Tab.Panel>

              {/* Allergies Panel Skeleton */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-md animate-pulse">
                          <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* Timeline Panel Skeleton */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-start space-x-4 animate-pulse">
                          <div className="h-8 w-8 bg-gray-200 rounded-full" />
                          <div>
                            <div className="h-4 w-64 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistorySkeleton; 